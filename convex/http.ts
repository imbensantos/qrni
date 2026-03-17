import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Auth routes (OAuth signin/callback, OIDC discovery)
auth.addHttpRoutes(http);

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
