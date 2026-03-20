import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ColorPicker from "./ColorPicker";

// Mock web-haptics — the hook just returns a no-op trigger
vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

function renderPicker(overrides = {}) {
  const props = {
    fgColor: "#000000",
    onFgColorChange: vi.fn(),
    bgColor: "#ffffff",
    onBgColorChange: vi.fn(),
    ...overrides,
  };
  render(<ColorPicker {...props} />);
  return props;
}

describe("ColorPicker", () => {
  it("renders Foreground and Background labels", () => {
    renderPicker();
    expect(screen.getByText("Foreground")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
  });

  it("renders the Colors section label", () => {
    renderPicker();
    expect(screen.getByText("Colors")).toBeInTheDocument();
  });

  it("shows current foreground color value", () => {
    renderPicker({ fgColor: "#ff0000" });
    expect(screen.getByText("#FF0000")).toBeInTheDocument();
  });

  it("shows current background color value", () => {
    renderPicker({ bgColor: "#00ff00" });
    expect(screen.getByText("#00FF00")).toBeInTheDocument();
  });

  it("calls onFgColorChange when foreground input changes", () => {
    const props = renderPicker();
    const fgInput = screen.getByLabelText("Foreground color");
    fireEvent.change(fgInput, { target: { value: "#ff0000" } });
    expect(props.onFgColorChange).toHaveBeenCalledWith("#ff0000");
  });

  it("calls onBgColorChange when background input changes", () => {
    const props = renderPicker();
    const bgInput = screen.getByLabelText("Background color");
    fireEvent.change(bgInput, { target: { value: "#00ff00" } });
    expect(props.onBgColorChange).toHaveBeenCalledWith("#00ff00");
  });

  describe("transparent swatch", () => {
    it("renders the transparent swatch button", () => {
      renderPicker();
      expect(screen.getByRole("button", { name: "Transparent background" })).toBeInTheDocument();
    });

    it("calls onBgColorChange with 'transparent' when swatch is clicked", () => {
      const props = renderPicker();
      const swatch = screen.getByRole("button", { name: "Transparent background" });
      fireEvent.click(swatch);
      expect(props.onBgColorChange).toHaveBeenCalledWith("transparent");
    });

    it("marks the transparent swatch as pressed when bgColor is transparent", () => {
      renderPicker({ bgColor: "transparent" });
      const swatch = screen.getByRole("button", { name: "Transparent background" });
      expect(swatch).toHaveAttribute("aria-pressed", "true");
    });

    it("marks the transparent swatch as not pressed when bgColor is a hex color", () => {
      renderPicker({ bgColor: "#ffffff" });
      const swatch = screen.getByRole("button", { name: "Transparent background" });
      expect(swatch).toHaveAttribute("aria-pressed", "false");
    });

    it("shows TRANSPARENT label when bgColor is transparent", () => {
      renderPicker({ bgColor: "transparent" });
      expect(screen.getByText("TRANSPARENT")).toBeInTheDocument();
    });

    it("does not show TRANSPARENT label when bgColor is a hex color", () => {
      renderPicker({ bgColor: "#ffffff" });
      expect(screen.queryByText("TRANSPARENT")).not.toBeInTheDocument();
    });

    it("falls back to #ffffff for the color input when bgColor is transparent", () => {
      renderPicker({ bgColor: "transparent" });
      const bgInput = screen.getByLabelText("Background color") as HTMLInputElement;
      expect(bgInput.value).toBe("#ffffff");
    });
  });
});
