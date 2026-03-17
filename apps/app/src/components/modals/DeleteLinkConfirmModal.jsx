import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import './DeleteLinkConfirmModal.css'

function TrashIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function DeleteLinkConfirmModal({ isOpen, onClose, link }) {
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const deleteLink = useMutation(api.links.deleteLink)

  if (!link) return null

  const shortUrl = `${window.location.host}/${link.shortCode}`

  async function handleDelete() {
    setError(null)
    setSubmitting(true)
    try {
      await deleteLink({ linkId: link._id })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to delete link')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="delete-modal">
        <div className="delete-modal-icon">
          <TrashIcon />
        </div>

        <h2 className="delete-modal-title">Delete this link?</h2>

        <p className="delete-modal-warning">
          This will permanently delete the short link <strong>{window.location.host}/{link.shortCode}</strong> and
          its QR code. Anyone using this link will get a 404 error. This action cannot be undone.
        </p>

        <div className="delete-modal-preview">
          <div className="delete-modal-preview-short">{shortUrl}</div>
          <div className="delete-modal-preview-dest">{link.destinationUrl}</div>
        </div>

        {error && <div className="delete-modal-error">{error}</div>}

        <div className="delete-modal-actions">
          <button className="delete-modal-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="delete-modal-confirm" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete link'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

export default DeleteLinkConfirmModal
