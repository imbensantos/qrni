import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import './EditLinkModal.css'

function PencilCircleIcon() {
  return (
    <div className="edit-link-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    </div>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function EditLinkModal({ isOpen, onClose, link }) {
  const [slug, setSlug] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const updateLink = useMutation(api.links.updateLink)

  // Sync form state when link prop changes
  useEffect(() => {
    if (link) {
      setSlug(link.namespace ? (link.namespaceSlug || '') : (link.shortCode || ''))
      setDestinationUrl(link.destinationUrl || '')
      setError(null)
    }
  }, [link])

  const prefix = link?.namespace
    ? `qrni.co/${link.namespace}/`
    : 'qrni.co/'

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting || !link) return

    const trimmedSlug = slug.trim()
    const trimmedUrl = destinationUrl.trim()

    if (!trimmedSlug) {
      setError('Slug cannot be empty')
      return
    }

    if (!/^[a-zA-Z0-9-]+$/.test(trimmedSlug)) {
      setError('Only letters, numbers, and hyphens are allowed')
      return
    }

    if (!trimmedUrl) {
      setError('Destination URL cannot be empty')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await updateLink({
        linkId: link._id,
        newSlug: trimmedSlug,
        newDestinationUrl: trimmedUrl,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update link')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
      <div className="edit-link-modal">
        <div className="edit-link-header">
          <div className="edit-link-header-left">
            <PencilCircleIcon />
            <div className="edit-link-header-text">
              <h2 className="edit-link-title">Edit link</h2>
              <p className="edit-link-subtitle">Update the slug or destination URL</p>
            </div>
          </div>
          <button className="edit-link-close" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-link-form">
          <div className="edit-link-field">
            <label className="edit-link-label" htmlFor="edit-slug">Short link slug</label>
            <div className="edit-link-input-group">
              <span className="edit-link-prefix">{prefix}</span>
              <input
                id="edit-slug"
                type="text"
                className="edit-link-input slug-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-slug"
                autoComplete="off"
              />
            </div>
            <span className="edit-link-hint">Only letters, numbers, and hyphens allowed</span>
          </div>

          <div className="edit-link-field">
            <label className="edit-link-label" htmlFor="edit-destination">Destination URL</label>
            <div className="edit-link-input-group">
              <span className="edit-link-input-icon"><LinkIcon /></span>
              <input
                id="edit-destination"
                type="url"
                className="edit-link-input destination-input"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://example.com"
                autoComplete="off"
              />
            </div>
          </div>

          {link && (
            <div className="edit-link-info-row">
              <span className="edit-link-info-item">
                Created: {formatDate(link.createdAt)}
              </span>
              <span className="edit-link-info-separator" />
              <span className="edit-link-info-item">
                Clicks: {link.clickCount ?? 0}
              </span>
              {link.namespace && (
                <>
                  <span className="edit-link-info-separator" />
                  <span className="edit-link-info-item">
                    Namespace: {link.namespace}
                  </span>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="edit-link-error">{error}</div>
          )}

          <div className="edit-link-actions">
            <button type="button" className="edit-link-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="edit-link-btn save" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

export default EditLinkModal
