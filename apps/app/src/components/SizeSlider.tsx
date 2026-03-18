import { useRef, useEffect, useCallback } from "react";

interface SizeSliderProps {
  size: number;
  onSizeChange: (size: number) => void;
}

const HAPTIC_THROTTLE_MS = 80;

/**
 * Inline haptic trigger that bypasses web-haptics.
 * Uses a visible-but-offscreen checkbox switch instead of display:none.
 * iOS Safari may suppress haptic feedback for display:none elements.
 */
function useSliderHaptic() {
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    const id = `slider-haptic-${Date.now()}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    // Off-screen but still rendered (NOT display:none)
    Object.assign(label.style, {
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
      pointerEvents: "none",
      opacity: "0",
    });

    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.id = id;
    Object.assign(input.style, {
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
    });

    label.appendChild(input);
    document.body.appendChild(label);
    labelRef.current = label;

    return () => {
      label.remove();
      labelRef.current = null;
    };
  }, []);

  const trigger = useCallback(() => {
    const now = Date.now();
    if (now - lastRef.current >= HAPTIC_THROTTLE_MS) {
      lastRef.current = now;
      labelRef.current?.click();
    }
  }, []);

  return trigger;
}

function SizeSlider({ size, onSizeChange }: SizeSliderProps) {
  const triggerHaptic = useSliderHaptic();

  return (
    <section className="control-section" role="group" aria-labelledby="size-label">
      <div className="control-header">
        <span id="size-label" className="control-label">
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
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
          Size
        </span>
        <span className="size-value" aria-live="polite">
          {size} px
        </span>
      </div>
      <input
        type="range"
        min={128}
        max={2048}
        step={64}
        value={size}
        onChange={(e) => onSizeChange(Number(e.target.value))}
        onTouchStart={() => triggerHaptic()}
        onTouchMove={() => triggerHaptic()}
        className="size-slider"
        aria-label="QR code size in pixels"
        aria-valuemin={128}
        aria-valuemax={2048}
        aria-valuenow={size}
        aria-valuetext={`${size} pixels`}
      />
      <div className="size-range" aria-hidden="true">
        <span>128</span>
        <span>2048</span>
      </div>
    </section>
  );
}

export default SizeSlider;
