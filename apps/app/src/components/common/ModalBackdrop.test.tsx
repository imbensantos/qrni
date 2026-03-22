import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModalBackdrop from "./ModalBackdrop";

function renderBackdrop(isOpen: boolean, onClose = vi.fn()) {
  render(
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <p>Modal content</p>
    </ModalBackdrop>,
  );
  return { onClose };
}

describe("ModalBackdrop", () => {
  it("renders children when open", () => {
    renderBackdrop(true);
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderBackdrop(false);
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("renders a dialog role element", () => {
    renderBackdrop(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose on Escape key", () => {
    const { onClose } = renderBackdrop(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the backdrop (not the content)", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ModalBackdrop isOpen={true} onClose={onClose}>
        <p>Content</p>
      </ModalBackdrop>,
    );
    const backdrop = container.querySelector(".modal-backdrop")!;
    // Simulate mousedown then click on the backdrop itself
    fireEvent.mouseDown(backdrop, { target: backdrop });
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside the modal content", () => {
    const { onClose } = renderBackdrop(true);
    const content = screen.getByText("Modal content");
    fireEvent.mouseDown(content);
    fireEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sets body overflow to hidden when open", () => {
    renderBackdrop(true);
    expect(document.body.style.overflow).toBe("hidden");
  });

  // ── I11: Focus trapping ────────────────────────────────────────────────────
  //
  // Audit finding: ModalBackdrop has no focus trap. When the modal is open,
  // Tab can move focus to elements outside the modal (e.g. background page
  // content), violating WCAG 2.1 SC 2.1.2 (No Keyboard Trap) and standard
  // dialog UX expectations.
  //
  // These tests FAIL against the current implementation because ModalBackdrop
  // does not intercept Tab keydown events to cycle focus within its subtree.

  describe("I11: focus trap", () => {
    /**
     * FAILS because ModalBackdrop does not attach a keydown handler that calls
     * event.preventDefault() on Tab. A correct focus trap must prevent the
     * browser's native tab navigation from running — otherwise focus escapes.
     *
     * jsdom does not simulate real browser tab focus movement, so we test the
     * observable side-effect of a properly implemented trap: it must call
     * preventDefault() on the Tab keydown event so the browser cannot move
     * focus to an element outside the modal.
     */
    it("calls preventDefault on Tab keydown to prevent focus from escaping the modal", () => {
      render(
        <ModalBackdrop isOpen={true} onClose={vi.fn()}>
          <button>First</button>
          <button>Second</button>
        </ModalBackdrop>,
      );

      const [first] = screen.getAllByRole("button");
      first.focus();

      // Create a Tab event and track whether preventDefault was called
      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(tabEvent, "preventDefault");

      first.dispatchEvent(tabEvent);

      // A focus trap must call preventDefault on Tab to take over focus management.
      // Current code has no Tab handler — this assertion FAILS.
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    /**
     * FAILS because ModalBackdrop does not implement focus wrapping — when Tab
     * is pressed on the last focusable element, focus escapes to the document
     * body instead of wrapping back to the first focusable element.
     */
    it("wraps focus from the last focusable element back to the first on Tab", () => {
      render(
        <ModalBackdrop isOpen={true} onClose={vi.fn()}>
          <button>First</button>
          <button>Second</button>
          <button>Last</button>
        </ModalBackdrop>,
      );

      const buttons = screen.getAllByRole("button");
      const lastButton = buttons[buttons.length - 1];
      const firstButton = buttons[0];

      // Focus the last button in the modal
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // Tab from the last element should wrap around to the first
      fireEvent.keyDown(lastButton, { key: "Tab", shiftKey: false });

      // Current code does NOT wrap — this assertion will fail
      expect(document.activeElement).toBe(firstButton);
    });

    /**
     * FAILS because ModalBackdrop does not implement reverse-Tab (Shift+Tab)
     * wrapping — pressing Shift+Tab on the first focusable element escapes the
     * modal instead of wrapping to the last element.
     */
    it("wraps focus from the first focusable element back to the last on Shift+Tab", () => {
      render(
        <ModalBackdrop isOpen={true} onClose={vi.fn()}>
          <button>First</button>
          <button>Second</button>
          <button>Last</button>
        </ModalBackdrop>,
      );

      const buttons = screen.getAllByRole("button");
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];

      // Focus the first button in the modal
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Shift+Tab from the first element should wrap to the last
      fireEvent.keyDown(firstButton, { key: "Tab", shiftKey: true });

      // Current code does NOT wrap — this assertion will fail
      expect(document.activeElement).toBe(lastButton);
    });
  });
});
