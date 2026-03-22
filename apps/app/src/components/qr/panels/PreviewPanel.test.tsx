/**
 * PreviewPanel clipboard tests — C4
 *
 * Audit finding: the Copy button calls `navigator.clipboard?.writeText(shortUrl)`
 * with no fallback and fires `trigger("success")` unconditionally, so the user
 * always sees a success signal even when the clipboard write fails or is
 * unavailable.
 *
 * These tests FAIL against the current implementation and should PASS once:
 *   1. A legacy execCommand fallback is added when navigator.clipboard is absent.
 *   2. trigger("success") is only called after the clipboard write resolves.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PreviewPanel from "./PreviewPanel";

// ── External dependency mocks ────────────────────────────────────────────────

vi.mock("qr-code-styling", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      append: vi.fn(),
      update: vi.fn(),
      download: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: mockTrigger }),
}));

vi.mock("../../ads/AdSlot", () => ({
  default: () => null,
}));

vi.mock("../../layout/AppFooter", () => ({
  default: () => null,
}));

vi.mock("./Doodles", () => ({
  default: () => null,
}));

// ── Shared mock refs ─────────────────────────────────────────────────────────

const mockTrigger = vi.fn();

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  url: "https://example.com",
  isValidUrl: true,
  fgColor: "#000000",
  bgColor: "#ffffff",
  logo: null,
  dotStyle: "rounded",
  size: 300,
  format: "png" as const,
  onFormatChange: vi.fn(),
  shortenLink: true,
  shortLinkResult: { shortCode: "abc123", linkId: "link-id-1" as any },
};

function renderPanel(overrides: Partial<typeof defaultProps> = {}) {
  return render(<PreviewPanel {...defaultProps} {...overrides} />);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PreviewPanel — C4: clipboard copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore clipboard after each test so subsequent tests start clean
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => Promise.resolve(),
        readText: () => Promise.resolve(""),
      },
      writable: true,
      configurable: true,
    });
  });

  /**
   * FAILS against current code because:
   * `navigator.clipboard?.writeText(shortUrl)` silently short-circuits when
   * navigator.clipboard is undefined — there is no execCommand fallback.
   * The test verifies document.execCommand("copy") is called as a fallback.
   */
  it("uses a legacy execCommand fallback when navigator.clipboard is undefined", async () => {
    // Remove clipboard API to simulate an environment where it is unavailable
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // jsdom does not implement execCommand — define a stub so we can spy on it
    if (!document.execCommand) {
      Object.defineProperty(document, "execCommand", {
        value: vi.fn().mockReturnValue(true),
        writable: true,
        configurable: true,
      });
    }
    const execCommandSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    await waitFor(() => {
      expect(execCommandSpy).toHaveBeenCalledWith("copy");
    });

    execCommandSpy.mockRestore();
  });

  /**
   * FAILS against current code because:
   * trigger("success") is called unconditionally immediately after
   * `navigator.clipboard?.writeText(...)` — the promise result is not awaited
   * and a rejection is never caught, so the success haptic fires even when the
   * clipboard write rejects.
   */
  it("does NOT trigger success feedback when the clipboard write fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
      writable: true,
      configurable: true,
    });

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    // Give the rejected promise time to settle
    await waitFor(() => {
      expect(mockTrigger).not.toHaveBeenCalledWith("success");
    });
  });

  /**
   * Sanity / regression guard — this test PASSES against current code.
   * It ensures a successful clipboard write continues to trigger the success
   * haptic so we don't accidentally break the happy path when fixing C4.
   */
  it("triggers success haptic when clipboard write succeeds", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith("success");
    });
    expect(writeTextMock).toHaveBeenCalled();
  });
});
