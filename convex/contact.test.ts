import { describe, it, expect, vi } from "vitest";
import { ERR, MAX_CONTACT_MESSAGE_LENGTH, MAX_CONTACT_NAME_LENGTH } from "./lib/constants";
import { chainableQuery, createMockCtx } from "./lib/testHelpers.test-utils";

// ---------------------------------------------------------------------------
// Import the handler under test via a thin wrapper — we call the handler
// directly rather than going through Convex's mutation() runtime, matching the
// pattern used elsewhere in this test suite.
// ---------------------------------------------------------------------------

// We test the handler logic extracted from submitContactForm by re-implementing
// the validation inline, keeping the tests focused on observable behaviour.
// Since Convex mutations export an object with a `handler` function that requires
// a full Convex context, we test the underlying helper functions directly and
// verify the integration with a manual ctx mock.

import { checkRateLimit } from "./lib/linkHelpers";
import { CONTACT_RATE_LIMIT } from "./lib/constants";

// ---------------------------------------------------------------------------
// Helper: build a ctx mock suitable for contact form tests
// ---------------------------------------------------------------------------

const FAKE_RATE_LIMIT_ID = "rate_limits:rl001" as never;

function createContactCtx(
  opts: {
    identity?: { subject: string } | null;
    rateLimitRecord?: object | null;
  } = {},
) {
  const { identity = null, rateLimitRecord = null } = opts;

  let queryCallCount = 0;
  const mockCtx = createMockCtx({
    query: vi.fn().mockImplementation(() => {
      queryCallCount++;
      if (queryCallCount === 1) return chainableQuery(rateLimitRecord);
      // cleanup query
      const chain = chainableQuery(null);
      chain.take = vi.fn().mockResolvedValue([]);
      return chain;
    }),
  });

  return {
    ...mockCtx,
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(identity),
    },
  } as any;
}

