import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import ModalBackdrop from "./ModalBackdrop";
import "./EditProfileModal.css";

function EditProfileModal({ isOpen, onClose, user }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateProfile = useMutation(api.users.updateProfile);

  // Sync name from user prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(user?.name || "");
      setError("");
      setSubmitting(false);
    }
  }, [isOpen, user]);

  const avatarUrl = user?.avatarUrl || user?.image;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Display name is required");
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ name: name.trim() });
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="edit-profile-modal">
        <div className="edit-profile-modal-header">
          <h2 className="edit-profile-modal-title">Edit profile</h2>
          <button
            className="edit-profile-modal-close"
            onClick={onClose}
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="edit-profile-avatar-section">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="edit-profile-avatar"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="edit-profile-avatar edit-profile-avatar-placeholder">
              {(user?.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="edit-profile-avatar-actions">
            <button type="button" className="edit-profile-avatar-link upload">
              Upload
            </button>
            <button type="button" className="edit-profile-avatar-link remove">
              Remove
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="edit-profile-field">
            <label className="edit-profile-label" htmlFor="edit-profile-name">
              Display name
            </label>
            <div
              className={`edit-profile-input-wrapper ${error ? "has-error" : ""}`}
            >
              <input
                id="edit-profile-name"
                type="text"
                className="edit-profile-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                autoFocus
              />
            </div>
            {error && <p className="edit-profile-error">{error}</p>}
          </div>

          <div className="edit-profile-field">
            <label className="edit-profile-label" htmlFor="edit-profile-email">
              Email
            </label>
            <div className="edit-profile-input-wrapper disabled">
              <input
                id="edit-profile-email"
                type="email"
                className="edit-profile-input"
                value={user?.email || ""}
                disabled
              />
            </div>
            <p className="edit-profile-hint">
              Email is managed by your Google account
            </p>
          </div>

          <div className="edit-profile-modal-actions">
            <button
              type="button"
              className="edit-profile-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-profile-btn-save"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export default EditProfileModal;
