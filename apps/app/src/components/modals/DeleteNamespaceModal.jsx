import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { cleanConvexError } from '../../utils/errors'
import ModalBackdrop from './ModalBackdrop'
import { IconTrash } from '../Icons'

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
      const msg = cleanConvexError(err.message ?? '')
      setError(msg || 'Failed to delete namespace')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="delete-modal">
        <div className="delete-modal-icon" style={{ color: '#DC2626' }}>
          <IconTrash size={28} />
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
