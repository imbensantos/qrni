import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import '../modals/CreateNamespaceModal.css'

function RenameNamespaceModal({ isOpen, onClose, namespaceId, namespaceName, namespaceDescription }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateNamespace = useMutation(api.namespaces.update)

  useEffect(() => {
    if (isOpen) {
      setName(namespaceName || '')
      setDescription(namespaceDescription || '')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen, namespaceName, namespaceDescription])

  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '')

  function handleNameChange(e) {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setName(value)
    setError('')
  }

  const hasChanges = sanitizedName !== namespaceName || description !== (namespaceDescription || '')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sanitizedName || isSubmitting || !hasChanges) return

    setIsSubmitting(true)
    setError('')

    try {
      const args = { namespaceId }
      if (sanitizedName !== namespaceName) args.newSlug = sanitizedName
      if (description !== (namespaceDescription || '')) args.description = description
      await updateNamespace(args)
      onClose()
    } catch (err) {
      const msg = err.message
        ?.replace(/\[CONVEX [^\]]*\]\s*/g, '')
        .replace(/Uncaught Error:\s*/gi, '')
        .replace(/\s*at handler\s*\(.*$/s, '')
        .replace(/\s*Called by client\s*$/i, '')
        .trim()
      setError(msg || 'Failed to update namespace')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!namespaceId) return null

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <form className="cnm" onSubmit={handleSubmit}>
        <div className="cnm-header">
          <div className="cnm-header-left">
            <div className="cnm-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
            <div className="cnm-title-group">
              <h2 className="cnm-title">Edit namespace</h2>
              <p className="cnm-subtitle">Update the name or description</p>
            </div>
          </div>
          <button type="button" className="cnm-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cnm-field">
          <label className="cnm-label" htmlFor="edit-namespace-name">Namespace name</label>
          <input
            id="edit-namespace-name"
            className="cnm-input"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="my-portfolio"
            autoFocus
          />
        </div>

        <div className="cnm-url-preview">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span><span style={{ opacity: 0.5 }}>{window.location.host}/</span>{sanitizedName || '[namespace]'}<span style={{ opacity: 0.5 }}>/your-slug</span></span>
        </div>

        <div className="cnm-field">
          <label className="cnm-label" htmlFor="edit-namespace-desc">Description (optional)</label>
          <textarea
            id="edit-namespace-desc"
            className="cnm-textarea"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError('') }}
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
            disabled={isSubmitting || !hasChanges}
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

export default RenameNamespaceModal
