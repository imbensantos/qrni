import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useWebHaptics } from "web-haptics/react";
import { useAction, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { hasCachedUser } from "../utils/cached-user";
import { getSessionId } from "../utils/session-id";
import { cleanConvexError } from "../utils/errors";
import { MAX_CUSTOM_LINKS } from "../utils/constants";
import { isValidUrl } from "../utils/bulk-utils";
import ColorPicker from "./ColorPicker";
import LogoUploader from "./LogoUploader";
import DotStyleSelector from "./DotStyleSelector";
import NamespaceDropdown from "./NamespaceDropdown";
import "./ControlsPanel.css";

interface ShortLinkResult {
  shortCode: string;
  linkId: Id<"links">;
}

interface Namespace {
  _id: Id<"namespaces">;
  slug: string;
}

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

  const [customSlug, setCustomSlug] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
  const [shortLinkLoading, setShortLinkLoading] = useState(false);
  const [shortLinkError, setShortLinkError] = useState<string | null>(null);
  const [pendingNsId, setPendingNsId] = useState<Id<"namespaces"> | null>(null);

  // Race condition guard: ignore stale results after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const createAnonymousLink = useAction(api.links.createAnonymousLink);
  const createAutoSlugLink = useAction(api.links.createAutoSlugLink);
  const createCustomSlugLink = useAction(api.links.createCustomSlugLink);
  const createNamespacedLink = useAction(api.links.createNamespacedLink);

  const myLinks = useQuery(api.links.listMyLinks) ?? [];
  const myNamespaces = useQuery(api.namespaces.listMine);

  const flatCustomCount = myLinks.filter((l) => !l.namespace && l.owner && !l.autoSlug).length;

  const ownedNamespaces = myNamespaces?.owned ?? [];

  // Issue #7: memoize allNamespaces to avoid recomputing every render
  const allNamespaces: Namespace[] = useMemo(
    () => [
      ...ownedNamespaces,
      ...(myNamespaces?.collaborated ?? []).filter(
        (ns): ns is NonNullable<typeof ns> => ns !== null,
      ),
    ],
    [ownedNamespaces, myNamespaces?.collaborated],
  );

  useEffect(() => {
    if (pendingNsId) {
      const ns = allNamespaces.find((n) => n._id === pendingNsId);
      if (ns) {
        setSelectedNamespace(ns);
        setPendingNsId(null);
      }
    }
  }, [pendingNsId, allNamespaces]);

  const createShortLink = useCallback(
    async (targetUrl: string) => {
      const valid = isValidUrl(targetUrl);
      if (!valid) return;
      setShortLinkLoading(true);
      setShortLinkError(null);
      try {
        let res: ShortLinkResult;
        if (!isAuthenticated) {
          res = await createAnonymousLink({
            destinationUrl: targetUrl,
            sessionId: getSessionId(),
          });
        } else if (selectedNamespace) {
          res = await createNamespacedLink({
            destinationUrl: targetUrl,
            namespaceId: selectedNamespace._id,
            slug: customSlug.trim() || undefined,
          });
        } else if (customSlug.trim()) {
          res = await createCustomSlugLink({
            destinationUrl: targetUrl,
            customSlug: customSlug.trim(),
          });
        } else {
          res = await createAutoSlugLink({
            destinationUrl: targetUrl,
          });
        }
        // Guard against stale results after unmount
        if (!mountedRef.current) return;
        onShortLinkCreated?.(res);
        trigger("success");
      } catch (err) {
        if (!mountedRef.current) return;
        const clean = cleanConvexError((err as Error).message || "Failed to create short link");
        setShortLinkError(clean || "Failed to create short link");
        trigger("error");
      } finally {
        if (mountedRef.current) {
          setShortLinkLoading(false);
        }
      }
    },
    [
      isAuthenticated,
      selectedNamespace,
      customSlug,
      createAnonymousLink,
      createAutoSlugLink,
      createNamespacedLink,
      createCustomSlugLink,
      onShortLinkCreated,
      trigger,
    ],
  );

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
          onChange={(e) => {
            onSizeChange(Number(e.target.value));
            trigger(15);
          }}
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
      {/* Generate Button */}
      <button
        className="generate-btn"
        disabled={!isValidUrl(url) || shortLinkLoading}
        onClick={handleGenerate}
      >
        {shortLinkLoading ? "Generating..." : "Generate QR"}
      </button>

      <div className="panel-spacer" />

      <footer className="panel-footer panel-footer-desktop">
        <p className="copyright-footer">
          &copy; {new Date().getFullYear()} QRni &middot;{" "}
          <Link to="/privacy" className="footer-link">
            Privacy
          </Link>
        </p>
        <span className="powered-by">
          Powered by
          <a
            href="https://imbensantos.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit imBento website"
          >
            <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
          </a>
        </span>
      </footer>
    </>
  );
}

export default ControlsPanel;
