interface Env {
  SIGNALING: Fetcher;
}

/**
 * Cloudflare Pages Function: /api/[[route]]
 * Proxies all /api/* HTTP requests and WebSocket upgrades internally to the
 * signaling worker via Cloudflare Service Binding ("SIGNALING").
 *
 * This completely conceals the backend worker URL from public view.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.env.SIGNALING) {
    // Transparently forward HTTP and WebSocket connections over Cloudflare's private mesh
    return context.env.SIGNALING.fetch(context.request);
  }

  return new Response(
    JSON.stringify({
      error:
        "Cloudflare Pages Service Binding 'SIGNALING' is not configured. Please bind 'SIGNALING' to your Worker in Cloudflare Pages Settings -> Functions.",
      code: "SERVICE_BINDING_NOT_CONFIGURED",
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
};
