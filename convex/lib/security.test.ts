import { describe, it, expect, vi } from "vitest";
import { generateShortCode } from "./shortCode";
import { checkInviteRateLimit } from "./linkHelpers";
import { ERR, INVITE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "./constants";
import { chainableQuery, createMockCtx } from "./testHelpers";

const FAKE_USER_ID = "users:xyz789" as never;
const FAKE_RATE_LIMIT_ID = "rate_limits:rl001" as never;

// ---------------------------------------------------------------------------
// Invite token entropy
// ---------------------------------------------------------------------------
describe("invite token entropy", () => {
  it("generates tokens of at least 32 characters for invites", () => {
    const token = generateShortCode(32);
    expect(token.length).toBe(32);
  });

  it("tokens contain only alphanumeric characters", () => {
    const token = generateShortCode(32);
    expect(token).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it("100 generated tokens are all unique", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateShortCode(32));
    }
    expect(tokens.size).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Error message consistency -- prevent enumeration
// ---------------------------------------------------------------------------
describe("error message consistency — prevent enumeration", () => {
  it("ERR.LINK_NOT_FOUND_OR_DENIED exists and is generic", () => {
    expect(ERR.LINK_NOT_FOUND_OR_DENIED).toBeDefined();
    expect(typeof ERR.LINK_NOT_FOUND_OR_DENIED).toBe("string");
    // Should not reveal whether the link exists or the user lacks permission
    const msg = ERR.LINK_NOT_FOUND_OR_DENIED.toLowerCase();
    expect(msg).toContain("not found");
    expect(msg).toContain("denied");
  });

  it("ERR.INVITE_INVALID exists and is generic", () => {
    expect(ERR.INVITE_INVALID).toBeDefined();
    expect(typeof ERR.INVITE_INVALID).toBe("string");
    // Should combine not-found/expired/revoked into one message
    const msg = ERR.INVITE_INVALID.toLowerCase();
    expect(msg).toContain("invalid");
  });

  it("generic errors don't contain 'not found', 'expired', or 'revoked' separately", () => {
    // LINK_NOT_FOUND_OR_DENIED should not say just "not found" without "denied"
    const linkMsg = ERR.LINK_NOT_FOUND_OR_DENIED.toLowerCase();
    expect(linkMsg).toContain("denied");

    // INVITE_INVALID should not leak whether it's specifically expired or revoked
    const inviteMsg = ERR.INVITE_INVALID.toLowerCase();
    expect(inviteMsg).not.toContain("revoked");
    // "expired" is OK if combined with "invalid" since the message says "Invalid or expired"
    // but it should NOT say ONLY "expired" without "invalid"
    if (inviteMsg.includes("expired")) {
      expect(inviteMsg).toContain("invalid");
    }
  });
});

// ---------------------------------------------------------------------------
// checkInviteRateLimit
// ---------------------------------------------------------------------------
describe("checkInviteRateLimit", () => {
  it("allows first invite attempt", async () => {
    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(null)),
    });

    await expect(checkInviteRateLimit(ctx as never, FAKE_USER_ID)).resolves.toBeUndefined();
    expect(ctx.db.insert).toHaveBeenCalledWith("rate_limits", {
      ip: `invite:${FAKE_USER_ID}`,
      windowStart: expect.any(Number),
      count: 1,
    });
  });

  it("blocks after exceeding invite rate limit", async () => {
    const existingRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: `invite:${FAKE_USER_ID}`,
      windowStart: Date.now() - 1000,
      count: INVITE_RATE_LIMIT,
    };
    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(existingRecord)),
    });

    await expect(checkInviteRateLimit(ctx as never, FAKE_USER_ID)).rejects.toThrow(
      ERR.INVITE_RATE_LIMITED,
    );
  });

  it("uses invite: prefix for rate limit key", async () => {
    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(null)),
    });

    await checkInviteRateLimit(ctx as never, FAKE_USER_ID);

    // Verify the insert used the invite: prefix, not user: prefix
    const insertCall = ctx.db.insert.mock.calls[0];
    expect(insertCall[1].ip).toBe(`invite:${FAKE_USER_ID}`);
    expect(insertCall[1].ip).toMatch(/^invite:/);
  });
});
