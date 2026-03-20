import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DotStyleSelector from "./DotStyleSelector";
import { DOT_STYLES } from "../../../utils/constants";

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

function renderSelector(overrides = {}) {
  const props = {
    dotStyle: "square",
    onDotStyleChange: vi.fn(),
    ...overrides,
  };
  render(<DotStyleSelector {...props} />);
  return props;
}

describe("DotStyleSelector", () => {
  it("renders all 6 dot style options", () => {
    renderSelector();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(6);
  });

  it("renders all dot style labels", () => {
    renderSelector();
    for (const ds of DOT_STYLES) {
      expect(screen.getByText(ds.label)).toBeInTheDocument();
    }
  });

  it("selected style has aria-checked true", () => {
    renderSelector({ dotStyle: "dots" });
    const dotsButton = screen.getByRole("radio", { name: /Dots/i });
    expect(dotsButton).toHaveAttribute("aria-checked", "true");
  });

  it("non-selected styles have aria-checked false", () => {
    renderSelector({ dotStyle: "dots" });
    const squareButton = screen.getByRole("radio", { name: /Square/i });
    expect(squareButton).toHaveAttribute("aria-checked", "false");
  });

  it("selected style has active class", () => {
    renderSelector({ dotStyle: "rounded" });
    const roundedButton = screen.getByRole("radio", { name: /Rounded/i });
    expect(roundedButton.className).toContain("active");
  });

  it("clicking a style calls onDotStyleChange with the style id", () => {
    const props = renderSelector({ dotStyle: "square" });
    fireEvent.click(screen.getByRole("radio", { name: /Blob/i }));
    expect(props.onDotStyleChange).toHaveBeenCalledWith("extra-rounded");
  });
});
