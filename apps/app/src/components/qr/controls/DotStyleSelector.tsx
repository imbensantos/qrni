import { useWebHaptics } from "web-haptics/react";
import { DOT_STYLES } from "../../../utils/constants";
import { useDragScroll } from "../../../hooks/useDragScroll";

interface DotStyleSelectorProps {
  dotStyle: string;
  onDotStyleChange: (style: string) => void;
  /** Optional label id prefix for accessibility (defaults to "dotstyle") */
  labelId?: string;
  /** Whether to render the section icon in the header (defaults to true) */
  showIcon?: boolean;
}

function DotStyleSelector({
  dotStyle,
  onDotStyleChange,
  labelId = "dotstyle",
  showIcon = true,
}: DotStyleSelectorProps) {
  const { trigger } = useWebHaptics();
  const {
    scrollRef,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onMouseMove,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onKeyDown,
  } = useDragScroll();

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
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
          )}
          Dot Style
        </span>
      </div>
      <div
        className="dot-row"
        ref={scrollRef}
        role="radiogroup"
        aria-label="Dot style"
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
      >
        {DOT_STYLES.map((ds) => (
          <button
            key={ds.id}
            role="radio"
            aria-checked={dotStyle === ds.id}
            className={`dot-option ${dotStyle === ds.id ? "active" : ""}`}
            onClick={() => {
              onDotStyleChange(ds.id);
              trigger("success");
            }}
          >
            <span className={`dot-icon dot-icon-${ds.id}`} aria-hidden="true" />
            <span className="dot-option-label">{ds.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default DotStyleSelector;
