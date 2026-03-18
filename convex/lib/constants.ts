// ============ LIMITS ============

/** Maximum namespaces a single user can own */
export const MAX_NAMESPACES_PER_USER = 3;

/** Maximum custom (non-auto, non-namespaced) short links per user */
export const MAX_CUSTOM_LINKS_PER_USER = 5;

/** Maximum URL length accepted for destination URLs */
export const MAX_URL_LENGTH = 2048;

/** Maximum description length for namespaces */
export const MAX_DESCRIPTION_LENGTH = 500;

/** Maximum name length for user profiles */
export const MAX_USER_NAME_LENGTH = 100;

// ============ RATE LIMITING ============

/** Anonymous link creation rate limit per IP per window */
export const ANONYMOUS_RATE_LIMIT = 10;

/** Authenticated user link creation rate limit per user per window */
export const AUTH_RATE_LIMIT = 100;

/** Invite acceptance rate limit per user per window */
export const INVITE_RATE_LIMIT = 10;

/** Rate limit window duration in milliseconds (1 hour) */
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// ============ TIMING ============

/** Invite TTL in milliseconds (7 days) */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Duplicate submission detection window in milliseconds */
export const DUPLICATE_WINDOW_MS = 5_000;

/** Maximum retries for generating a unique short code */
export const MAX_SHORT_CODE_ATTEMPTS = 5;

// ============ ERROR MESSAGES ============

export const ERR = {
  // Auth
  MUST_BE_SIGNED_IN: "Must be signed in",
  USER_NOT_FOUND: "User not found",
  NOT_AUTHORIZED: "Not authorized",

  // Rate limiting
  ANONYMOUS_RATE_LIMITED: "You're creating links too fast. Please wait a bit and try again.",
  AUTH_RATE_LIMITED: "You're creating links too fast. Please wait a bit and try again.",

  // Link creation
  SHORT_CODE_EXHAUSTED: "Couldn't create a short link right now. Please try again.",
  INVALID_URL: "URL must start with http:// or https://",
  URL_TOO_LONG: `URL must be ${MAX_URL_LENGTH} characters or fewer`,
  UNSAFE_URL: "This URL was flagged as potentially harmful and can't be shortened.",
  INVALID_CUSTOM_SLUG:
    "Short link name can only use letters, numbers, hyphens, and underscores (max 60 characters)",
  SLUG_TAKEN: "That short link name is already taken — try another one",
  NAME_IN_USE: "That name is already in use — try another one",
  CUSTOM_LINK_LIMIT: `You've reached the limit of ${MAX_CUSTOM_LINKS_PER_USER} custom short links. Use a namespace to create more!`,
  NAMESPACE_SLUG_TAKEN: "That name already exists in this namespace — try another one",

  // Namespace
  INVALID_NAMESPACE_SLUG: "Namespace must be 3-30 chars: lowercase letters, numbers, hyphens",
  NAMESPACE_RESERVED: "This namespace is reserved",
  NAMESPACE_TAKEN: "This namespace is already taken",
  NAMESPACE_NOT_FOUND: "Namespace not found",
  NAMESPACE_LINK_CONFLICT: "This name conflicts with an existing short link",
  NAMESPACE_LIMIT: `You've reached the limit of ${MAX_NAMESPACES_PER_USER} namespaces.`,
  DESCRIPTION_TOO_LONG: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`,

  // Collaboration
  INVALID_EMAIL: "Invalid email address",
  INVITE_NOT_FOUND: "Invite not found",
  INVITE_REVOKED: "This invite has been revoked",
  INVITE_EXPIRED: "This invite has expired",
  INVITE_WRONG_EMAIL: "This invite was sent to a different email address",
  ALREADY_OWNER: "You already own this namespace",
  ALREADY_MEMBER: "You are already a member of this namespace",
  INVITE_NOT_IN_NAMESPACE: "Invite does not belong to this namespace",
  MEMBERSHIP_NOT_FOUND: "Membership not found",
  MEMBERSHIP_NOT_IN_NAMESPACE: "Membership does not belong to this namespace",
  ONLY_OWNER_CAN_TRANSFER: "Only the owner can transfer ownership",
  TARGET_MUST_BE_MEMBER: "Target user must be a member of this namespace",

  INVITE_RATE_LIMITED: "Too many invite attempts. Please wait a bit and try again.",

  // Generic security messages (avoid leaking entity existence)
  LINK_NOT_FOUND_OR_DENIED: "Link not found or access denied",
  INVITE_INVALID: "Invalid or expired invite",

  // User
  NAME_TOO_LONG: `Name must be ${MAX_USER_NAME_LENGTH} characters or fewer`,
  AVATAR_MUST_BE_HTTPS: "Avatar URL must start with https://",
} as const;
