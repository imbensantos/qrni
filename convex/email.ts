"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";
import { buildInviteEmailHtml } from "./lib/emailTemplates";

export const sendInviteEmail = internalAction({
  args: {
    to: v.string(),
    inviterName: v.string(),
    namespaceName: v.string(),
    role: v.union(v.literal("editor"), v.literal("viewer")),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not set, skipping invite email");
      return;
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      console.error("APP_URL not set, skipping invite email");
      return;
    }

    const acceptUrl = `${appUrl}/invite/${args.token}`;
    const html = buildInviteEmailHtml({
      inviterName: args.inviterName,
      namespaceName: args.namespaceName,
      role: args.role,
      acceptUrl,
    });

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "QRni <no-reply@qrni.to>",
      to: args.to,
      subject: `${args.inviterName} invited you to collaborate on ${args.namespaceName}`,
      html,
    });

    if (error) {
      console.error("Failed to send invite email:", error);
    }
  },
});
