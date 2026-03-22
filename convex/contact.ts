import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { checkRateLimit } from "./lib/linkHelpers";
import {
  CONTACT_RATE_LIMIT,
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_CONTACT_NAME_LENGTH,
  ERR,
} from "./lib/constants";
import { isValidEmail } from "./lib/validation";

export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim();
    const message = args.message.trim();

    if (!name) throw new Error(ERR.CONTACT_NAME_REQUIRED);
    if (name.length > MAX_CONTACT_NAME_LENGTH) throw new Error(ERR.CONTACT_NAME_TOO_LONG);
    if (!isValidEmail(email)) throw new Error(ERR.CONTACT_EMAIL_INVALID);
    if (!message) throw new Error(ERR.CONTACT_MESSAGE_REQUIRED);
    if (message.length > MAX_CONTACT_MESSAGE_LENGTH) throw new Error(ERR.CONTACT_MESSAGE_TOO_LONG);

    const identity = await ctx.auth.getUserIdentity();
    const rateLimitKey = identity ? `contact:${identity.subject}` : `contact:anonymous`;

    await checkRateLimit(ctx, rateLimitKey, CONTACT_RATE_LIMIT, ERR.CONTACT_RATE_LIMITED, true);

    await ctx.db.insert("contactSubmissions", {
      name,
      email,
      message,
      createdAt: Date.now(),
      isRead: false,
    });
  },
});
