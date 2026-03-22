import React, { useState, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useAction } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { cleanConvexError } from "../../../../utils/errors";
import { getAppHost } from "../../../../utils/url-utils";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconPencil, IconLink, IconClose } from "../../../common/Icons";
import { formatDate } from "../../../../utils/ui-utils";
import { Doc } from "../../../../../../../convex/_generated/dataModel";
import "./EditLinkModal.css";

type Link = Doc<"links">;

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: Link | null;
}

function PencilCircleIcon() {
  return (
    <div className="edit-link-icon">
      <IconPencil size={18} />
    </div>
  );
}

function EditLinkModal({ isOpen, onClose, link }: EditLinkModalProps) {
  const { trigger } = useWebHaptics();
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateLink = useAction(api.links.updateLink);

  // Sync form state when link prop changes
  useEffect(() => {
    if (link) {
      setSlug(link.namespaceSlug || link.shortCode || "");
      setDestinationUrl(link.destinationUrl || "");
      setError(null);
    }
  }, [link]);

  // For namespaced links, extract the namespace prefix from shortCode (e.g. "ns/slug" → "ns")
  const namespacePart = link?.namespace ? link.shortCode.split("/")[0] : null;
  const prefix = namespacePart ? `${getAppHost()}/${namespacePart}/` : `${getAppHost()}/`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || !link) return;

    const trimmedSlug = slug.trim();
    const trimmedUrl = destinationUrl.trim();

    if (!trimmedSlug) {
      setError("Slug cannot be empty");
      return;
    }

    if (!/^[a-zA-Z0-9_-]{1,60}$/.test(trimmedSlug)) {
      setError("Only letters, numbers, hyphens, and underscores allowed (max 60 characters)");
      return;
    }

    if (!trimmedUrl) {
      setError("Destination URL cannot be empty");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateLink({
        linkId: link._id,
        newSlug: trimmedSlug,
        newDestinationUrl: trimmedUrl,
      });
      onClose();
    } catch (err) {
      const msg = cleanConvexError((err as Error).message || "");
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="edit-link-title">
      <div className="edit-link-modal">
        <div className="edit-link-header">
          <div className="edit-link-header-left">
            <PencilCircleIcon />
            <div className="edit-link-header-text">
              <h2 id="edit-link-title" className="edit-link-title">
                Edit link
              </h2>
              <p className="edit-link-subtitle">Update the slug or destination URL</p>
            </div>
          </div>
          <button
            className="edit-link-close"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
            type="button"
          >
            <IconClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-link-form">
          <div className="edit-link-field">
            <label className="edit-link-label" htmlFor="edit-slug">
              Short link slug
            </label>
            <div className="edit-link-input-group">
              <span className="edit-link-prefix">{prefix}</span>
              <input
                id="edit-slug"
                type="text"
                className="edit-link-input slug-input"
                value={slug}
                onKeyDown={() => trigger(8)}
                onBeforeInput={() => trigger(8)}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-slug"
                autoComplete="off"
              />
            </div>
            <span className="edit-link-hint">
              Only letters, numbers, hyphens, and underscores allowed
            </span>
          </div>

          <div className="edit-link-field">
            <label className="edit-link-label" htmlFor="edit-destination">
              Destination URL
            </label>
            <div className="edit-link-input-group">
              <span className="edit-link-input-icon">
                <IconLink size={16} />
              </span>
              <input
                id="edit-destination"
                type="url"
                className="edit-link-input destination-input"
                value={destinationUrl}
                onKeyDown={() => trigger(8)}
                onBeforeInput={() => trigger(8)}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://example.com"
                autoComplete="off"
              />
            </div>
          </div>

          {link && (
            <div className="edit-link-info-row">
              <span className="edit-link-info-item">Created: {formatDate(link.createdAt)}</span>
              <span className="edit-link-info-separator" />
              <span className="edit-link-info-item">Clicks: {link.clickCount ?? 0}</span>
              {namespacePart && (
                <>
                  <span className="edit-link-info-separator" />
                  <span className="edit-link-info-item">Namespace: {namespacePart}</span>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="edit-link-error" role="alert">
              {error}
            </div>
          )}

          <div className="edit-link-actions">
            <button
              type="button"
              className="edit-link-btn cancel"
              onClick={() => {
                trigger("nudge");
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-link-btn save"
              disabled={submitting}
              onClick={() => trigger("nudge")}
            >
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export default EditLinkModal;
