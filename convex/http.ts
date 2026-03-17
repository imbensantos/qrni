import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { checkUrlSafety } from "./safeBrowsing";
import { ERR } from "./lib/constants";

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

    // Extract real client IP from standard proxy headers.
    // Security note: In production behind Vercel/Convex, X-Forwarded-For is set
    // by the platform's reverse proxy and cannot be spoofed by end users — the
    // platform overwrites or appends to the header at the edge. This is safe as
    // long as the Convex HTTP endpoint is not exposed directly to the internet
    // without a trusted proxy in front.
    const creatorIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "";

    if (!creatorIp) {
      return new Response(JSON.stringify({ error: "Unable to determine client IP" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Check URL safety before creating the link
      const safetyResult = await checkUrlSafety(body.destinationUrl);
      if (!safetyResult.safe) {
        return new Response(
          JSON.stringify({
            error: "This URL was flagged as potentially harmful and can't be shortened.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

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
      const safeMessages: string[] = [
        ERR.ANONYMOUS_RATE_LIMITED,
        ERR.INVALID_URL,
        ERR.URL_TOO_LONG,
        ERR.UNSAFE_URL,
      ];
      const safeMessage = safeMessages.includes(message) ? message : "Something went wrong";
      return new Response(JSON.stringify({ error: safeMessage }), {
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
      const namespace = await ctx.runQuery(internal.redirects.getNamespaceBySlug, {
        slug: namespaceSlug,
      });
      if (namespace) {
        link = await ctx.runQuery(internal.redirects.getNamespacedLink, {
          namespaceId: namespace._id,
          slug,
        });
      }
    }

    if (!link && parts.length === 1) {
      link = await ctx.runQuery(internal.redirects.getLinkByCode, {
        shortCode: parts[0],
      });
    }

    if (!link) {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }

    // Security: re-validate protocol before redirecting to prevent open redirect
    // attacks if a stored URL was somehow modified or inserted without validation.
    if (!link.destinationUrl.startsWith("http://") && !link.destinationUrl.startsWith("https://")) {
      return new Response("Invalid redirect target", { status: 400 });
    }

    await ctx.runMutation(internal.redirects.incrementClickCount, {
      linkId: link._id,
    });

    return new Response(null, {
      status: 302,
      headers: { Location: link.destinationUrl },
    });
  }),
});

export default http;
