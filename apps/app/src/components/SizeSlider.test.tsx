import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SizeSlider from "./SizeSlider";

const mockTrigger = vi.fn();

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: mockTrigger, cancel: vi.fn(), isSupported: true }),
}));

beforeEach(() => {
  mockTrigger.mockClear();
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

  it("triggers haptic feedback on native input event", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    // Native input event — this is what fires during drag on mobile
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(mockTrigger).toHaveBeenCalledWith(15);
  });

  it("triggers haptic feedback on touchmove", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    slider.dispatchEvent(new Event("touchmove", { bubbles: true }));
    expect(mockTrigger).toHaveBeenCalledWith(15);
  });

  it("triggers haptic on each input event during continuous drag", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(mockTrigger).toHaveBeenCalledTimes(3);
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = render(<SizeSlider size={512} onSizeChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    unmount();
    mockTrigger.mockClear();
    // After unmount, events should not trigger haptics
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});
