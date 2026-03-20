import { useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuth } from "../../../hooks/useAuth";
import { useShortLink } from "../../../hooks/useShortLink";
import { hasCachedUser } from "../../../utils/cached-user";
import { MAX_CUSTOM_LINKS } from "../../../utils/constants";
import { isValidUrl } from "../../../utils/bulk-utils";
import type { ShortLinkResult } from "../../../types";
import ColorPicker from "../controls/ColorPicker";
import LogoUploader from "../controls/LogoUploader";
import DotStyleSelector from "../controls/DotStyleSelector";
import SizeSlider from "../controls/SizeSlider";
import NamespaceDropdown from "../controls/NamespaceDropdown";
import AppFooter from "../../layout/AppFooter";
import "./ControlsPanel.css";

interface ControlsPanelProps {
  url: string;
  onUrlChange: (url: string) => void;
  fgColor: string;
  onFgColorChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
  dotStyle: string;
  onDotStyleChange: (style: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  shortenLink: boolean;
  onShortenLinkChange: (value: boolean) => void;
  onShortLinkCreated: ((result: ShortLinkResult | null) => void) | undefined;
  onGenerate: (() => void) | undefined;
}

function ControlsPanel({
  url,
  onUrlChange,
  fgColor,
  onFgColorChange,
  bgColor,
  onBgColorChange,
  logo,
  onLogoChange,
  dotStyle,
  onDotStyleChange,
  size,
  onSizeChange,
  shortenLink,
  onShortenLinkChange,
  onShortLinkCreated,
  onGenerate,
}: ControlsPanelProps) {
  const { trigger } = useWebHaptics();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const showAuthFeatures = authLoading ? hasCachedUser() : isAuthenticated;
  const { signIn } = useAuthActions();

  const {
    customSlug,
    setCustomSlug,
    selectedNamespace,
    setSelectedNamespace,
    shortLinkLoading,
    shortLinkError,
    setShortLinkError,
    setPendingNsId,
    flatCustomCount,
    ownedNamespaces,
    allNamespaces,
    createShortLink,
  } = useShortLink(onShortLinkCreated);

  const handleGenerate = useCallback(async () => {
    onGenerate?.();
    if (shortenLink) await createShortLink(url);
    else trigger("success");
  }, [onGenerate, shortenLink, createShortLink, url, trigger]);

  const handleSignIn = async () => {
    try {
      await signIn("google");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Sign-in error:", err);
      }
    }
  };

  return (
    <>
      {/* URL */}
      <section className="control-section" role="group" aria-labelledby="url-label">
        <label id="url-label" className="control-label" htmlFor="url-input">
          URL
        </label>
        <input
          id="url-input"
          type="url"
          className="url-input"
          placeholder="Paste a URL to get started"
          value={url}
          onKeyDown={() => trigger(8)}
          onBeforeInput={() => trigger(8)}
          onChange={(e) => onUrlChange(e.target.value)}
          autoFocus
        />
      </section>

      {/* Short Link Toggle */}
      <div className="shortlink-toggle-row">
        <span className="shortlink-label">Also create short link</span>
        <button
          role="switch"
          aria-checked={shortenLink}
          className={`toggle-switch ${shortenLink ? "on" : ""}`}
          onClick={() => {
            const next = !shortenLink;
            onShortenLinkChange(next);
            if (!next) {
              onShortLinkCreated?.(null);
              setShortLinkError(null);
            }
            trigger("nudge");
          }}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      {/* Short Link Options (revealed when toggle is on) */}
      {shortenLink && (
        <div className="shortlink-options">
          {shortLinkLoading && <p className="shortlink-status">Creating short link...</p>}
          {shortLinkError && (
            <p className="shortlink-error" role="alert">
              {shortLinkError}
            </p>
          )}

          {/* Authenticated: Custom Slug + Namespace */}
          {showAuthFeatures ? (
            <>
              <section className="control-section" role="group" aria-labelledby="slug-label">
                <div className="control-header">
                  <label id="slug-label" className="control-label" htmlFor="slug-input">
                    Custom slug
                  </label>
                  {!selectedNamespace && (
                    <span className="slug-counter">
                      {flatCustomCount} of {MAX_CUSTOM_LINKS} used
                    </span>
                  )}
                </div>
                <input
                  id="slug-input"
                  type="text"
                  className="url-input"
                  placeholder="e.g., my-link"
                  value={customSlug}
                  onKeyDown={() => trigger(8)}
                  onBeforeInput={() => trigger(8)}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
              </section>
            </>
          ) : null}

          {showAuthFeatures ? (
            <>
              <NamespaceDropdown
                allNamespaces={allNamespaces}
                ownedNamespacesCount={ownedNamespaces.length}
                selectedNamespace={selectedNamespace}
                onNamespaceSelect={setSelectedNamespace}
                onNamespaceCreated={setPendingNsId}
              />

              {/* Namespace nudge */}
              {!selectedNamespace && (
                <div className="namespace-nudge" role="note">
                  <span className="nudge-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
                        fill="#D89575"
                      />
                      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" fill="#D89575" />
                    </svg>
                  </span>
                  <span className="nudge-text">
                    Want unlimited short links? Try a namespace instead.
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="namespace-nudge" role="note">
              <span className="nudge-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
                    fill="#D89575"
                  />
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" fill="#D89575" />
                </svg>
              </span>
              <span className="nudge-text">
                <button
                  type="button"
                  className="inline-signin-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSignIn();
                  }}
                >
                  Sign in
                </button>{" "}
                for custom slugs and namespaces — perfect for events!
              </span>
            </div>
          )}
        </div>
      )}

      <hr className="divider" />

      {/* Colors */}
      <ColorPicker
        fgColor={fgColor}
        onFgColorChange={onFgColorChange}
        bgColor={bgColor}
        onBgColorChange={onBgColorChange}
      />

      <hr className="divider" />

      {/* Logo */}
      <LogoUploader logo={logo} onLogoChange={onLogoChange} />

      <hr className="divider" />

      {/* Dot Style */}
      <DotStyleSelector dotStyle={dotStyle} onDotStyleChange={onDotStyleChange} />

      <hr className="divider" />

      {/* Size */}
      <SizeSlider size={size} onSizeChange={onSizeChange} />
      {/* Generate Button */}
      <button
        className="generate-btn"
        disabled={!isValidUrl(url) || shortLinkLoading}
        onClick={handleGenerate}
      >
        {shortLinkLoading ? "Generating..." : "Generate QR"}
      </button>

      <div className="panel-spacer" />

      <AppFooter
        className="panel-footer-desktop"
        adSlot={{ slot: "SIDEBAR_SLOT_ID", format: "rectangle", className: "ad-slot--sidebar" }}
      />
    </>
  );
}

export default ControlsPanel;
