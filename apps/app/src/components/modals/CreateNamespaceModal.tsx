import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { cleanConvexError } from "../../utils/errors";
import ModalBackdrop from "./ModalBackdrop";
import { IconFolderOpen, IconClose, IconGlobe } from "../Icons";
import "./CreateNamespaceModal.css";

interface CreateNamespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateNamespaceModal({ isOpen, onClose }: CreateNamespaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createNamespace = useMutation(api.namespaces.create);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, "");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setName(value);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sanitizedName || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createNamespace({ slug: sanitizedName });
      onClose();
    } catch (err) {
      const msg = cleanConvexError((err as Error).message || "");
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="cnm-title">
      <form className="cnm" onSubmit={handleSubmit}>
        <div className="cnm-header">
          <div className="cnm-header-left">
            <div className="cnm-icon-circle">
              <IconFolderOpen size={20} />
            </div>
            <div className="cnm-title-group">
              <h2 id="cnm-title" className="cnm-title">
                Create namespace
              </h2>
              <p className="cnm-subtitle">
                Organize your links under a custom path
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cnm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="cnm-field">
          <label className="cnm-label" htmlFor="namespace-name">
            Namespace name
          </label>
          <input
            id="namespace-name"
            className="cnm-input"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="my-portfolio"
            autoFocus
          />
        </div>

        <div className="cnm-url-preview">
          <IconGlobe size={16} />
          <span>
            <span style={{ opacity: 0.5 }}>{window.location.host}/</span>
            {sanitizedName || "[namespace]"}
            <span style={{ opacity: 0.5 }}>/your-slug</span>
          </span>
        </div>

        <div className="cnm-field">
          <label className="cnm-label" htmlFor="namespace-desc">
            Description (optional)
          </label>
          <textarea
            id="namespace-desc"
            className="cnm-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this namespace for?"
            rows={3}
          />
        </div>

        {error && <p className="cnm-error">{error}</p>}

        <div className="cnm-actions">
          <button type="button" className="cnm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="cnm-btn-create"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create namespace"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

export default CreateNamespaceModal;
