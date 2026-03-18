import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SizeSlider from "./SizeSlider";

const clickSpy = vi.spyOn(HTMLLabelElement.prototype, "click");

beforeEach(() => {
  clickSpy.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.querySelectorAll("label[for^='slider-haptic']").forEach((el) => el.remove());
});

function renderSlider(overrides = {}) {
  const props = { size: 512, onSizeChange: vi.fn(), ...overrides };
  render(<SizeSlider {...props} />);
  return props;
}

describe("SizeSlider", () => {
  it("renders the slider with correct value", () => {
    renderSlider({ size: 1024 });
    expect(screen.getByRole("slider")).toHaveValue("1024");
  });

  it("displays the current size", () => {
    renderSlider({ size: 512 });
    expect(screen.getByText("512 px")).toBeInTheDocument();
  });

  it("calls onSizeChange when slider value changes", () => {
    const props = renderSlider({ size: 512 });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1024" } });
    expect(props.onSizeChange).toHaveBeenCalledWith(1024);
  });

  it("creates an offscreen checkbox-switch for haptic feedback", () => {
    renderSlider();
    const label = document.querySelector("label[for^='slider-haptic']");
    expect(label).toBeInTheDocument();
    const checkbox = label!.querySelector("input[type='checkbox'][switch]");
    expect(checkbox).toBeInTheDocument();
    // Must be off-screen but NOT display:none (iOS needs it in the render tree)
    expect(label!.style.display).not.toBe("none");
    expect(label!.style.position).toBe("fixed");
  });

  it("clicks the haptic label on touchStart", () => {
    renderSlider();
    fireEvent.touchStart(screen.getByRole("slider"));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("clicks the haptic label on touchMove after throttle", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    fireEvent.touchStart(slider);
    clickSpy.mockClear();

    // Within throttle window — no click
    fireEvent.touchMove(slider);
    expect(clickSpy).not.toHaveBeenCalled();

    // After throttle window — click fires
    vi.advanceTimersByTime(80);
    fireEvent.touchMove(slider);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("throttles rapid touch events", () => {
    renderSlider();
    const slider = screen.getByRole("slider");

    fireEvent.touchStart(slider);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.touchMove(slider);
    fireEvent.touchMove(slider);
    fireEvent.touchMove(slider);
    // All within throttle window — still 1
    expect(clickSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(80);
    fireEvent.touchMove(slider);
    expect(clickSpy).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(80);
    fireEvent.touchMove(slider);
    expect(clickSpy).toHaveBeenCalledTimes(3);
  });
});
