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

function getFileInput(): HTMLInputElement {
  return screen.getByLabelText("Upload logo image") as HTMLInputElement;
}

/**
 * Creates a mock File with a controlled size.
 * jsdom's File constructor derives size from content length,
 * so we use Object.defineProperty to override for size-boundary tests.
 */
function createMockFile(name: string, sizeInBytes: number, type: string): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: sizeInBytes });
  return file;
}

function uploadFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, "files", {
    value: [file],
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
}

describe("LogoUploader — file upload security", () => {
  it("rejects SVG files (XSS risk)", () => {
    const props = renderUploader();
    const input = getFileInput();
    const svgFile = createMockFile("malicious.svg", 1024, "image/svg+xml");

    uploadFile(input, svgFile);

    expect(props.onLogoChange).not.toHaveBeenCalled();
    expect(
      screen.getByText("Only PNG, JPEG, WebP, and GIF images are allowed."),
    ).toBeInTheDocument();
  });

  it("rejects files larger than 5MB", () => {
    const props = renderUploader();
    const input = getFileInput();
    const largeFile = createMockFile("huge.png", 5 * 1024 * 1024 + 1, "image/png");

    uploadFile(input, largeFile);

    expect(props.onLogoChange).not.toHaveBeenCalled();
    expect(screen.getByText("Image must be under 5 MB.")).toBeInTheDocument();
  });

  it("accepts valid PNG files", () => {
    renderUploader();
    const input = getFileInput();
    const pngFile = createMockFile("logo.png", 1024, "image/png");

    uploadFile(input, pngFile);

    // No error should appear — file was accepted for reading
    expect(
      screen.queryByText("Only PNG, JPEG, WebP, and GIF images are allowed."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Image must be under 5 MB.")).not.toBeInTheDocument();
  });

  it("accepts valid JPEG files", () => {
    renderUploader();
    const input = getFileInput();
    const jpegFile = createMockFile("photo.jpg", 2048, "image/jpeg");

    uploadFile(input, jpegFile);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("accepts valid WebP files", () => {
    renderUploader();
    const input = getFileInput();
    const webpFile = createMockFile("image.webp", 512, "image/webp");

    uploadFile(input, webpFile);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("accepts valid GIF files", () => {
    renderUploader();
    const input = getFileInput();
    const gifFile = createMockFile("animation.gif", 4096, "image/gif");

    uploadFile(input, gifFile);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error message when file is rejected", () => {
    renderUploader();
    const input = getFileInput();
    const htmlFile = createMockFile("payload.html", 100, "text/html");

    uploadFile(input, htmlFile);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Only PNG, JPEG, WebP, and GIF images are allowed.");
  });

  it("clears error when valid file is uploaded", () => {
    renderUploader();
    const input = getFileInput();

    // First upload an invalid file to trigger the error
    const badFile = createMockFile("evil.svg", 100, "image/svg+xml");
    uploadFile(input, badFile);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Then upload a valid file — error should clear
    const goodFile = createMockFile("ok.png", 100, "image/png");
    uploadFile(input, goodFile);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("resets file input after rejection so user can retry", () => {
    renderUploader();
    const input = getFileInput();
    const badFile = createMockFile("evil.svg", 100, "image/svg+xml");

    // jsdom doesn't allow setting file input value to a non-empty string,
    // so we spy on the value setter to verify the handler calls e.target.value = ""
    const valueSetter = vi.fn();
    Object.defineProperty(input, "value", {
      get: () => "",
      set: valueSetter,
      configurable: true,
    });

    uploadFile(input, badFile);

    // The handler should reset the input value to "" after rejection
    expect(valueSetter).toHaveBeenCalledWith("");
  });
});
