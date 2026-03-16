import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import './CreateNamespaceModal.css'

function CreateNamespaceModal({ isOpen, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createNamespace = useMutation(api.namespaces.create)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '')

  function handleNameChange(e) {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setName(value)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sanitizedName || isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      await createNamespace({ slug: sanitizedName })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create namespace')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <form className="cnm" onSubmit={handleSubmit}>
        <div className="cnm-header">
          <div className="cnm-header-left">
            <div className="cnm-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="cnm-title-group">
              <h2 className="cnm-title">Create namespace</h2>
              <p className="cnm-subtitle">Organize your links under a custom path</p>
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
          <label className="cnm-label" htmlFor="namespace-name">Namespace name</label>
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>qrni.co/{sanitizedName || '[namespace]'}/your-slug</span>
        </div>

        <div className="cnm-field">
          <label className="cnm-label" htmlFor="namespace-desc">Description (optional)</label>
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
            {isSubmitting ? 'Creating...' : 'Create namespace'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

export default CreateNamespaceModal
