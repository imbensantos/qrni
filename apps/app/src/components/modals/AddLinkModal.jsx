import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import ModalBackdrop from './ModalBackdrop'
import { IconPlus, IconClose, IconLink } from '../Icons'
import './AddLinkModal.css'

function AddLinkModal({ isOpen, onClose, namespaceId, namespaceSlug }) {
  const [slug, setSlug] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [slugError, setSlugError] = useState('')
  const [urlError, setUrlError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const createCustomSlugLink = useMutation(api.links.createCustomSlugLink)
  const createNamespacedLink = useMutation(api.links.createNamespacedLink)

  useEffect(() => {
    if (isOpen) {
      setSlug('')
      setDestinationUrl('')
      setSlugError('')
      setUrlError('')
      setSubmitting(false)
    }
  }, [isOpen])

  const prefix = namespaceId ? `${window.location.host}/${namespaceSlug}/` : `${window.location.host}/`

  async function handleSubmit(e) {
    e.preventDefault()
    setSlugError('')
    setUrlError('')

    let hasError = false
    if (!slug.trim()) {
      setSlugError('Slug is required')
      hasError = true
    } else if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      setSlugError('Only letters, numbers, and hyphens allowed')
      hasError = true
    }

    if (!destinationUrl.trim()) {
      setUrlError('Destination URL is required')
      hasError = true
    } else if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://')
      hasError = true
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
      <form className="alm" onSubmit={handleSubmit}>
        <div className="alm-header">
          <div className="alm-header-left">
            <div className="alm-icon-circle">
              <IconPlus size={20} />
            </div>
            <div className="alm-title-group">
              <h2 className="alm-title">Add new link</h2>
              <p className="alm-subtitle">Create a custom short link</p>
            </div>
          </div>
          <button type="button" className="alm-close-btn" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
        </div>

        <div className="alm-fields">
          <div className="alm-field">
            <label className="alm-label" htmlFor="alm-url">Destination URL</label>
            <div className={`alm-dest-row ${urlError ? 'has-error' : ''}`}>
              <span className="alm-dest-icon"><IconLink size={16} /></span>
              <input
                id="alm-url"
                type="text"
                className="alm-dest-input"
                value={destinationUrl}
                onChange={(e) => { setDestinationUrl(e.target.value); setUrlError('') }}
                placeholder="https://example.com/your-page"
                autoFocus
              />
            </div>
            {urlError && <p className="alm-error">{urlError}</p>}
          </div>

          <div className="alm-field">
            <label className="alm-label" htmlFor="alm-slug">Short link slug</label>
            <div className={`alm-slug-row ${slugError ? 'has-error' : ''}`}>
              <span className="alm-slug-prefix">{prefix}</span>
              <input
                id="alm-slug"
                type="text"
                className="alm-slug-input"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugError('') }}
                placeholder="my-link"
              />
            </div>
            {slugError ? (
              <p className="alm-error">{slugError}</p>
            ) : (
              <p className="alm-hint">Only letters, numbers, and hyphens allowed</p>
            )}
          </div>
        </div>

        <div className="alm-actions">
          <button type="button" className="alm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="alm-btn-create" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create link'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  )
}

export default AddLinkModal
