import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock navigator.vibrate BEFORE web-haptics loads so isSupported is true
const mockVibrate = vi.hoisted(() => {
  const fn = vi.fn(() => true);
  Object.defineProperty(navigator, "vibrate", {
    value: fn,
    writable: true,
    configurable: true,
  });
  return fn;
});

import SizeSlider from "./SizeSlider";

beforeEach(() => {
  mockVibrate.mockClear();
});

function renderSlider(overrides = {}) {
  const props = {
    size: 512,
    onSizeChange: vi.fn(),
    ...overrides,
  };
  render(<SizeSlider {...props} />);
  return props;
}

describe("SizeSlider", () => {
  it("renders the slider with correct value", () => {
    renderSlider({ size: 1024 });
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("1024");
  });

  it("displays the current size", () => {
    renderSlider({ size: 512 });
    expect(screen.getByText("512 px")).toBeInTheDocument();
  });

  it("calls onSizeChange when slider value changes", () => {
    const props = renderSlider({ size: 512 });
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "1024" } });
    expect(props.onSizeChange).toHaveBeenCalledWith(1024);
  });

  it("triggers navigator.vibrate on native input event", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(mockVibrate).toHaveBeenCalled();
    // Verify the vibration pattern has perceptible duration (>=10ms on-time)
    const pattern = mockVibrate.mock.calls[0][0] as number[];
    const totalVibrateDuration = pattern.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    expect(totalVibrateDuration).toBeGreaterThanOrEqual(10);
  });

  it("triggers navigator.vibrate on touchmove", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    slider.dispatchEvent(new Event("touchmove", { bubbles: true }));
    expect(mockVibrate).toHaveBeenCalled();
  });

  it("triggers vibration on each input event during continuous drag", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(mockVibrate.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = render(<SizeSlider size={512} onSizeChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    unmount();
    mockVibrate.mockClear();
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(mockVibrate).not.toHaveBeenCalled();
  });
});
