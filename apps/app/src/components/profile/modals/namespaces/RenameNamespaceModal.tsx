import React, { useState, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { cleanConvexError } from "../../../../utils/errors";
import { getAppHost } from "../../../../utils/url-utils";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconPencil, IconClose, IconGlobe } from "../../../common/Icons";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import "./CreateNamespaceModal.css";

interface RenameNamespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  namespaceId: Id<"namespaces"> | null;
  namespaceName: string | undefined;
  namespaceDescription: string | undefined;
}

function RenameNamespaceModal({
  isOpen,
  onClose,
  namespaceId,
  namespaceName,
  namespaceDescription,
}: RenameNamespaceModalProps) {
  const { trigger } = useWebHaptics();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateNamespace = useMutation(api.namespaces.update);

  useEffect(() => {
    if (isOpen) {
      setName(namespaceName || "");
      setDescription(namespaceDescription || "");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen, namespaceName, namespaceDescription]);

  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, "");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setName(value);
    setError("");
  }

  const hasChanges =
    sanitizedName !== namespaceName || description !== (namespaceDescription || "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sanitizedName || isSubmitting || !hasChanges) return;

    setIsSubmitting(true);
    setError("");

    try {
      await updateNamespace({
        namespaceId: namespaceId!,
        newSlug: sanitizedName !== namespaceName ? sanitizedName : undefined,
        description: description !== (namespaceDescription || "") ? description : undefined,
      });
      onClose();
    } catch (err) {
      const msg = cleanConvexError((err as Error).message ?? "");
      setError(msg || "Failed to update namespace");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!namespaceId) return null;

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="rnm-title">
      <form className="cnm" onSubmit={handleSubmit}>
        <div className="cnm-header">
          <div className="cnm-header-left">
            <div className="cnm-icon-circle">
              <IconPencil size={20} />
            </div>
            <div className="cnm-title-group">
              <h2 id="rnm-title" className="cnm-title">
                Edit namespace
              </h2>
              <p className="cnm-subtitle">Update the name or description</p>
            </div>
          </div>
          <button
            type="button"
            className="cnm-close-btn"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
            aria-label="Close"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="cnm-field">
          <label className="cnm-label" htmlFor="edit-namespace-name">
            Namespace name
          </label>
          <input
            id="edit-namespace-name"
            className="cnm-input"
            type="text"
            value={name}
            onKeyDown={() => trigger(8)}
            onBeforeInput={() => trigger(8)}
            onChange={handleNameChange}
            placeholder="my-portfolio"
            autoFocus
          />
        </div>

        <div className="cnm-url-preview">
          <IconGlobe size={16} />
          <span>
            <span style={{ opacity: 0.5 }}>{getAppHost()}/</span>
            {sanitizedName || "[namespace]"}
            <span style={{ opacity: 0.5 }}>/your-slug</span>
          </span>
        </div>

        <div className="cnm-field">
          <label className="cnm-label" htmlFor="edit-namespace-desc">
            Description (optional)
          </label>
          <textarea
            id="edit-namespace-desc"
            className="cnm-textarea"
            value={description}
            onKeyDown={() => trigger(8)}
            onBeforeInput={() => trigger(8)}
            onChange={(e) => {
              setDescription(e.target.value);
              setError("");
            }}
            placeholder="What is this namespace for?"
            rows={3}
          />
        </div>

        {error && <p className="cnm-error">{error}</p>}

        <div className="cnm-actions">
          <button
            type="button"
            className="cnm-btn-cancel"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cnm-btn-create"
            disabled={isSubmitting || !hasChanges}
            onClick={() => trigger("nudge")}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export default RenameNamespaceModal;
