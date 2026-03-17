import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getCachedUser,
  cacheUser,
  clearCachedUser,
  hasCachedUser,
  type CachedUser,
} from "./cached-user";

const CACHED_USER_KEY = "qrni_cached_user";

const sampleUser: CachedUser = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: "https://example.com/ada.jpg",
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// getCachedUser
// ---------------------------------------------------------------------------

describe("getCachedUser", () => {
  it("returns null when sessionStorage is empty", () => {
    expect(getCachedUser()).toBeNull();
  });

  it("returns the parsed user when one is cached", () => {
    sessionStorage.setItem(CACHED_USER_KEY, JSON.stringify(sampleUser));
    expect(getCachedUser()).toEqual(sampleUser);
  });

  it("returns null for a user with a null image", () => {
    const userWithNullImage: CachedUser = { ...sampleUser, image: null };
    sessionStorage.setItem(CACHED_USER_KEY, JSON.stringify(userWithNullImage));
    expect(getCachedUser()).toEqual(userWithNullImage);
  });

  it("returns null for a user with an undefined image", () => {
    const userWithUndefinedImage: CachedUser = {
      ...sampleUser,
      image: undefined,
    };
    sessionStorage.setItem(CACHED_USER_KEY, JSON.stringify(userWithUndefinedImage));
    // JSON.stringify converts undefined values to absent keys; parsed value is null
    const result = getCachedUser();
    expect(result).not.toBeNull();
    expect(result?.name).toBe(sampleUser.name);
    expect(result?.email).toBe(sampleUser.email);
  });

  it("returns null when sessionStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(getCachedUser()).toBeNull();
  });

  it("returns null when the stored value is invalid JSON", () => {
    sessionStorage.setItem(CACHED_USER_KEY, "not-valid-json{{{");
    expect(getCachedUser()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// cacheUser
// ---------------------------------------------------------------------------

describe("cacheUser", () => {
  it("writes the user to sessionStorage", () => {
    cacheUser(sampleUser);
    const raw = sessionStorage.getItem(CACHED_USER_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(sampleUser);
  });

  it("only persists name, email, and image (no extra fields)", () => {
    const userWithExtra = { ...sampleUser, role: "admin" } as CachedUser & {
      role: string;
    };
    cacheUser(userWithExtra);
    const stored = JSON.parse(sessionStorage.getItem(CACHED_USER_KEY)!);
    expect(stored).not.toHaveProperty("role");
    expect(stored).toEqual(sampleUser);
  });

  it("overwrites an existing cached user", () => {
    cacheUser(sampleUser);
    const updatedUser: CachedUser = { ...sampleUser, name: "Charles Babbage" };
    cacheUser(updatedUser);
    expect(getCachedUser()).toEqual(updatedUser);
  });

  it("does not throw when sessionStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => cacheUser(sampleUser)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// clearCachedUser
// ---------------------------------------------------------------------------

describe("clearCachedUser", () => {
  it("removes the user from sessionStorage", () => {
    sessionStorage.setItem(CACHED_USER_KEY, JSON.stringify(sampleUser));
    clearCachedUser();
    expect(sessionStorage.getItem(CACHED_USER_KEY)).toBeNull();
  });

  it("also removes any legacy localStorage entry", () => {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(sampleUser));
    clearCachedUser();
    expect(localStorage.getItem(CACHED_USER_KEY)).toBeNull();
  });

  it("does not throw when localStorage.removeItem throws", () => {
    // Spy on the localStorage instance directly so sessionStorage.removeItem
    // still works normally (clearCachedUser calls sessionStorage first, then
    // wraps localStorage.removeItem in a try/catch).
    vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
      throw new Error("storage error");
    });
    expect(() => clearCachedUser()).not.toThrow();
  });

  it("getCachedUser returns null after clearing", () => {
    cacheUser(sampleUser);
    clearCachedUser();
    expect(getCachedUser()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hasCachedUser
// ---------------------------------------------------------------------------

describe("hasCachedUser", () => {
  it("returns false when no user is cached", () => {
    expect(hasCachedUser()).toBe(false);
  });

  it("returns true after caching a user", () => {
    cacheUser(sampleUser);
    expect(hasCachedUser()).toBe(true);
  });

  it("returns false after clearing the cache", () => {
    cacheUser(sampleUser);
    clearCachedUser();
    expect(hasCachedUser()).toBe(false);
  });

  it("returns false when sessionStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(hasCachedUser()).toBe(false);
  });
});
