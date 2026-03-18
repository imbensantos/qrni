import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import ModalBackdrop from "./ModalBackdrop";
import { IconTrash } from "../Icons";
import { buildShortLinkUrl } from "../../utils/url-utils";
import { Doc } from "../../../../../convex/_generated/dataModel";
import "./DeleteLinkConfirmModal.css";

type Link = Doc<"links">;

interface DeleteLinkConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: Link | null;
}

function DeleteLinkConfirmModal({ isOpen, onClose, link }: DeleteLinkConfirmModalProps) {
  const { trigger } = useWebHaptics();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const deleteLink = useMutation(api.links.deleteLink);

  if (!link) return null;

  const shortUrl = buildShortLinkUrl(link.shortCode, link.namespaceSlug);
  // Capture before async callback to preserve TypeScript narrowing
  const linkId = link._id;

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      await deleteLink({ linkId });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to delete link");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="delete-modal-title">
      <div className="delete-modal">
        <div className="delete-modal-icon">
          <IconTrash size={28} />
        </div>

        <h2 id="delete-modal-title" className="delete-modal-title">
          Delete this link?
        </h2>

        <p className="delete-modal-warning">
          This will permanently delete the short link <strong>{shortUrl}</strong> and its QR code.
          Anyone using this link will get a 404 error. This action cannot be undone.
        </p>

        <div className="delete-modal-preview">
          <div className="delete-modal-preview-short">{shortUrl}</div>
          <div className="delete-modal-preview-dest">{link.destinationUrl}</div>
        </div>

        {error && <div className="delete-modal-error">{error}</div>}

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
            {submitting ? "Deleting..." : "Delete link"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export default DeleteLinkConfirmModal;
