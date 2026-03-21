import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkDuplicateSubmission,
  generateUniqueShortCode,
  checkAnonymousRateLimit,
  checkAuthRateLimit,
} from "./linkHelpers";
import {
  ERR,
  ANONYMOUS_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  DUPLICATE_WINDOW_MS,
} from "./constants";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------
import { chainableQuery, createMockCtx } from "./testHelpers.test-utils";

const FAKE_LINK_ID = "links:abc123" as never;
const FAKE_USER_ID = "users:xyz789" as never;
const FAKE_NAMESPACE_ID = "namespaces:ns001" as never;
const FAKE_RATE_LIMIT_ID = "rate_limits:rl001" as never;

// ---------------------------------------------------------------------------
// checkDuplicateSubmission
// ---------------------------------------------------------------------------
describe("checkDuplicateSubmission", () => {
  it("returns null when no recent anonymous link matches", async () => {
    const chain = chainableQuery(null);
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const result = await checkDuplicateSubmission(ctx as never, {
      kind: "anonymous",
      creatorIp: "1.2.3.4",
      destinationUrl: "https://example.com",
    });
    expect(result).toBeNull();
  });

  it("returns existing link when anonymous duplicate is within the dedup window", async () => {
    const recentLink = {
      _id: FAKE_LINK_ID,
      shortCode: "abc1234",
      destinationUrl: "https://example.com",
      createdAt: Date.now() - 1000, // 1 second ago
    };
    const chain = chainableQuery(recentLink);
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const result = await checkDuplicateSubmission(ctx as never, {
      kind: "anonymous",
      creatorIp: "1.2.3.4",
      destinationUrl: "https://example.com",
    });
    expect(result).toEqual({ shortCode: "abc1234", linkId: FAKE_LINK_ID });
  });

  it("returns null when anonymous link is outside the dedup window", async () => {
    const oldLink = {
      _id: FAKE_LINK_ID,
      shortCode: "abc1234",
      destinationUrl: "https://example.com",
      createdAt: Date.now() - DUPLICATE_WINDOW_MS - 1000,
    };
    const chain = chainableQuery(oldLink);
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const result = await checkDuplicateSubmission(ctx as never, {
      kind: "anonymous",
      creatorIp: "1.2.3.4",
      destinationUrl: "https://example.com",
    });
    expect(result).toBeNull();
  });

  it("returns null when anonymous link URL does not match", async () => {
    const recentLink = {
      _id: FAKE_LINK_ID,
      shortCode: "abc1234",
      destinationUrl: "https://other.com",
      createdAt: Date.now() - 1000,
    };
    const chain = chainableQuery(recentLink);
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const result = await checkDuplicateSubmission(ctx as never, {
      kind: "anonymous",
      creatorIp: "1.2.3.4",
      destinationUrl: "https://example.com",
    });
    expect(result).toBeNull();
  });

  it("returns existing link for authenticated duplicate", async () => {
    const recentLink = {
      _id: FAKE_LINK_ID,
      shortCode: "xyz7890",
      destinationUrl: "https://example.com",
      createdAt: Date.now() - 500,
    };
    const chain = chainableQuery(recentLink);
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const result = await checkDuplicateSubmission(ctx as never, {
      kind: "authenticated",
      ownerId: FAKE_USER_ID,
      destinationUrl: "https://example.com",
    });
    expect(result).toEqual({ shortCode: "xyz7890", linkId: FAKE_LINK_ID });
  });

  it("returns null for authenticated when shortCode does not match", async () => {
    const recentLink = {
      _id: FAKE_LINK_ID,
      shortCode: "xyz7890",
      destinationUrl: "https://example.com",
      createdAt: Date.now() - 500,
    };
    const chain = chainableQuery(recentLink);
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const result = await checkDuplicateSubmission(ctx as never, {
      kind: "authenticated",
      ownerId: FAKE_USER_ID,
      destinationUrl: "https://example.com",
      shortCode: "different",
    });
    expect(result).toBeNull();
  });

  it("returns existing link for namespaced duplicate", async () => {
    const existingLink = {
      _id: FAKE_LINK_ID,
      shortCode: "ns12345",
      destinationUrl: "https://example.com",
      createdAt: Date.now() - 500,
    };
    const chain = chainableQuery(existingLink);
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const result = await checkDuplicateSubmission(ctx as never, {
      kind: "namespaced",
      namespaceId: FAKE_NAMESPACE_ID,
      slug: "my-link",
      destinationUrl: "https://example.com",
    });
    expect(result).toEqual({ shortCode: "ns12345", linkId: FAKE_LINK_ID });
  });
});

// ---------------------------------------------------------------------------
// generateUniqueShortCode
// ---------------------------------------------------------------------------
describe("generateUniqueShortCode", () => {
  it("returns a short code when no collision on first attempt", async () => {
    const chain = chainableQuery(null); // no existing link
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    const code = await generateUniqueShortCode(ctx as never);
    expect(typeof code).toBe("string");
    expect(code.length).toBe(7);
  });

  it("retries and succeeds when first attempt collides", async () => {
    const existing = { _id: FAKE_LINK_ID, shortCode: "taken01" };
    let callCount = 0;

    const ctx = createMockCtx({
      query: vi.fn().mockImplementation(() => {
        callCount++;
        // First call returns existing (collision), second returns null (success)
        return chainableQuery(callCount <= 1 ? existing : null);
      }),
    });

    const code = await generateUniqueShortCode(ctx as never);
    expect(typeof code).toBe("string");
    expect(code.length).toBe(7);
    expect(callCount).toBe(2);
  });

  it("throws after exhausting all attempts", async () => {
    const existing = { _id: FAKE_LINK_ID, shortCode: "taken01" };
    const chain = chainableQuery(existing); // always collides
    const ctx = createMockCtx({ query: vi.fn().mockReturnValue(chain) });

    await expect(generateUniqueShortCode(ctx as never)).rejects.toThrow(ERR.SHORT_CODE_EXHAUSTED);
  });
});

