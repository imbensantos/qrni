import { describe, it, expect } from "vitest";
import { ERR } from "./constants";

describe("collaboration authorization contracts", () => {
  it("ERR.MUST_BE_SIGNED_IN is defined for auth gates", () => {
    expect(ERR.MUST_BE_SIGNED_IN).toBeDefined();
    expect(typeof ERR.MUST_BE_SIGNED_IN).toBe("string");
  });

  it("ERR.NOT_AUTHORIZED is defined for permission gates", () => {
    expect(ERR.NOT_AUTHORIZED).toBeDefined();
    expect(typeof ERR.NOT_AUTHORIZED).toBe("string");
  });

  it("ERR.INVITE_CREATION_RATE_LIMITED is defined", () => {
    expect(ERR.INVITE_CREATION_RATE_LIMITED).toBeDefined();
    expect(typeof ERR.INVITE_CREATION_RATE_LIMITED).toBe("string");
  });

  it("ERR.INVITE_RATE_LIMITED is defined for acceptance rate limit", () => {
    expect(ERR.INVITE_RATE_LIMITED).toBeDefined();
    expect(typeof ERR.INVITE_RATE_LIMITED).toBe("string");
  });

  it("ERR.INVITE_INVALID is generic to prevent token enumeration", () => {
    const msg = ERR.INVITE_INVALID.toLowerCase();
    expect(msg).toContain("invalid");
    expect(msg).not.toContain("revoked");
  });
});
