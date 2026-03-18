import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WebHaptics } from "web-haptics";
import SizeSlider from "./SizeSlider";

const triggerSpy = vi.spyOn(WebHaptics.prototype, "trigger");

beforeEach(() => {
  triggerSpy.mockClear();
});

afterEach(() => {
  document.querySelectorAll("label[for^='web-haptics']").forEach((el) => el.remove());
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

  it("triggers haptic on change with nudge preset", () => {
    renderSlider();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1024" } });
    expect(triggerSpy.mock.calls[0][0]).toBe("nudge");
  });

  it("triggers haptic on each change during drag", () => {
    renderSlider();
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "256" } });
    fireEvent.change(slider, { target: { value: "768" } });
    fireEvent.change(slider, { target: { value: "1024" } });
    expect(triggerSpy).toHaveBeenCalledTimes(3);
    expect(triggerSpy.mock.calls[0][0]).toBe("nudge");
  });
});
