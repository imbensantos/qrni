import { useRef, useState, useCallback, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { hasCachedUser } from "../utils/cached-user";
import { getSessionId } from "../utils/session-id";
import { cleanConvexError } from "../utils/errors";
import { DOT_STYLES } from "../utils/constants";
import { isValidUrl } from "../utils/bulk-utils";
import "./ControlsPanel.css";

interface ShortLinkResult {
  shortCode: string;
  linkId: Id<"links">;
}

interface Namespace {
  _id: Id<"namespaces">;
  slug: string;
}

interface DragState {
  isDown: boolean;
  startX: number;
  scrollLeft: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dotRowRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
  });
  const { trigger } = useWebHaptics();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const showAuthFeatures = authLoading ? hasCachedUser() : isAuthenticated;
  const { signIn } = useAuthActions();

  const [customSlug, setCustomSlug] = useState("");
  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(
    null,
  );
  const [shortLinkLoading, setShortLinkLoading] = useState(false);
  const [shortLinkError, setShortLinkError] = useState<string | null>(null);
  const [nsDropdownOpen, setNsDropdownOpen] = useState(false);
  const [nsFocusedIndex, setNsFocusedIndex] = useState(0);
  const [creatingNs, setCreatingNs] = useState(false);
  const [newNsSlug, setNewNsSlug] = useState("");
  const [nsCreateError, setNsCreateError] = useState<string | null>(null);
  const [pendingNsId, setPendingNsId] = useState<Id<"namespaces"> | null>(null);

  const createNamespace = useMutation(api.namespaces.create);

  const handleCreateNamespace = async () => {
    if (!newNsSlug.trim()) return;
    setNsCreateError(null);
    try {
      const nsId = await createNamespace({
        slug: newNsSlug.trim().toLowerCase(),
      });
      setPendingNsId(nsId);
      setNewNsSlug("");
      setCreatingNs(false);
      setNsDropdownOpen(false);
    } catch (err) {
      const msg = cleanConvexError((err as Error).message);
      setNsCreateError(msg || "Failed to create namespace");
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn("google");
    } catch (err) {
      console.error("Sign-in error:", err);
    }
  };

  const createAnonymousLink = useAction(api.links.createAnonymousLink);
  const createAutoSlugLink = useAction(api.links.createAutoSlugLink);
  const createCustomSlugLink = useAction(api.links.createCustomSlugLink);
  const createNamespacedLink = useAction(api.links.createNamespacedLink);

  const myLinks = useQuery(api.links.listMyLinks) ?? [];
  const myNamespaces = useQuery(api.namespaces.listMine);

  const flatCustomCount = myLinks.filter(
    (l) => !l.namespace && l.owner && !l.autoSlug,
  ).length;

  const allNamespaces: Namespace[] = [
    ...(myNamespaces?.owned ?? []),
    ...(myNamespaces?.collaborated ?? []).filter(
      (ns): ns is NonNullable<typeof ns> => ns !== null,
    ),
  ];

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
      const isValid = isValidUrl(targetUrl);
      if (!isValid) return;
      setShortLinkLoading(true);
      setShortLinkError(null);
      try {
        let res: ShortLinkResult;
        if (!isAuthenticated) {
          res = await createAnonymousLink({
            destinationUrl: targetUrl,
            creatorIp: getSessionId(),
          });
        } else if (selectedNamespace) {
          res = await createNamespacedLink({
            destinationUrl: targetUrl,
            namespaceId: selectedNamespace._id,
            slug: customSlug.trim(),
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
        onShortLinkCreated?.(res);
        trigger("success");
      } catch (err) {
        const clean = cleanConvexError(
          (err as Error).message || "Failed to create short link",
        );
        setShortLinkError(clean || "Failed to create short link");
        trigger("error");
      } finally {
        setShortLinkLoading(false);
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

  const handleNamespaceSelect = (value: string) => {
    setNsDropdownOpen(false);
    if (value === "none") {
      setSelectedNamespace(null);
      return;
    }
    const ns = allNamespaces.find((n) => n._id === value);
    setSelectedNamespace(ns ?? null);
  };

  const onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const row = dotRowRef.current;
    if (!row) return;
    dragState.current = {
      isDown: true,
      startX: e.pageX - row.offsetLeft,
      scrollLeft: row.scrollLeft,
    };
    row.classList.add("dragging");
  };
  const onDragEnd = () => {
    dragState.current.isDown = false;
    dotRowRef.current?.classList.remove("dragging");
  };
  const onDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.isDown) return;
    e.preventDefault();
    const row = dotRowRef.current;
    if (!row) return;
    const x = e.pageX - row.offsetLeft;
    row.scrollLeft =
      dragState.current.scrollLeft - (x - dragState.current.startX);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const row = dotRowRef.current;
    if (!row) return;
    const touch = e.touches[0];
    dragState.current = {
      isDown: true,
      startX: touch.pageX - row.offsetLeft,
      scrollLeft: row.scrollLeft,
    };
  };
  const onTouchEnd = () => {
    dragState.current.isDown = false;
  };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragState.current.isDown) return;
    const row = dotRowRef.current;
    if (!row) return;
    const touch = e.touches[0];
    const x = touch.pageX - row.offsetLeft;
    row.scrollLeft =
      dragState.current.scrollLeft - (x - dragState.current.startX);
  };

  const handleNsKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const optionCount = 1 + allNamespaces.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setNsFocusedIndex((i) => Math.min(i + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setNsFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (nsFocusedIndex === 0) handleNamespaceSelect("none");
      else handleNamespaceSelect(allNamespaces[nsFocusedIndex - 1]._id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setNsDropdownOpen(false);
    }
  };

  const handleDotRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const row = dotRowRef.current;
    if (!row) return;
    if (e.key === "ArrowRight") {
      row.scrollLeft += 80;
      e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
      row.scrollLeft -= 80;
      e.preventDefault();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onLogoChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* URL */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="url-label"
      >
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
          {shortLinkLoading && (
            <p className="shortlink-status">Creating short link...</p>
          )}
          {shortLinkError && (
            <p className="shortlink-error" role="alert">
              {shortLinkError}
            </p>
          )}

          {/* Authenticated: Custom Slug + Namespace */}
          {showAuthFeatures ? (
            <>
              <section
                className="control-section"
                role="group"
                aria-labelledby="slug-label"
              >
                <div className="control-header">
                  <label
                    id="slug-label"
                    className="control-label"
                    htmlFor="slug-input"
                  >
                    Custom slug
                  </label>
                  {!selectedNamespace && (
                    <span className="slug-counter">
                      {flatCustomCount} of 5 used
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
              <section
                className="control-section"
                role="group"
                aria-labelledby="namespace-label"
              >
                <label id="namespace-label" className="control-label">
                  Namespace
                </label>
                <div className="namespace-dropdown-wrapper">
                  <button
                    type="button"
                    className="namespace-dropdown-trigger"
                    onClick={() => {
                      setNsDropdownOpen(!nsDropdownOpen);
                      setNsFocusedIndex(0);
                    }}
                    aria-expanded={nsDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span
                      style={
                        selectedNamespace
                          ? undefined
                          : { color: "var(--text-tertiary)" }
                      }
                    >
                      {selectedNamespace ? selectedNamespace.slug : "None"}
                    </span>
                    <svg
                      width="12"
                      height="8"
                      viewBox="0 0 12 8"
                      fill="none"
                      className={`ns-chevron ${nsDropdownOpen ? "open" : ""}`}
                    >
                      <path
                        d="M1 1L6 6L11 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {nsDropdownOpen && (
                    <ul
                      className="namespace-dropdown-menu"
                      role="listbox"
                      tabIndex={-1}
                      onKeyDown={handleNsKeyDown}
                    >
                      <li
                        role="option"
                        aria-selected={!selectedNamespace}
                        className={`ns-option ${!selectedNamespace ? "selected" : ""} ${nsFocusedIndex === 0 ? "focused" : ""}`}
                        onClick={() => handleNamespaceSelect("none")}
                      >
                        None
                      </li>
                      {allNamespaces.map((ns, idx) => (
                        <li
                          key={ns._id}
                          role="option"
                          aria-selected={selectedNamespace?._id === ns._id}
                          className={`ns-option ${selectedNamespace?._id === ns._id ? "selected" : ""} ${nsFocusedIndex === idx + 1 ? "focused" : ""}`}
                          onClick={() => handleNamespaceSelect(ns._id)}
                        >
                          {ns.slug}
                        </li>
                      ))}
                      <li className="ns-option ns-create-option">
                        {creatingNs ? (
                          <div
                            className="ns-create-form"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              className="ns-create-input"
                              placeholder="my-namespace"
                              value={newNsSlug}
                              onChange={(e) => setNewNsSlug(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateNamespace();
                                if (e.key === "Escape") {
                                  setCreatingNs(false);
                                  setNsCreateError(null);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="ns-create-confirm"
                              onClick={handleCreateNamespace}
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="ns-create-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreatingNs(true);
                              setNsCreateError(null);
                            }}
                          >
                            + Create namespace
                          </button>
                        )}
                        {nsCreateError && (
                          <p
                            className="shortlink-error"
                            style={{ marginTop: 4 }}
                          >
                            {nsCreateError}
                          </p>
                        )}
                      </li>
                    </ul>
                  )}
                </div>
              </section>

              {/* Namespace nudge */}
              {!selectedNamespace && (
                <div className="namespace-nudge" role="note">
                  <span className="nudge-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
                        fill="#D89575"
                      />
                      <path
                        d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"
                        fill="#D89575"
                      />
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
                  <path
                    d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z"
                    fill="#D89575"
                  />
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
      <section
        className="control-section"
        role="group"
        aria-labelledby="colors-label"
      >
        <div className="control-header">
          <span id="colors-label" className="control-label">
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
              <span
                className="color-swatch"
                style={{ background: fgColor }}
                aria-hidden="true"
              />
              <span className="color-value">{fgColor.toUpperCase()}</span>
            </label>
          </div>
          <div className="color-group">
            <span className="color-sublabel">Background</span>
            <label className="color-picker">
              <input
                type="color"
                aria-label="Background color"
                value={bgColor}
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
                style={{ background: bgColor }}
                aria-hidden="true"
              />
              <span className="color-value">{bgColor.toUpperCase()}</span>
            </label>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Logo */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="logo-label"
      >
        <div className="control-header">
          <span id="logo-label" className="control-label">
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

      <hr className="divider" />

      {/* Dot Style */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="dotstyle-label"
      >
        <div className="control-header">
          <span id="dotstyle-label" className="control-label">
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
            Dot Style
          </span>
        </div>
        <div
          className="dot-row"
          ref={dotRowRef}
          role="radiogroup"
          aria-label="Dot style"
          onMouseDown={onDragStart}
          onMouseLeave={onDragEnd}
          onMouseUp={onDragEnd}
          onMouseMove={onDragMove}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onKeyDown={handleDotRowKeyDown}
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
              <span
                className={`dot-icon dot-icon-${ds.id}`}
                aria-hidden="true"
              />
              <span className="dot-option-label">{ds.label}</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Size */}
      <section
        className="control-section"
        role="group"
        aria-labelledby="size-label"
      >
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
        <span>Powered by</span>
        <a
          href="https://imbensantos.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit imBento website"
        >
          <img
            src="/imbento-logo-dark.svg"
            alt="imBento"
            className="imbento-logo"
          />
        </a>
      </footer>
    </>
  );
}

export default ControlsPanel;
