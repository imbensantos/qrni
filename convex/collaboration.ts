import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateShortCode } from "./lib/shortCode";
import { logAudit } from "./lib/auditLog";
import { checkPermission } from "./lib/permissions";
import { isValidEmail } from "./lib/validation";
import { checkInviteRateLimit } from "./lib/linkHelpers";
import { INVITE_TTL_MS, ERR } from "./lib/constants";

const roleValidator = v.union(v.literal("editor"), v.literal("viewer"));

export const createEmailInvite = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    email: v.string(),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    // Only owners can invite members
    await checkPermission(ctx, args.namespaceId, user._id, "owner");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    const normalizedEmail = args.email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      throw new Error(ERR.INVALID_EMAIL);
    }

    // Use 32 chars (~190 bits of entropy) to make brute-force infeasible
    const token = generateShortCode(32);

    const inviteId = await ctx.db.insert("namespace_invites", {
      namespace: namespace._id,
      role: args.role,
      type: "email",
      email: normalizedEmail,
      token,
      createdBy: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + INVITE_TTL_MS,
      revoked: false,
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "member.invite",
      resourceType: "invite",
      resourceId: String(inviteId),
      metadata: {
        namespace: String(namespace._id),
        email: normalizedEmail,
        role: args.role,
      },
    });

    // Schedule the invite email (fire-and-forget — don't block the mutation)
    await ctx.scheduler.runAfter(0, internal.email.sendInviteEmail, {
      to: normalizedEmail,
      inviterName: user.name || user.email || "Someone",
      namespaceName: namespace.slug,
      role: args.role,
      token,
    });

    return inviteId;
  },
});

export const createInviteLink = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    // Only owners can invite members
    await checkPermission(ctx, args.namespaceId, user._id, "owner");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    // Use 32 chars (~190 bits of entropy) to make brute-force infeasible
    const token = generateShortCode(32);

    const inviteId = await ctx.db.insert("namespace_invites", {
      namespace: namespace._id,
      role: args.role,
      type: "link",
      token,
      createdBy: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + INVITE_TTL_MS,
      revoked: false,
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "member.invite",
      resourceType: "invite",
      resourceId: String(inviteId),
      metadata: { namespace: String(namespace._id), role: args.role },
    });

    return { token };
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    // Rate limit invite acceptance to prevent brute-force token guessing
    await checkInviteRateLimit(ctx, user._id);

    const invite = await ctx.db
      .query("namespace_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    // Use a single generic error for all invalid invite states to prevent
    // enumeration of valid tokens, expired vs revoked status, etc.
    if (!invite) throw new Error(ERR.INVITE_INVALID);
    if (invite.revoked) throw new Error(ERR.INVITE_INVALID);

    if (invite.expiresAt !== undefined && Date.now() > invite.expiresAt) {
      throw new Error(ERR.INVITE_INVALID);
    }

    if (invite.type === "email") {
      if (!invite.email || !user.email || invite.email !== user.email.toLowerCase().trim()) {
        throw new Error(ERR.INVITE_INVALID);
      }
    }

    const namespace = await ctx.db.get(invite.namespace);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    if (namespace.owner === user._id) {
      throw new Error(ERR.ALREADY_OWNER);
    }

    const existingMembership = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace_user", (q) =>
        q.eq("namespace", invite.namespace).eq("user", user._id),
      )
      .first();

    if (existingMembership) {
      throw new Error(ERR.ALREADY_MEMBER);
    }

    const membershipId = await ctx.db.insert("namespace_members", {
      namespace: invite.namespace,
      user: user._id,
      role: invite.role,
      invitedBy: invite.createdBy,
      joinedAt: Date.now(),
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "member.join",
      resourceType: "member",
      resourceId: String(membershipId),
      metadata: { namespace: String(invite.namespace), role: invite.role },
    });

    return membershipId;
  },
});

