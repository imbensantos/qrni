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
      throw new Error("RESEND_API_KEY is not configured");
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      throw new Error("APP_URL is not configured");
    }

    const emailFrom = process.env.EMAIL_FROM;
    if (!emailFrom) {
      throw new Error("EMAIL_FROM is not configured");
    }

    const acceptUrl = `${appUrl}/invite/${args.token}`;
    const html = buildInviteEmailHtml({
      inviterName: args.inviterName,
      namespaceName: args.namespaceName,
      role: args.role,
      acceptUrl,
    });

    // Strip newlines from user-provided values to prevent header injection
    const safeName = args.inviterName.replace(/[\r\n]/g, "");
    const safeNamespace = args.namespaceName.replace(/[\r\n]/g, "");

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: args.to,
      subject: `${safeName} invited you to collaborate on ${safeNamespace}`,
      html,
    });

    if (error) {
      throw new Error(`Failed to send invite email: ${error.message}`);
    }
  },
});
