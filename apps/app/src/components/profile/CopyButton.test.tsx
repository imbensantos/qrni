import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CopyButton from "./CopyButton";

// The clipboard stub (writeText: () => Promise.resolve()) is defined in
// test/setup.ts and is available on navigator.clipboard throughout all tests.

describe("CopyButton", () => {
  it("renders a copy button with the correct title", () => {
    render(<CopyButton text="https://example.com" />);
    expect(screen.getByTitle("Copy URL")).toBeDefined();
  });

  it("shows the copied checkmark after a successful click", async () => {
    const user = userEvent.setup();
    render(<CopyButton text="https://example.com" />);
    const btn = screen.getByTitle("Copy URL");
    await user.click(btn);
    // The component transitions to "copied" state — the button gains the CSS class
    await waitFor(() => {
      expect(btn.className).toContain("copied");
    });
  });

  it("shows an error state when writeText rejects", async () => {
    // Override the stub to simulate a clipboard failure
    const original = navigator.clipboard.writeText;
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error("not allowed"));

    const user = userEvent.setup();
    render(<CopyButton text="https://example.com" />);
    const btn = screen.getByTitle("Copy URL");
    await user.click(btn);
    // legacyCopy also fails in jsdom (no execCommand), so state becomes "error"
    await waitFor(() => {
      expect(btn.className).toContain("error");
    });

    navigator.clipboard.writeText = original;
  });
});
