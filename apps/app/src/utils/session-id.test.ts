import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to isolate the module-level `sessionId` cache between tests
// by dynamically importing the module fresh each time.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("getSessionId", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset module registry so the module-level `sessionId` variable resets
    vi.resetModules();
  });

  it("returns a UUID-like string", async () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
    });
    vi.stubGlobal("crypto", { randomUUID: () => "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" });

    const { getSessionId } = await import("./session-id");
    const id = getSessionId();
    expect(id).toMatch(UUID_REGEX);
  });

  it("returns the same value on repeated calls", async () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
    });
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-2222-3333-4444-555555555555" });

    const { getSessionId } = await import("./session-id");
    const first = getSessionId();
    const second = getSessionId();
    expect(first).toBe(second);
  });

  it("reads from sessionStorage if a value already exists", async () => {
    const existing = "existing-uuid-1234-5678-abcdef012345";
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn(() => existing),
      setItem: vi.fn(),
    });

    const { getSessionId } = await import("./session-id");
    expect(getSessionId()).toBe(existing);
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  it("creates and stores a new UUID when sessionStorage is empty", async () => {
    const freshUuid = "ffffffff-aaaa-bbbb-cccc-dddddddddddd";
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal("crypto", { randomUUID: () => freshUuid });

    const { getSessionId } = await import("./session-id");
    const id = getSessionId();
    expect(id).toBe(freshUuid);
    expect(sessionStorage.setItem).toHaveBeenCalledWith("qrni_session_id", freshUuid);
  });
});
