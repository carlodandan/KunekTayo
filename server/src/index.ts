import { RoomDurableObject } from "./RoomDurableObject";

export interface Env {
  ROOMS: DurableObjectNamespace<RoomDurableObject>;
}

export { RoomDurableObject };

// In-memory rate limiting map (IP -> timestamps array)
const rateLimits = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests: number, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (rateLimits.get(ip) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    rateLimits.set(ip, timestamps);
    return false; // Rate limited
  }

  timestamps.push(now);
  rateLimits.set(ip, timestamps);

  // Periodic cleanup if map grows
  if (rateLimits.size > 1000) {
    for (const [k, v] of rateLimits.entries()) {
      if (v.filter((t) => now - t < windowMs).length === 0) {
        rateLimits.delete(k);
      }
    }
  }

  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const clientIp = request.headers.get("cf-connecting-ip") || "client-dev";

    const origin = request.headers.get("origin") || "*";
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
      "Access-Control-Max-Age": "86400",
    };

    // CORS preflight handling for web previews and direct API calls
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Body size guard: reject payloads > 64 KB
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 65536) {
      return new Response(
        JSON.stringify({ error: "Payload too large (max 64 KB)", code: "PAYLOAD_TOO_LARGE" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Health check
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "KunekTayo Signaling & Room State",
          timestamp: Date.now(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /api/rooms -> Create a new room (Rate limit: 15 per minute)
    if (request.method === "POST" && pathname === "/api/rooms") {
      if (!checkRateLimit(`create:${clientIp}`, 15)) {
        return new Response(
          JSON.stringify({ error: "Too many room creation requests. Please wait.", code: "RATE_LIMITED" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
        );
      }

      try {
        const body = (await request.json()) as {
          roomId: string;
          inviteTokenHash: string;
          hostParticipantId: string;
        };

        if (!body.roomId || !/^[a-zA-Z0-9_-]{4,64}$/.test(body.roomId)) {
          return new Response(
            JSON.stringify({ error: "Invalid roomId format", code: "INVALID_ROOM_ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!body.inviteTokenHash || !/^[a-fA-F0-9]{64}$/.test(body.inviteTokenHash)) {
          return new Response(
            JSON.stringify({ error: "Invalid inviteTokenHash format (must be 64-char SHA256 hex)", code: "INVALID_HASH" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const id = env.ROOMS.idFromName(body.roomId);
        const stub = env.ROOMS.get(id);

        const res = await stub.fetch(new Request("https://room-do/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }));

        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Match /api/rooms/:roomId/*
    const roomMatch = pathname.match(/^\/api\/rooms\/([a-zA-Z0-9_-]{4,64})(\/.*)?$/);
    if (roomMatch) {
      const roomId = roomMatch[1];
      const subpath = roomMatch[2] || "";

      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      // WebSocket connection upgrade
      if (subpath === "/ws") {
        return stub.fetch(request);
      }

      // GET /api/rooms/:roomId/status
      if (request.method === "GET" && (subpath === "" || subpath === "/status")) {
        const res = await stub.fetch(new Request(`https://room-do/status?${url.searchParams.toString()}`));
        const data = await res.text();
        return new Response(data, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/rooms/:roomId/join (Rate limit: 30 per minute)
      if (request.method === "POST" && subpath === "/join") {
        if (!checkRateLimit(`join:${clientIp}`, 30)) {
          return new Response(
            JSON.stringify({ error: "Too many join attempts. Please slow down.", code: "RATE_LIMITED" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
          );
        }

        const res = await stub.fetch(new Request("https://room-do/join", {
          method: "POST",
          headers: request.headers,
          body: request.body,
        }));
        const data = await res.text();
        return new Response(data, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/rooms/:roomId/leave
      if (request.method === "POST" && subpath === "/leave") {
        const res = await stub.fetch(new Request("https://room-do/leave", {
          method: "POST",
          headers: request.headers,
          body: request.body,
        }));
        const data = await res.text();
        return new Response(data, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
