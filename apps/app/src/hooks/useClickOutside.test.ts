import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useClickOutside } from "./useClickOutside";

function setup(isOpen: boolean) {
  const onClose = vi.fn();
  const element = document.createElement("div");
  document.body.appendChild(element);

  const { unmount } = renderHook(() => {
    const ref = useRef<HTMLElement>(element);
    useClickOutside(ref, onClose, isOpen);
  });

  return { onClose, element, unmount };
}

describe("useClickOutside", () => {
  it("calls onClose when clicking outside the ref element", () => {
    const { onClose } = setup(true);
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside the ref element", () => {
    const { onClose, element } = setup(true);
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape key press", () => {
    const { onClose } = setup(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when isOpen is false", () => {
    const { onClose } = setup(false);
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cleans up event listeners on unmount", () => {
    const { onClose, unmount } = setup(true);
    unmount();
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
