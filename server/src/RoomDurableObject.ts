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
}

const SOLO_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export class RoomDurableObject extends DurableObject {
  private stateCache: DurableRoomState | null = null;

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
    const soloExpiresAt = now + SOLO_TIMEOUT_MS;

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
      soloExpiresAt,
      createdAt: now,
    };

    await this.saveState(state);
    // Set authoritative Cloudflare alarm for 30 minutes solo expiration
    await this.ctx.storage.setAlarm(soloExpiresAt);

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
    if (tokenHash && tokenHash !== state.inviteTokenHash) {
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

    if (body.inviteTokenHash !== state.inviteTokenHash) {
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
      await this.saveState(state);
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
    state.participants = state.participants.filter((p) => p.id !== body.participantId);

    if (state.participants.length === 0) {
      // Both participants have left; close and clean up room
      state.status = "closed";
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
      this.stateCache = null;
      return new Response(JSON.stringify({ success: true, closed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Exactly 1 participant remains: restart 30-minute solo countdown
    const now = Date.now();
    state.status = "waiting";
    state.soloExpiresAt = now + SOLO_TIMEOUT_MS;
    await this.ctx.storage.setAlarm(state.soloExpiresAt);
    await this.saveState(state);

    this.broadcast({
      type: "room_state",
      state: state.status,
      participants: state.participants,
      soloExpiresAt: state.soloExpiresAt,
    });

    return new Response(JSON.stringify({ success: true, state }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Authoritative alarm triggered when 30-minute solo timer expires
   */
  async alarm(): Promise<void> {
    const state = await this.getState();
    if (!state) return;

    // Only expire if room still has fewer than 2 participants
    if (state.participants.length < 2) {
      state.status = "expired";
      this.broadcast({
        type: "error",
        code: "ROOM_EXPIRED",
        message: "The room has expired after 30 minutes of inactivity.",
      });

      // Close all active WebSockets
      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.close(4008, "Room Expired");
        } catch {
          // Socket already closed
        }
      }

      await this.ctx.storage.deleteAll();
      this.stateCache = null;
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

    if (tokenHash !== state.inviteTokenHash) {
      return new Response("Invalid token", { status: 403 });
    }

    const pair = new WebSocketPair();
    const [clientWs, serverWs] = Object.values(pair);

    this.ctx.acceptWebSocket(serverWs, [participantId || "guest"]);

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
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      // Forward WebRTC signaling (offer, answer, candidate, peer_ready) to peer
      if (
        data.type === "offer" ||
        data.type === "answer" ||
        data.type === "candidate" ||
        data.type === "peer_ready"
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

  async webSocketClose(ws: WebSocket): Promise<void> {
    const tags = this.ctx.getTags(ws);
    const participantId = tags[0];
    if (participantId) {
      // Participant disconnected
      const state = await this.getState();
      if (state && state.status === "active") {
        // Switch to waiting with 30-min countdown
        state.status = "waiting";
        state.soloExpiresAt = Date.now() + SOLO_TIMEOUT_MS;
        await this.ctx.storage.setAlarm(state.soloExpiresAt);
        await this.saveState(state);

        this.broadcast({
          type: "room_state",
          state: state.status,
          participants: state.participants,
          soloExpiresAt: state.soloExpiresAt,
        });
      }
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
