import { DurableObject } from "cloudflare:workers";

export interface ParticipantRecord {
  id: string;
  role: "host" | "guest";
  joinedAt: number;
  lastPingAt: number;
}

export interface DurableRoomState {
  roomId: string;
  inviteTokenHash: string;
  status: "waiting" | "active" | "expired" | "closed";
  participants: ParticipantRecord[];
  soloExpiresAt: number | null;
  createdAt: number;
  disconnectGraceExpiresAt?: number | null;
  disconnectedParticipants?: Record<string, number>;
}

const DISCONNECT_GRACE_MS = 45 * 1000; // 45-second disconnect grace period for active calls

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export class RoomDurableObject extends DurableObject {
  private stateCache: DurableRoomState | null = null;
  private wsMessageCounters = new Map<WebSocket, { count: number; windowStart: number }>();

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    try {
      // Respond to heartbeat pings at the Cloudflare network edge without waking the DO
      this.ctx.setWebSocketAutoResponse(
        new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}')
      );
    } catch {
      // In testing environments where WebSocketRequestResponsePair is absent
    }
  }

  private async getState(): Promise<DurableRoomState | null> {
    if (!this.stateCache) {
      this.stateCache = (await this.ctx.storage.get<DurableRoomState>("room_state")) || null;
    }
    return this.stateCache;
  }

  private async saveState(state: DurableRoomState): Promise<void> {
    this.stateCache = state;
    await this.ctx.storage.put("room_state", state);
  }

  /**
   * Handle incoming HTTP & WebSocket requests to this Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // WebSocket upgrade for real-time room coordination
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request, url);
    }

    if (request.method === "POST" && pathname.endsWith("/create")) {
      return this.handleCreate(request);
    }

    if (request.method === "GET" && pathname.endsWith("/status")) {
      return this.handleGetStatus(request);
    }

    if (request.method === "POST" && pathname.endsWith("/join")) {
      return this.handleJoin(request);
    }

    if (request.method === "POST" && pathname.endsWith("/leave")) {
      return this.handleLeave(request);
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Initialize a new authoritative room session
   */
  private async handleCreate(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      roomId: string;
      inviteTokenHash: string;
      hostParticipantId: string;
    };

    const existing = await this.getState();
    if (existing && existing.status !== "closed" && existing.status !== "expired") {
      return new Response(JSON.stringify({ error: "Room already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = Date.now();

    const state: DurableRoomState = {
      roomId: body.roomId,
      inviteTokenHash: body.inviteTokenHash,
      status: "waiting",
      participants: [
        {
          id: body.hostParticipantId,
          role: "host",
          joinedAt: now,
          lastPingAt: now,
        },
      ],
      soloExpiresAt: null,
      createdAt: now,
    };

    await this.saveState(state);
    // Room stays open as long as at least one person is inside (no solo expiration alarm)

    return new Response(JSON.stringify({ success: true, state }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Retrieve current room state and validate token
   */
  private async handleGetStatus(request: Request): Promise<Response> {
    const state = await this.getState();
    if (!state || state.status === "closed" || state.status === "expired") {
      return new Response(
        JSON.stringify({ error: "Room not found or expired", code: "ROOM_EXPIRED" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const tokenHash = url.searchParams.get("tokenHash");
    if (tokenHash && !timingSafeEqual(tokenHash, state.inviteTokenHash)) {
      return new Response(
        JSON.stringify({ error: "Invalid invite token", code: "INVALID_TOKEN" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        roomId: state.roomId,
        status: state.status,
        participantCount: state.participants.length,
        canJoin: state.participants.length < 2,
        soloExpiresAt: state.soloExpiresAt,
        createdAt: state.createdAt,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  /**
   * Join or Rejoin an existing room (strict 2-person participant limit)
   */
  private async handleJoin(request: Request): Promise<Response> {
    const state = await this.getState();
    if (!state || state.status === "closed" || state.status === "expired") {
      return new Response(
        JSON.stringify({ error: "Room does not exist or has expired", code: "ROOM_EXPIRED" }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json()) as {
      participantId: string;
      inviteTokenHash: string;
    };

    if (!timingSafeEqual(body.inviteTokenHash, state.inviteTokenHash)) {
      return new Response(
        JSON.stringify({ error: "Invalid invite token", code: "INVALID_TOKEN" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingParticipant = state.participants.find((p) => p.id === body.participantId);
    const now = Date.now();

    // Rejoin scenario
    if (existingParticipant) {
      existingParticipant.lastPingAt = now;
      if (state.disconnectedParticipants && state.disconnectedParticipants[body.participantId]) {
        delete state.disconnectedParticipants[body.participantId];
        if (Object.keys(state.disconnectedParticipants).length === 0 && state.status === "active") {
          state.disconnectGraceExpiresAt = null;
          await this.ctx.storage.deleteAlarm();
        }
      }
      await this.saveState(state);
      this.broadcast({
        type: "peer_connection_status",
        participantId: body.participantId,
        status: "connected",
      });
      return new Response(
        JSON.stringify({
          success: true,
          role: existingParticipant.role,
          state,
          rejoined: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Strict 2-participant room limit
    if (state.participants.length >= 2) {
      return new Response(
        JSON.stringify({
          error: "Room is full. KunekTayo allows a maximum of 2 participants.",
          code: "ROOM_FULL",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add 2nd participant (guest)
    const newParticipant: ParticipantRecord = {
      id: body.participantId,
      role: "guest",
      joinedAt: now,
      lastPingAt: now,
    };
    state.participants.push(newParticipant);

    // Both participants are now present: room becomes active and solo expiration countdown is cancelled
    state.status = "active";
    state.soloExpiresAt = null;
    state.disconnectGraceExpiresAt = null;
    state.disconnectedParticipants = {};
    await this.ctx.storage.deleteAlarm();
    await this.saveState(state);

    this.broadcast({
      type: "room_state",
      state: state.status,
      participants: state.participants,
      soloExpiresAt: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        role: "guest",
        state,
        rejoined: false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  /**
   * Leave room & trigger 30-minute solo countdown or cleanup
   */
  private async handleLeave(request: Request): Promise<Response> {
    const state = await this.getState();
    if (!state) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const body = (await request.json()) as { participantId: string };
    const leaving = state.participants.find((p) => p.id === body.participantId);
    const isHost = leaving?.role === "host";

    state.participants = state.participants.filter((p) => p.id !== body.participantId);
    if (state.disconnectedParticipants) {
      delete state.disconnectedParticipants[body.participantId];
    }
    state.disconnectGraceExpiresAt = null;

    if (isHost || state.participants.length === 0) {
      // Host left or all participants have left; close and clean up room
      state.status = "closed";
      await this.ctx.storage.deleteAlarm();
      this.broadcast({
        type: "room_state",
        state: "closed",
        reason: isHost ? "host_left" : "all_left",
      });
      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.close(4000, "Room Closed");
        } catch {}
      }
      await this.ctx.storage.deleteAll();
      this.stateCache = null;
      return new Response(JSON.stringify({ success: true, closed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Exactly 1 participant remains: stay in waiting state without expiring
    state.status = "waiting";
    state.soloExpiresAt = null;
    await this.ctx.storage.deleteAlarm();
    await this.saveState(state);

    this.broadcast({
      type: "room_state",
      state: state.status,
      participants: state.participants,
      soloExpiresAt: null,
    });
    this.broadcast({
      type: "peer_left",
      participantId: body.participantId,
    });

    return new Response(JSON.stringify({ success: true, state }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Authoritative alarm triggered when disconnect grace period ends
   */
  async alarm(): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    const now = Date.now();

    // 1. Check if disconnect grace period expired during active room
    if (
      state.status === "active" &&
      state.disconnectGraceExpiresAt &&
      now >= state.disconnectGraceExpiresAt
    ) {
      const disconnectedIds = Object.keys(state.disconnectedParticipants || {});
      const stillDisconnected = disconnectedIds.filter(
        (id) => this.ctx.getWebSockets(id).length === 0
      );

      if (stillDisconnected.length > 0) {
        // Participant failed to reconnect within grace period; treat as left
        state.participants = state.participants.filter(
          (p) => !stillDisconnected.includes(p.id)
        );
        state.disconnectedParticipants = {};
        state.disconnectGraceExpiresAt = null;

        if (state.participants.length === 0) {
          state.status = "closed";
          await this.ctx.storage.deleteAll();
          this.stateCache = null;
          return;
        }

        // Exactly 1 participant remaining -> switch to waiting; stays alive as long as 1 person is inside
        state.status = "waiting";
        state.soloExpiresAt = null;
        await this.ctx.storage.deleteAlarm();
        await this.saveState(state);

        this.broadcast({
          type: "room_state",
          state: state.status,
          participants: state.participants,
          soloExpiresAt: null,
        });

        for (const leftId of stillDisconnected) {
          this.broadcast({
            type: "peer_left",
            participantId: leftId,
          });
        }
        return;
      } else {
        // Reconnected before alarm ran
        state.disconnectedParticipants = {};
        state.disconnectGraceExpiresAt = null;
        await this.saveState(state);
        return;
      }
    }
  }

  /**
   * Handle WebSocket connections for live room state sync and heartbeats
   */
  private async handleWebSocket(request: Request, url: URL): Promise<Response> {
    const tokenHash = url.searchParams.get("tokenHash");
    const participantId = url.searchParams.get("participantId");
    const state = await this.getState();

    if (!state || state.status === "expired" || state.status === "closed") {
      return new Response("Room expired", { status: 410 });
    }

    if (!tokenHash || !timingSafeEqual(tokenHash, state.inviteTokenHash)) {
      return new Response("Invalid token", { status: 403 });
    }

    const pair = new WebSocketPair();
    const [clientWs, serverWs] = Object.values(pair);

    this.ctx.acceptWebSocket(serverWs, [participantId || "guest"]);

    // If this participant was previously marked disconnected during grace period, restore them
    if (
      participantId &&
      state.disconnectedParticipants &&
      state.disconnectedParticipants[participantId]
    ) {
      delete state.disconnectedParticipants[participantId];
      if (Object.keys(state.disconnectedParticipants).length === 0) {
        state.disconnectGraceExpiresAt = null;
        if (state.status === "active") {
          await this.ctx.storage.deleteAlarm();
        }
      }
      await this.saveState(state);

      this.broadcast({
        type: "peer_connection_status",
        participantId,
        status: "connected",
      });
      this.broadcast({
        type: "peer_ready",
      });
    }

    // Send initial authoritative state to client
    serverWs.send(
      JSON.stringify({
        type: "room_state",
        state: state.status,
        participants: state.participants,
        soloExpiresAt: state.soloExpiresAt,
      })
    );

    return new Response(null, { status: 101, webSocket: clientWs });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // 1. Message size check (max 64 KB)
    if (typeof message === "string" && message.length > 65536) {
      return;
    }

    // 2. Per-connection rate limiting (max 30 msgs per second)
    const now = Date.now();
    let counter = this.wsMessageCounters.get(ws);
    if (!counter || now - counter.windowStart >= 1000) {
      counter = { count: 1, windowStart: now };
      this.wsMessageCounters.set(ws, counter);
    } else {
      counter.count++;
      if (counter.count > 30) {
        // Drop message when flooding
        return;
      }
    }

    try {
      const data = JSON.parse(message.toString());
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      // Forward WebRTC signaling (offer, answer, candidate, peer_ready, datachannel_fallback) to peer
      if (
        data.type === "offer" ||
        data.type === "answer" ||
        data.type === "candidate" ||
        data.type === "peer_ready" ||
        data.type === "datachannel_fallback"
      ) {
        this.forwardToPeer(ws, data);
      }
    } catch {
      // Ignore malformed message
    }
  }

  private forwardToPeer(senderWs: WebSocket, payload: unknown): void {
    const str = JSON.stringify(payload);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== senderWs) {
        try {
          ws.send(str);
        } catch {
          // Peer socket error
        }
      }
    }
  }

  async webSocketClose(
    ws: WebSocket,
    _code?: number,
    _reason?: string,
    _wasClean?: boolean
  ): Promise<void> {
    this.wsMessageCounters.delete(ws);
    const tags = this.ctx.getTags(ws);
    const participantId = tags[0];
    if (!participantId) return;

    // Check if the participant still has another active WebSocket (e.g. quick replacement)
    const activeSockets = this.ctx.getWebSockets(participantId);
    if (activeSockets.length > 0) {
      return;
    }

    const state = await this.getState();
    if (!state || state.status === "closed" || state.status === "expired") {
      return;
    }

    // When an active call participant's socket closes (e.g. network handover, sleep, edge reset):
    // DO NOT immediately demote room to "waiting"! Grant a 45-second grace period for auto-reconnection.
    if (state.status === "active") {
      const now = Date.now();
      state.disconnectedParticipants = state.disconnectedParticipants || {};
      state.disconnectedParticipants[participantId] = now;
      state.disconnectGraceExpiresAt = now + DISCONNECT_GRACE_MS;

      await this.ctx.storage.setAlarm(state.disconnectGraceExpiresAt);
      await this.saveState(state);

      this.broadcast({
        type: "peer_connection_status",
        participantId,
        status: "disconnected",
        graceExpiresAt: state.disconnectGraceExpiresAt,
      });
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.warn("WebSocket error in RoomDurableObject:", error);
    try {
      ws.close(1011, "WebSocket unexpected error");
    } catch {
      // Ignored
    }
  }

  private broadcast(payload: unknown): void {
    const str = JSON.stringify(payload);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(str);
      } catch {
        // Socket error ignored
      }
    }
  }
}
