import { useEffect, useRef } from "react";
import { useWebHaptics } from "web-haptics/react";

interface ColorPickerProps {
  fgColor: string;
  onFgColorChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  /** Optional label id prefix for accessibility (defaults to "colors") */
  labelId?: string;
  /** Whether to render the section icon in the header (defaults to true) */
  showIcon?: boolean;
}

function ColorPicker({
  fgColor,
  onFgColorChange,
  bgColor,
  onBgColorChange,
  labelId = "colors",
  showIcon = true,
}: ColorPickerProps) {
  const { trigger } = useWebHaptics();
  const lastBgColorRef = useRef(bgColor === "transparent" ? "#FFFFFF" : bgColor);

  // Keep ref in sync when user picks a solid color
  useEffect(() => {
    if (bgColor !== "transparent") {
      lastBgColorRef.current = bgColor;
    }
  }, [bgColor]);

  return (
    <section className="control-section" role="group" aria-labelledby={`${labelId}-label`}>
      <div className="control-header">
        <span id={`${labelId}-label`} className="control-label">
          {showIcon && (
            <svg
              className="section-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            </svg>
          )}
          Colors
        </span>
      </div>
      <div className="color-row">
        <div className="color-group">
          <span className="color-sublabel">Foreground</span>
          <label className="color-picker">
            <input
              type="color"
              aria-label="Foreground color"
              value={fgColor}
              onClick={() => trigger("nudge")}
              onInput={(e) => {
                onFgColorChange((e.target as HTMLInputElement).value);
                trigger(30);
              }}
              onChange={(e) => {
                onFgColorChange(e.target.value);
                trigger("success");
              }}
            />
            <span className="color-swatch" style={{ background: fgColor }} aria-hidden="true" />
            <span className="color-value">{fgColor.toUpperCase()}</span>
          </label>
        </div>
        <div className="color-group">
          <span className="color-sublabel">Background</span>
          <div className="color-bg-row">
            <button
              type="button"
              className={`transparent-swatch${bgColor === "transparent" ? " active" : ""}`}
              aria-label="Transparent background"
              aria-pressed={bgColor === "transparent"}
              onClick={() => {
                trigger("nudge");
                if (bgColor === "transparent") {
                  onBgColorChange(lastBgColorRef.current);
                } else {
                  onBgColorChange("transparent");
                }
              }}
            >
              <span className="transparent-swatch-inner" aria-hidden="true" />
            </button>
            <label
              className={`color-picker${bgColor === "transparent" ? " color-picker-muted" : ""}`}
            >
              <input
                type="color"
                aria-label="Background color"
                value={bgColor === "transparent" ? "#ffffff" : bgColor}
                onClick={() => trigger("nudge")}
                onInput={(e) => {
                  onBgColorChange((e.target as HTMLInputElement).value);
                  trigger(30);
                }}
                onChange={(e) => {
                  onBgColorChange(e.target.value);
                  trigger("success");
                }}
              />
              <span
                className="color-swatch"
                style={{ background: bgColor === "transparent" ? "#ffffff" : bgColor }}
                aria-hidden="true"
              />
              <span className="color-value">
                {bgColor === "transparent" ? "TRANSPARENT" : bgColor.toUpperCase()}
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ColorPicker;
