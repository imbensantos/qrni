import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LogoUploader from "./LogoUploader";

vi.mock("web-haptics/react", () => ({
  useWebHaptics: () => ({ trigger: vi.fn() }),
}));

function renderUploader(overrides = {}) {
  const props = {
    logo: null as string | null,
    onLogoChange: vi.fn(),
    ...overrides,
  };
  render(<LogoUploader {...props} />);
  return props;
}

describe("LogoUploader", () => {
  it("renders upload button when no logo is set", () => {
    renderUploader();
    expect(screen.getByText("Add logo")).toBeInTheDocument();
  });

  it("renders the Logo section label", () => {
    renderUploader();
    expect(screen.getByText("Logo")).toBeInTheDocument();
  });

  it("shows Remove button when logo is set", () => {
    renderUploader({ logo: "data:image/png;base64,abc" });
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("clicking Remove calls onLogoChange with null", () => {
    const props = renderUploader({ logo: "data:image/png;base64,abc" });
    fireEvent.click(screen.getByText("Remove"));
    expect(props.onLogoChange).toHaveBeenCalledWith(null);
  });

  it("does not show upload button when logo is set", () => {
    renderUploader({ logo: "data:image/png;base64,abc" });
    expect(screen.queryByText("Add logo")).not.toBeInTheDocument();
  });

  it("does not show Remove when no logo is set", () => {
    renderUploader();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });
});
