import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'

function DeleteNamespaceModal({ isOpen, onClose, namespaceId, namespaceName }) {
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const removeNamespace = useMutation(api.namespaces.remove)

  if (!namespaceId) return null

  async function handleDelete() {
    setError(null)
    setSubmitting(true)
    try {
      await removeNamespace({ namespaceId })
      onClose()
    } catch (err) {
      const msg = err.message
        ?.replace(/\[CONVEX [^\]]*\]\s*/g, '')
        .replace(/Uncaught Error:\s*/gi, '')
        .replace(/\s*at handler\s*\(.*$/s, '')
        .replace(/\s*Called by client\s*$/i, '')
        .trim()
      setError(msg || 'Failed to delete namespace')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="delete-modal">
        <div className="delete-modal-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </div>

        <h2 className="delete-modal-title">Delete namespace?</h2>

        <p className="delete-modal-warning">
          This will permanently delete the namespace <strong>{namespaceName}</strong> and
          all links inside it. Anyone using these links will get a 404 error.
          This action cannot be undone.
        </p>

        {error && <div className="delete-modal-error">{error}</div>}

        <div className="delete-modal-actions">
          <button className="delete-modal-cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="delete-modal-confirm" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete namespace'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

export default DeleteNamespaceModal
