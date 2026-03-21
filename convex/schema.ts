import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    // Auth fields (from @convex-dev/auth)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    googleId: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_google_id", ["googleId"]),

  namespaces: defineTable({
    owner: v.id("users"),
    slug: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["owner"]),

  namespace_members: defineTable({
    namespace: v.id("namespaces"),
    user: v.id("users"),
    role: v.union(v.literal("editor"), v.literal("viewer")),
    invitedBy: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_namespace", ["namespace"])
    .index("by_user", ["user"])
    .index("by_namespace_user", ["namespace", "user"]),

  namespace_invites: defineTable({
    namespace: v.id("namespaces"),
    role: v.union(v.literal("editor"), v.literal("viewer")),
    type: v.union(v.literal("email"), v.literal("link")),
    email: v.optional(v.string()),
    token: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.optional(v.float64()),
    revoked: v.boolean(),
  })
    .index("by_namespace", ["namespace"])
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  // shortCode is the full routable path (e.g. "abc1234" or "myns/page").
  // namespaceSlug stores only the namespace-local portion (e.g. "page").
  // This is intentional denormalization: shortCode enables O(1) redirect
  // lookups without a join, while namespaceSlug supports scoped queries
  // within a namespace via the by_namespace_slug composite index.
  links: defineTable({
    shortCode: v.string(),
    namespace: v.optional(v.id("namespaces")),
    namespaceSlug: v.optional(v.string()),
    destinationUrl: v.string(),
    creatorIp: v.optional(v.string()),
    owner: v.optional(v.id("users")),
    autoSlug: v.optional(v.boolean()),
    createdAt: v.number(),
    clickCount: v.number(),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    ogSiteName: v.optional(v.string()),
    ogFetchedAt: v.optional(v.number()),
  })
    .index("by_short_code", ["shortCode"])
    .index("by_namespace_slug", ["namespace", "namespaceSlug"])
    .index("by_owner", ["owner"])
    .index("by_creator_ip", ["creatorIp"]),

  // The "ip" field doubles as a user-scoped key for authenticated rate limits
  // (prefixed with "user:"), so the by_ip index serves both anonymous and
  // authenticated lookups. The by_window_start index supports cleanup of
  // expired records.
  rate_limits: defineTable({
    ip: v.string(),
    windowStart: v.number(),
    count: v.number(),
  })
    .index("by_ip", ["ip"])
    .index("by_window_start", ["windowStart"]),

  audit_log: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    timestamp: v.number(),
  })
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_action_timestamp", ["action", "timestamp"]),

  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.string(),
    createdAt: v.number(),
    isRead: v.boolean(),
  }).index("by_created_at", ["createdAt"]),
});
