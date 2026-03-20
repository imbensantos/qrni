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
});