export const revokeInvite = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    inviteId: v.id("namespace_invites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    await checkPermission(ctx, args.namespaceId, user._id, "owner");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error(ERR.INVITE_NOT_FOUND);
    if (invite.namespace !== args.namespaceId) throw new Error(ERR.INVITE_NOT_IN_NAMESPACE);

    await ctx.db.patch(args.inviteId, { revoked: true });

    await logAudit(ctx, {
      userId: user._id,
      action: "invite.revoke",
      resourceType: "invite",
      resourceId: String(args.inviteId),
      metadata: { namespace: String(args.namespaceId) },
    });
  },
});

export const removeMember = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    membershipId: v.id("namespace_members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    await checkPermission(ctx, args.namespaceId, user._id, "owner");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error(ERR.MEMBERSHIP_NOT_FOUND);
    if (membership.namespace !== args.namespaceId) throw new Error(ERR.MEMBERSHIP_NOT_IN_NAMESPACE);

    await ctx.db.delete(args.membershipId);

    await logAudit(ctx, {
      userId: user._id,
      action: "member.remove",
      resourceType: "member",
      resourceId: String(args.membershipId),
      metadata: { namespace: String(args.namespaceId) },
    });
  },
});

// Issue #4: Individual ctx.db.get() calls are already optimized in Convex
// (they're batched at the engine level). Promise.all is used here to express
// the parallelism intent, which is the idiomatic Convex pattern.
export const listMembers = query({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    await checkPermission(ctx, args.namespaceId, userId, "viewer");

    const members = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .take(100);

    return await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db.get(member.user);
        return {
          _id: member._id,
          role: member.role,
          joinedAt: member.joinedAt,
          invitedBy: member.invitedBy,
          user: memberUser
            ? {
                _id: memberUser._id,
                name: memberUser.name,
                email: memberUser.email,
              }
            : null,
        };
      }),
    );
  },
});

export const listInvites = query({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    await checkPermission(ctx, args.namespaceId, userId, "viewer");

    const now = Date.now();
    const invites = await ctx.db
      .query("namespace_invites")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .take(50);

    // Filter out expired invites — callers only need active/pending ones
    return invites.filter((invite) => invite.expiresAt === undefined || invite.expiresAt > now);
  },
});

export const getInviteByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("namespace_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite || invite.revoked) return null;
    if (invite.expiresAt !== undefined && Date.now() > invite.expiresAt) return null;

    const namespace = await ctx.db.get(invite.namespace);
    if (!namespace) return null;

    const inviter = await ctx.db.get(invite.createdBy);

    return {
      namespaceName: namespace.slug,
      role: invite.role,
      type: invite.type,
      email: invite.email,
      inviterName: inviter?.name || inviter?.email || "Someone",
    };
  },
});

export const transferOwnership = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);
    if (namespace.owner !== userId) throw new Error(ERR.ONLY_OWNER_CAN_TRANSFER);

    if (args.newOwnerId === userId) throw new Error(ERR.ALREADY_OWNER);

    // Verify target is an existing member
    const membership = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace_user", (q) =>
        q.eq("namespace", args.namespaceId).eq("user", args.newOwnerId),
      )
      .first();
    if (!membership) throw new Error(ERR.TARGET_MUST_BE_MEMBER);

    // Transfer: set new owner on namespace
    await ctx.db.patch(args.namespaceId, { owner: args.newOwnerId });

    // Remove new owner from members table (owners aren't in members)
    await ctx.db.delete(membership._id);

    // Add old owner as editor member
    await ctx.db.insert("namespace_members", {
      namespace: args.namespaceId,
      user: userId,
      role: "editor",
      invitedBy: args.newOwnerId,
      joinedAt: Date.now(),
    });

    await logAudit(ctx, {
      userId,
      action: "namespace.transfer",
      resourceType: "namespace",
      resourceId: String(args.namespaceId),
      metadata: { newOwner: String(args.newOwnerId) },
    });
  },
});
