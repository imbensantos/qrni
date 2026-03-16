import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import './AddLinkModal.css'

function AddLinkModal({ isOpen, onClose, namespaceId, namespaceSlug }) {
  const [slug, setSlug] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [slugError, setSlugError] = useState('')
  const [urlError, setUrlError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const createCustomSlugLink = useMutation(api.links.createCustomSlugLink)
  const createNamespacedLink = useMutation(api.links.createNamespacedLink)

  // Clear form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSlug('')
      setDestinationUrl('')
      setSlugError('')
      setUrlError('')
      setSubmitting(false)
    }
  }, [isOpen])

  const prefix = namespaceId ? `qrni.co/${namespaceSlug}/` : 'qrni.co/'

  async function handleSubmit(e) {
    e.preventDefault()
    setSlugError('')
    setUrlError('')

    // Basic validation
    let hasError = false
    if (!slug.trim()) {
      setSlugError('Slug is required')
      hasError = true
    } else if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
      setSlugError('Only letters, numbers, and hyphens allowed')
      hasError = true
    }

    if (!destinationUrl.trim()) {
      setUrlError('Destination URL is required')
      hasError = true
    } else {
      try {
        new URL(destinationUrl)
      } catch {
        setUrlError('Please enter a valid URL')
        hasError = true
      }
    }

    if (hasError) return

    setSubmitting(true)
    try {
      if (namespaceId) {
        await createNamespacedLink({ destinationUrl, namespaceId, slug })
      } else {
        await createCustomSlugLink({ destinationUrl, customSlug: slug })
      }
      onClose()
    } catch (err) {
      const message = err.message || 'Something went wrong'
      // Try to show error on the most relevant field
      if (message.toLowerCase().includes('slug') || message.toLowerCase().includes('short')) {
        setSlugError(message)
      } else if (message.toLowerCase().includes('url') || message.toLowerCase().includes('destination')) {
        setUrlError(message)
      } else {
        setSlugError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="add-link-modal">
        <div className="add-link-modal-header">
          <div className="add-link-modal-title-row">
            <div className="add-link-modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h2 className="add-link-modal-title">Add new link</h2>
              <p className="add-link-modal-subtitle">Create a custom short link</p>
            </div>
          </div>
          <button className="add-link-modal-close" onClick={onClose} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-link-modal-form">
          <div className="add-link-field">
            <label className="add-link-label" htmlFor="add-link-slug">Short link slug</label>
            <div className={`add-link-input-wrapper ${slugError ? 'has-error' : ''}`}>
              <span className="add-link-input-prefix">{prefix}</span>
              <input
                id="add-link-slug"
                type="text"
                className="add-link-input"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugError('') }}
                placeholder="my-link"
                autoFocus
              />
            </div>
            {slugError ? (
              <p className="add-link-error">{slugError}</p>
            ) : (
              <p className="add-link-hint">Only letters, numbers, and hyphens allowed</p>
            )}
          </div>

          <div className="add-link-field">
            <label className="add-link-label" htmlFor="add-link-url">Destination URL</label>
            <div className={`add-link-input-wrapper ${urlError ? 'has-error' : ''}`}>
              <span className="add-link-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </span>
              <input
                id="add-link-url"
                type="text"
                className="add-link-input"
                value={destinationUrl}
                onChange={(e) => { setDestinationUrl(e.target.value); setUrlError('') }}
                placeholder="https://example.com/your-page"
              />
            </div>
            {urlError && <p className="add-link-error">{urlError}</p>}
          </div>

          <div className="add-link-modal-actions">
            <button type="button" className="add-link-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-link-btn-create" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create link'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

export default AddLinkModal
