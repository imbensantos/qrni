import { action } from "./_generated/server";
import { v } from "convex/values";

export const checkUrl = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    // TODO: Safe Browsing is effectively disabled without GOOGLE_SAFE_BROWSING_API_KEY.
    // Configure the env var in the Convex dashboard to enable URL threat checking.
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (!apiKey) return { safe: true };

    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "qrni", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: args.url }],
          },
        }),
      }
    );

    const data = await response.json();
    return { safe: !data.matches || data.matches.length === 0 };
  },
});
