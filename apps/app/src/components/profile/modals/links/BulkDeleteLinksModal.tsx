import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconTrash } from "../../../common/Icons";
import { buildShortLinkUrl } from "../../../../utils/url-utils";
import { Doc } from "../../../../../../../convex/_generated/dataModel";
import "./DeleteLinkConfirmModal.css";
import "./BulkDeleteLinksModal.css";

type Link = Doc<"links">;

interface BulkDeleteLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  links: Link[];
}

function BulkDeleteLinksModal({ isOpen, onClose, onSuccess, links }: BulkDeleteLinksModalProps) {
  const { trigger } = useWebHaptics();
  const [error, setError] = useState<string | null>(null);
  const [prevLinks, setPrevLinks] = useState(links);
  const [submitting, setSubmitting] = useState(false);
  const deleteLinks = useMutation(api.links.deleteLinks);

  // Clear stale error whenever the modal opens with a new set of links (derived state)
  if (links !== prevLinks) {
    setPrevLinks(links);
    setError(null);
  }

  const count = links.length;
  const plural = count !== 1 ? "s" : "";

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteLinks({ linkIds: links.map((l) => l._id) });
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "Failed to delete links");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="bulk-delete-modal-title">
      <div className="delete-modal">
        <div className="delete-modal-icon">
          <IconTrash size={28} />
        </div>

        <div className="delete-modal-body">
          <h2 id="bulk-delete-modal-title" className="delete-modal-title">
            Delete {count} link{plural}?
          </h2>

          <p className="delete-modal-warning">
            This action is permanent. Anyone with these links will get a 404.
          </p>
        </div>

        <div className="bulk-delete-link-list">
          {links.map((link) => {
            const shortUrl = buildShortLinkUrl(link.shortCode, link.namespaceSlug);
            return (
              <div key={link._id} className="bulk-delete-link-item">
                <span className="bulk-delete-link-short">{shortUrl}</span>
                <span className="bulk-delete-link-dest">{link.destinationUrl}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="delete-modal-error" role="alert">
            {error}
          </div>
        )}

        <div className="delete-modal-actions">
          <button
            className="delete-modal-cancel"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="delete-modal-confirm"
            onClick={() => {
              trigger("nudge");
              handleDelete();
            }}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : `Delete ${count} link${plural}`}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export default BulkDeleteLinksModal;
