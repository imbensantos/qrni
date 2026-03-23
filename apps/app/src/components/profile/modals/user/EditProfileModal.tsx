import React, { useState, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import ModalBackdrop from "../../../common/ModalBackdrop";
import { IconPencil, IconClose } from "../../../common/Icons";
import "./EditProfileModal.css";

interface ProfileUser {
  name?: string;
  email?: string;
  image?: string;
  avatarUrl?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileUser | null | undefined;
}

function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const { trigger } = useWebHaptics();
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      setError((err as Error).message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose} titleId="edit-profile-title">
      <div className="edit-profile-modal">
        <div className="edit-profile-modal-header">
          <div className="edit-profile-modal-header-left">
            <div className="edit-profile-modal-icon">
              <IconPencil size={18} />
            </div>
            <div className="edit-profile-modal-title-group">
              <h2 id="edit-profile-title" className="edit-profile-modal-title">
                Edit profile
              </h2>
              <p className="edit-profile-modal-subtitle">Update your display name</p>
            </div>
          </div>
          <button
            className="edit-profile-modal-close"
            onClick={() => {
              trigger("nudge");
              onClose();
            }}
            type="button"
            aria-label="Close"
          >
            <IconClose size={18} />
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
          {import.meta.env.VITE_FEATURE_AVATAR_UPLOAD === "true" && (
            <div className="edit-profile-avatar-actions">
              <button type="button" className="edit-profile-avatar-link upload">
                Upload
              </button>
              <button type="button" className="edit-profile-avatar-link remove">
                Remove
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="edit-profile-field">
            <label className="edit-profile-label" htmlFor="edit-profile-name">
              Display name
            </label>
            <div className={`edit-profile-input-wrapper ${error ? "has-error" : ""}`}>
              <input
                id="edit-profile-name"
                type="text"
                className="edit-profile-input"
                value={name}
                onKeyDown={() => trigger(8)}
                onBeforeInput={() => trigger(8)}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                autoFocus
              />
            </div>
            {error && (
              <p className="edit-profile-error" role="alert">
                {error}
              </p>
            )}
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
            <p className="edit-profile-hint">Email is managed by your Google account</p>
          </div>

          <div className="edit-profile-modal-actions">
            <button
              type="button"
              className="edit-profile-btn-cancel"
              onClick={() => {
                trigger("nudge");
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-profile-btn-save"
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

export default EditProfileModal;
