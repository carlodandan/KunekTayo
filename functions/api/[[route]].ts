interface Env {
  SIGNALING: Fetcher;
}

/**
 * Cloudflare Pages Function: /api/[[route]]
 * Proxies all /api/* HTTP requests and WebSocket upgrades internally to the
 * signaling worker via Cloudflare Service Binding ("SIGNALING").
 *
 * Provides CORS support for native desktop (Windows) and mobile (Android) Tauri clients.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get("origin") || "*";

  // Handle CORS preflight for native desktop (Tauri) and mobile apps
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (context.env.SIGNALING) {
    const response = await context.env.SIGNALING.fetch(context.request);

    // If the response is a WebSocket upgrade (101), return directly to preserve socket handshake
    if (response.status === 101) {
      return response;
    }

    // Attach CORS headers to standard HTTP responses for native desktop/mobile clients
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", origin);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      error:
        "Cloudflare Pages Service Binding 'SIGNALING' is not configured. Please bind 'SIGNALING' to your Worker in Cloudflare Pages Settings -> Functions.",
      code: "SERVICE_BINDING_NOT_CONFIGURED",
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
      },
    }
  );
};
