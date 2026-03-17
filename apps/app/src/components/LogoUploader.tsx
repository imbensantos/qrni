import { useRef } from "react";
import { useWebHaptics } from "web-haptics/react";

interface LogoUploaderProps {
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
  /** Optional label id prefix for accessibility (defaults to "logo") */
  labelId?: string;
  /** Whether to render the section icon in the header (defaults to true) */
  showIcon?: boolean;
}

function LogoUploader({
  logo,
  onLogoChange,
  labelId = "logo",
  showIcon = true,
}: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { trigger } = useWebHaptics();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onLogoChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

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
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          )}
          Logo
        </span>
      </div>
      {logo ? (
        <div className="logo-preview">
          <img src={logo} alt="Custom QR code logo" className="logo-thumb" />
          <button
            className="logo-remove"
            onClick={() => {
              onLogoChange(null);
              trigger("nudge");
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            hidden
            aria-label="Upload logo image"
          />
          <button
            type="button"
            className="upload-zone"
            onClick={() => {
              fileInputRef.current?.click();
              trigger("nudge");
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Add logo</span>
          </button>
        </>
      )}
    </section>
  );
}

export default LogoUploader;
