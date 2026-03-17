import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Auth routes (OAuth signin/callback, OIDC discovery)
auth.addHttpRoutes(http);

// Anonymous link creation via HTTP so the real client IP can be extracted from
// request headers rather than trusting a client-supplied identifier.
// POST /api/links/anonymous  body: { destinationUrl: string }
http.route({
  path: "/api/links/anonymous",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: { destinationUrl?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.destinationUrl || typeof body.destinationUrl !== "string") {
      return new Response(JSON.stringify({ error: "destinationUrl is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract real IP from standard proxy headers; fall back to a placeholder
    // so rate limiting still functions even without a reverse proxy.
    const creatorIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    try {
      const result = await ctx.runMutation(internal.links.createAnonymousLinkInternal, {
        destinationUrl: body.destinationUrl,
        creatorIp,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Short link redirects: /{code} or /{namespace}/{slug}
// Must skip paths reserved for auth (/.well-known/, /api/auth/)
http.route({
  pathPrefix: "/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Let auth routes pass through (this handler should not be reached for
    // auth paths if Convex resolves specific prefixes first, but guard anyway)
    if (path.startsWith("/api/auth/") || path.startsWith("/.well-known/")) {
      return new Response("Not found", { status: 404 });
    }

    const trimmed = path.replace(/^\//, "");

    if (!trimmed) {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }

    const parts = trimmed.split("/").filter(Boolean);
    let link;

    if (parts.length >= 2) {
      const [namespaceSlug, slug] = parts;
      const namespace = await ctx.runQuery(internal.redirects.getNamespaceBySlug, { slug: namespaceSlug });
      if (namespace) {
        link = await ctx.runQuery(internal.redirects.getNamespacedLink, { namespaceId: namespace._id, slug });
      }
    }

    if (!link && parts.length === 1) {
      link = await ctx.runQuery(internal.redirects.getLinkByCode, { shortCode: parts[0] });
    }

    if (!link) {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }

    await ctx.runMutation(internal.redirects.incrementClickCount, { linkId: link._id });

    return new Response(null, { status: 302, headers: { Location: link.destinationUrl } });
  }),
});

export default http;
