import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  pathPrefix: "/s/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathAfterS = url.pathname.replace(/^\/s\//, "");

    if (!pathAfterS) {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }

    const parts = pathAfterS.split("/");
    let link;

    if (parts.length >= 2) {
      const [namespaceSlug, slug] = parts;
      const namespace = await ctx.runQuery(internal.redirects.getNamespaceBySlug, { slug: namespaceSlug });
      if (namespace) {
        link = await ctx.runQuery(internal.redirects.getNamespacedLink, { namespaceId: namespace._id, slug });
      }
    } else {
      link = await ctx.runQuery(internal.redirects.getLinkByCode, { shortCode: parts[0] });
    }

    if (!link) {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }

    await ctx.runMutation(internal.redirects.incrementClickCount, { linkId: link._id });

    return new Response(null, { status: 301, headers: { Location: link.destinationUrl } });
  }),
});

export default http;