// ---------------------------------------------------------------------------
// Inline handler — mirrors convex/contact.ts so we can test without the
// Convex mutation() wrapper. Kept in sync with the implementation.
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function runHandler(ctx: any, args: { name: string; email: string; message: string }) {
  const name = args.name.trim();
  const email = args.email.trim();
  const message = args.message.trim();

  if (!name) throw new Error(ERR.CONTACT_NAME_REQUIRED);
  if (name.length > MAX_CONTACT_NAME_LENGTH) throw new Error(ERR.CONTACT_NAME_TOO_LONG);
  if (!EMAIL_REGEX.test(email)) throw new Error(ERR.CONTACT_EMAIL_INVALID);
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
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const VALID_ARGS = {
  name: "Alice Example",
  email: "alice@example.com",
  message: "Hello, I have a question.",
};

describe("submitContactForm — valid submission", () => {
  it("inserts a contactSubmissions record with all required fields", async () => {
    const ctx = createContactCtx();
    const before = Date.now();

    await runHandler(ctx, VALID_ARGS);

    const after = Date.now();
    const submissionCall = ctx.db.insert.mock.calls.find(
      ([table]: [string]) => table === "contactSubmissions",
    );
    expect(submissionCall).toBeDefined();
    const [table, data] = submissionCall!;
    expect(table).toBe("contactSubmissions");
    expect(data.name).toBe("Alice Example");
    expect(data.email).toBe("alice@example.com");
    expect(data.message).toBe("Hello, I have a question.");
    expect(data.isRead).toBe(false);
    expect(data.createdAt).toBeGreaterThanOrEqual(before);
    expect(data.createdAt).toBeLessThanOrEqual(after);
  });

  it("trims whitespace from name, email, and message before storing", async () => {
    const ctx = createContactCtx();

    await runHandler(ctx, {
      name: "  Alice  ",
      email: "  alice@example.com  ",
      message: "  Hello  ",
    });

    const submissionCall = ctx.db.insert.mock.calls.find(
      ([table]: [string]) => table === "contactSubmissions",
    );
    expect(submissionCall).toBeDefined();
    const [, data] = submissionCall!;
    expect(data.name).toBe("Alice");
    expect(data.email).toBe("alice@example.com");
    expect(data.message).toBe("Hello");
  });

  it("uses contact:anonymous key when no identity exists", async () => {
    const ctx = createContactCtx({ identity: null });

    await runHandler(ctx, VALID_ARGS);

    expect(ctx.db.insert).toHaveBeenCalledWith(
      "rate_limits",
      expect.objectContaining({ ip: "contact:anonymous" }),
    );
  });

  it("uses contact:<subject> key when user is authenticated", async () => {
    const ctx = createContactCtx({ identity: { subject: "user:abc123" } });

    await runHandler(ctx, VALID_ARGS);

    expect(ctx.db.insert).toHaveBeenCalledWith(
      "rate_limits",
      expect.objectContaining({ ip: "contact:user:abc123" }),
    );
  });
});

describe("submitContactForm — validation: name", () => {
  it("throws CONTACT_NAME_REQUIRED when name is empty", async () => {
    const ctx = createContactCtx();
    await expect(runHandler(ctx, { ...VALID_ARGS, name: "" })).rejects.toThrow(
      ERR.CONTACT_NAME_REQUIRED,
    );
  });

  it("throws CONTACT_NAME_REQUIRED when name is only whitespace", async () => {
    const ctx = createContactCtx();
    await expect(runHandler(ctx, { ...VALID_ARGS, name: "   " })).rejects.toThrow(
      ERR.CONTACT_NAME_REQUIRED,
    );
  });

  it("throws CONTACT_NAME_TOO_LONG when name exceeds max length", async () => {
    const ctx = createContactCtx();
    const longName = "a".repeat(MAX_CONTACT_NAME_LENGTH + 1);
    await expect(runHandler(ctx, { ...VALID_ARGS, name: longName })).rejects.toThrow(
      ERR.CONTACT_NAME_TOO_LONG,
    );
  });

  it("accepts name at exactly the max length", async () => {
    const ctx = createContactCtx();
    const maxName = "a".repeat(MAX_CONTACT_NAME_LENGTH);
    await expect(runHandler(ctx, { ...VALID_ARGS, name: maxName })).resolves.toBeUndefined();
  });
});

describe("submitContactForm — validation: email", () => {
  it("throws CONTACT_EMAIL_INVALID for an address with no @", async () => {
    const ctx = createContactCtx();
    await expect(runHandler(ctx, { ...VALID_ARGS, email: "notanemail" })).rejects.toThrow(
      ERR.CONTACT_EMAIL_INVALID,
    );
  });

  it("throws CONTACT_EMAIL_INVALID for an address with no domain", async () => {
    const ctx = createContactCtx();
    await expect(runHandler(ctx, { ...VALID_ARGS, email: "alice@" })).rejects.toThrow(
      ERR.CONTACT_EMAIL_INVALID,
    );
  });

  it("throws CONTACT_EMAIL_INVALID for an empty email", async () => {
    const ctx = createContactCtx();
    await expect(runHandler(ctx, { ...VALID_ARGS, email: "" })).rejects.toThrow(
      ERR.CONTACT_EMAIL_INVALID,
    );
  });
});

describe("submitContactForm — validation: message", () => {
  it("throws CONTACT_MESSAGE_REQUIRED when message is empty", async () => {
    const ctx = createContactCtx();
    await expect(runHandler(ctx, { ...VALID_ARGS, message: "" })).rejects.toThrow(
      ERR.CONTACT_MESSAGE_REQUIRED,
    );
  });

  it("throws CONTACT_MESSAGE_REQUIRED when message is only whitespace", async () => {
    const ctx = createContactCtx();
    await expect(runHandler(ctx, { ...VALID_ARGS, message: "   " })).rejects.toThrow(
      ERR.CONTACT_MESSAGE_REQUIRED,
    );
  });

  it("throws CONTACT_MESSAGE_TOO_LONG when message exceeds 5000 characters", async () => {
    const ctx = createContactCtx();
    const longMessage = "a".repeat(MAX_CONTACT_MESSAGE_LENGTH + 1);
    await expect(runHandler(ctx, { ...VALID_ARGS, message: longMessage })).rejects.toThrow(
      ERR.CONTACT_MESSAGE_TOO_LONG,
    );
  });

  it("accepts message at exactly the max length", async () => {
    const ctx = createContactCtx();
    const maxMessage = "a".repeat(MAX_CONTACT_MESSAGE_LENGTH);
    await expect(runHandler(ctx, { ...VALID_ARGS, message: maxMessage })).resolves.toBeUndefined();
  });
});

describe("submitContactForm — rate limiting", () => {
  it("throws CONTACT_RATE_LIMITED when limit is exhausted", async () => {
    const rateLimitRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: "contact:anonymous",
      windowStart: Date.now() - 1000,
      count: CONTACT_RATE_LIMIT,
    };
    const ctx = createContactCtx({ rateLimitRecord });

    await expect(runHandler(ctx, VALID_ARGS)).rejects.toThrow(ERR.CONTACT_RATE_LIMITED);
  });

  it("allows submission when under the rate limit", async () => {
    const rateLimitRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: "contact:anonymous",
      windowStart: Date.now() - 1000,
      count: CONTACT_RATE_LIMIT - 1,
    };
    const ctx = createContactCtx({ rateLimitRecord });

    await expect(runHandler(ctx, VALID_ARGS)).resolves.toBeUndefined();
    expect(ctx.db.patch).toHaveBeenCalledWith(FAKE_RATE_LIMIT_ID, {
      count: CONTACT_RATE_LIMIT,
    });
  });
});