// ---------------------------------------------------------------------------
// checkAnonymousRateLimit
// ---------------------------------------------------------------------------
describe("checkAnonymousRateLimit", () => {
  const IP = "192.168.1.1";

  it("creates a new rate limit record when none exists", async () => {
    // First query (rate limit lookup) returns null, second query (cleanup) returns []
    let callCount = 0;
    const ctx = createMockCtx({
      query: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return chainableQuery(null);
        // cleanup query
        const chain = chainableQuery(null);
        chain.take = vi.fn().mockResolvedValue([]);
        return chain;
      }),
    });

    await checkAnonymousRateLimit(ctx as never, IP);
    expect(ctx.db.insert).toHaveBeenCalledWith("rate_limits", {
      ip: IP,
      windowStart: expect.any(Number),
      count: 1,
    });
  });

  it("increments count when within active window and under limit", async () => {
    const existingRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: IP,
      windowStart: Date.now() - 1000, // recent, within window
      count: 3,
    };

    let callCount = 0;
    const ctx = createMockCtx({
      query: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return chainableQuery(existingRecord);
        const chain = chainableQuery(null);
        chain.take = vi.fn().mockResolvedValue([]);
        return chain;
      }),
    });

    await checkAnonymousRateLimit(ctx as never, IP);
    expect(ctx.db.patch).toHaveBeenCalledWith(FAKE_RATE_LIMIT_ID, { count: 4 });
  });

  it("throws when at rate limit within active window", async () => {
    const existingRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: IP,
      windowStart: Date.now() - 1000,
      count: ANONYMOUS_RATE_LIMIT,
    };

    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(existingRecord)),
    });

    await expect(checkAnonymousRateLimit(ctx as never, IP)).rejects.toThrow(
      ERR.ANONYMOUS_RATE_LIMITED,
    );
  });

  it("resets window when existing record has expired", async () => {
    const expiredRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: IP,
      windowStart: Date.now() - RATE_LIMIT_WINDOW_MS - 1000, // expired
      count: 50,
    };

    let callCount = 0;
    const ctx = createMockCtx({
      query: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return chainableQuery(expiredRecord);
        const chain = chainableQuery(null);
        chain.take = vi.fn().mockResolvedValue([]);
        return chain;
      }),
    });

    await checkAnonymousRateLimit(ctx as never, IP);
    expect(ctx.db.patch).toHaveBeenCalledWith(FAKE_RATE_LIMIT_ID, {
      windowStart: expect.any(Number),
      count: 1,
    });
  });

  it("cleans up expired records from other IPs", async () => {
    const expiredOther = {
      _id: "rate_limits:expired1" as never,
      ip: "10.0.0.1",
      windowStart: Date.now() - RATE_LIMIT_WINDOW_MS - 5000,
      count: 5,
    };

    let callCount = 0;
    const ctx = createMockCtx({
      query: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return chainableQuery(null); // no record for IP
        // cleanup query returns expired records
        const chain = chainableQuery(null);
        chain.take = vi.fn().mockResolvedValue([expiredOther]);
        return chain;
      }),
    });

    await checkAnonymousRateLimit(ctx as never, IP);
    expect(ctx.db.delete).toHaveBeenCalledWith(expiredOther._id);
  });
});

// ---------------------------------------------------------------------------
// checkAuthRateLimit
// ---------------------------------------------------------------------------
describe("checkAuthRateLimit", () => {
  const USER_KEY = `user:${FAKE_USER_ID}`;

  it("creates a new rate limit record with user: prefix when none exists", async () => {
    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(null)),
    });

    await checkAuthRateLimit(ctx as never, FAKE_USER_ID);
    expect(ctx.db.insert).toHaveBeenCalledWith("rate_limits", {
      ip: USER_KEY,
      windowStart: expect.any(Number),
      count: 1,
    });
  });

  it("increments count when under limit", async () => {
    const existingRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: USER_KEY,
      windowStart: Date.now() - 1000,
      count: 5,
    };
    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(existingRecord)),
    });

    await checkAuthRateLimit(ctx as never, FAKE_USER_ID);
    expect(ctx.db.patch).toHaveBeenCalledWith(FAKE_RATE_LIMIT_ID, { count: 6 });
  });

  it("throws when at AUTH_RATE_LIMIT within active window", async () => {
    const existingRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: USER_KEY,
      windowStart: Date.now() - 1000,
      count: AUTH_RATE_LIMIT,
    };
    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(existingRecord)),
    });

    await expect(checkAuthRateLimit(ctx as never, FAKE_USER_ID)).rejects.toThrow(
      ERR.AUTH_RATE_LIMITED,
    );
  });

  it("resets window when expired", async () => {
    const expiredRecord = {
      _id: FAKE_RATE_LIMIT_ID,
      ip: USER_KEY,
      windowStart: Date.now() - RATE_LIMIT_WINDOW_MS - 1000,
      count: AUTH_RATE_LIMIT,
    };
    const ctx = createMockCtx({
      query: vi.fn().mockReturnValue(chainableQuery(expiredRecord)),
    });

    await checkAuthRateLimit(ctx as never, FAKE_USER_ID);
    expect(ctx.db.patch).toHaveBeenCalledWith(FAKE_RATE_LIMIT_ID, {
      windowStart: expect.any(Number),
      count: 1,
    });
  });
});
