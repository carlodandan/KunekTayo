import { RoomDurableObject } from "./RoomDurableObject";

export interface Env {
  ROOMS: DurableObjectNamespace<RoomDurableObject>;
}

export { RoomDurableObject };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight handling for web previews
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Health check
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "healthy", service: "KunekTayo Signaling & Room State" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /api/rooms -> Create a new room
    if (request.method === "POST" && pathname === "/api/rooms") {
      try {
        const body = (await request.json()) as {
          roomId: string;
          inviteTokenHash: string;
          hostParticipantId: string;
        };

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
    const roomMatch = pathname.match(/^\/api\/rooms\/([a-zA-Z0-9_-]+)(\/.*)?$/);
    if (roomMatch) {
      const roomId = roomMatch[1];
      const subpath = roomMatch[2] || "";

      const id = env.ROOMS.idFromName(roomId);
      const stub = env.ROOMS.get(id);

      // WebSocket connection upgrade
      if (subpath === "/ws") {
        return stub.fetch(request);
      }

      // GET /api/rooms/:roomId/status or GET /api/rooms/:roomId
      if (request.method === "GET" && (subpath === "" || subpath === "/status")) {
        const res = await stub.fetch(new Request(`https://room-do/status?${url.searchParams.toString()}`));
        const data = await res.text();
        return new Response(data, {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST /api/rooms/:roomId/join
      if (request.method === "POST" && subpath === "/join") {
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
