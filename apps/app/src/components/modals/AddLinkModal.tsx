import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { getAppHost } from "../../utils/url-utils";
import { api } from "../../../../../convex/_generated/api";
import { cleanConvexError, categorizeConvexError } from "../../utils/errors";
import ModalBackdrop from "./ModalBackdrop";
import { IconPlus, IconClose, IconLink } from "../Icons";
import { Id } from "../../../../../convex/_generated/dataModel";
import "./AddLinkModal.css";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaceId?: Id<"namespaces"> | null;
  namespaceSlug?: string | null;
}

function AddLinkModal({ isOpen, onClose, namespaceId, namespaceSlug }: AddLinkModalProps) {
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [slugError, setSlugError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createAutoSlugLink = useAction(api.links.createAutoSlugLink);
  const createCustomSlugLink = useAction(api.links.createCustomSlugLink);
  const createNamespacedLink = useAction(api.links.createNamespacedLink);

  useEffect(() => {
    if (isOpen) {
      setSlug("");
      setDestinationUrl("");
      setSlugError("");
      setUrlError("");
      setSubmitting(false);
    }
  }, [isOpen]);

  const prefix = namespaceId ? `${getAppHost()}/${namespaceSlug}/` : `${getAppHost()}/`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSlugError("");
    setUrlError("");

    let hasError = false;
    const hasSlug = slug.trim().length > 0;

    if (hasSlug && !/^[a-zA-Z0-9_-]{1,60}$/.test(slug)) {
      setSlugError("Only letters, numbers, and hyphens allowed (max 60 characters)");
      hasError = true;
    }

    if (!destinationUrl.trim()) {
      setUrlError("Destination URL is required");
      hasError = true;
    } else if (!destinationUrl.startsWith("http://") && !destinationUrl.startsWith("https://")) {
      setUrlError("URL must start with http:// or https://");
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);
    try {
      if (namespaceId) {
        await createNamespacedLink({
          destinationUrl,
          namespaceId,
          slug: hasSlug ? slug : undefined,
        });
      } else if (hasSlug) {
        await createCustomSlugLink({ destinationUrl, customSlug: slug });
      } else {
        await createAutoSlugLink({ destinationUrl });
      }
      onClose();
    } catch (err) {
      const message =
        cleanConvexError((err as Error).message || "") || "Something went wrong. Please try again.";
      if (categorizeConvexError(message) === "url") {
        setUrlError(message);
      } else {
        setSlugError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="alm-title">
      <form className="alm" onSubmit={handleSubmit}>
        <div className="alm-header">
          <div className="alm-header-left">
            <div className="alm-icon-circle">
              <IconPlus size={20} />
            </div>
            <div className="alm-title-group">
              <h2 id="alm-title" className="alm-title">
                Add new link
              </h2>
              <p className="alm-subtitle">Create a custom short link</p>
            </div>
          </div>
          <button type="button" className="alm-close-btn" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        <div className="alm-fields">
          <div className="alm-field">
            <label className="alm-label" htmlFor="alm-url">
              Destination URL
            </label>
            <div className={`alm-dest-row ${urlError ? "has-error" : ""}`}>
              <span className="alm-dest-icon">
                <IconLink size={16} />
              </span>
              <input
                id="alm-url"
                type="text"
                className="alm-dest-input"
                value={destinationUrl}
                onChange={(e) => {
                  setDestinationUrl(e.target.value);
                  setUrlError("");
                }}
                placeholder="https://example.com/your-page"
                autoFocus
              />
            </div>
            {urlError && <p className="alm-error">{urlError}</p>}
          </div>

          <div className="alm-field">
            <label className="alm-label" htmlFor="alm-slug">
              Short link slug
              <span className="alm-optional"> (optional)</span>
            </label>
            <div className={`alm-slug-row ${slugError ? "has-error" : ""}`}>
              <span className="alm-slug-prefix">{prefix}</span>
              <input
                id="alm-slug"
                type="text"
                className="alm-slug-input"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugError("");
                }}
                placeholder="my-link (auto-generated if empty)"
              />
            </div>
            {slugError ? (
              <p className="alm-error">{slugError}</p>
            ) : (
              <p className="alm-hint">Leave empty to auto-generate, or enter a custom slug</p>
            )}
          </div>
        </div>

        <div className="alm-actions">
          <button type="button" className="alm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="alm-btn-create" disabled={submitting}>
            {submitting ? "Creating..." : "Create link"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export default AddLinkModal;
