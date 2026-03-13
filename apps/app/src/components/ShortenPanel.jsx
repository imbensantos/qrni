import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useWebHaptics } from 'web-haptics/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '../hooks/useAuth'
import './ShortenPanel.css'

const BASE_URL_PATH = '/s/'

function ShortenPanel() {
  const [url, setUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [selectedNamespace, setSelectedNamespace] = useState(null)
  const [namespaceSlug, setNamespaceSlug] = useState('')
  const [newNamespaceName, setNewNamespaceName] = useState('')
  const [showCreateNamespace, setShowCreateNamespace] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { trigger } = useWebHaptics()
  const { isAuthenticated } = useAuth()

  const createAnonymousLink = useMutation(api.links.createAnonymousLink)
  const createCustomSlugLink = useMutation(api.links.createCustomSlugLink)
  const createNamespacedLink = useMutation(api.links.createNamespacedLink)
  const createNamespace = useMutation(api.namespaces.create)

  const myLinks = useQuery(api.links.listMyLinks) ?? []
  const myNamespaces = useQuery(api.namespaces.listMine)

  const isValidUrl = url.startsWith('http://') || url.startsWith('https://')
  const flatCustomCount = myLinks.filter(l => !l.namespace && l.owner).length

  const handleUrlChange = (e) => {
    setUrl(e.target.value)
    setResult(null)
    setError(null)
  }

  const handleShorten = async () => {
    if (!isValidUrl) return
    setLoading(true)
    setError(null)

    try {
      let res
      if (!isAuthenticated) {
        res = await createAnonymousLink({ destinationUrl: url, creatorIp: 'anonymous' })
      } else if (selectedNamespace) {
        if (!namespaceSlug.trim()) {
          setError('Enter a slug for this namespace link')
          setLoading(false)
          return
        }
        res = await createNamespacedLink({
          destinationUrl: url,
          namespaceId: selectedNamespace._id,
          slug: namespaceSlug.trim(),
        })
      } else if (customSlug.trim()) {
        res = await createCustomSlugLink({
          destinationUrl: url,
          customSlug: customSlug.trim(),
        })
      } else {
        res = await createAnonymousLink({ destinationUrl: url, creatorIp: 'anonymous' })
      }
      setResult(res)
      trigger('success')
    } catch (err) {
      setError(err.message)
      trigger('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    const shortUrl = `${window.location.origin}${BASE_URL_PATH}${result.shortCode}`
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    trigger('success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateNamespace = async () => {
    if (!newNamespaceName.trim()) return
    try {
      await createNamespace({ slug: newNamespaceName.trim() })
      setShowCreateNamespace(false)
      setNewNamespaceName('')
      trigger('success')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleNamespaceSelect = (e) => {
    const value = e.target.value
    if (value === 'create-new') {
      setShowCreateNamespace(true)
      setSelectedNamespace(null)
      return
    }
    if (value === 'none') {
      setSelectedNamespace(null)
      return
    }
    const allNamespaces = [
      ...(myNamespaces?.owned ?? []),
      ...(myNamespaces?.collaborated ?? []),
    ]
    const ns = allNamespaces.find(n => n._id === value)
    setSelectedNamespace(ns ?? null)
  }

  const shortUrl = result
    ? `${window.location.origin}${BASE_URL_PATH}${result.shortCode}`
    : null

  return (
    <>
      {/* URL Input */}
      <section className="control-section" role="group" aria-labelledby="shorten-url-label">
        <label id="shorten-url-label" className="control-label" htmlFor="shorten-url-input">
          URL
        </label>
        <input
          id="shorten-url-input"
          type="url"
          className="url-input"
          placeholder="Paste a URL to shorten"
          value={url}
          onChange={handleUrlChange}
          onKeyDown={(e) => { if (e.key === 'Enter') handleShorten() }}
          onBeforeInput={() => trigger(8)}
          autoFocus
        />
      </section>

      {/* Authenticated controls */}
      {isAuthenticated && (
        <>
          <hr className="divider" />

          {/* Custom Slug */}
          <section className="control-section" role="group" aria-labelledby="slug-label">
            <div className="control-header">
              <label id="slug-label" className="control-label" htmlFor="slug-input">
                Custom slug
              </label>
              <span className="slug-counter">{flatCustomCount} of 5 used</span>
            </div>
            <input
              id="slug-input"
              type="text"
              className="url-input"
              placeholder="e.g., my-link"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              disabled={!!selectedNamespace}
            />
          </section>

          {/* Namespace */}
          <section className="control-section" role="group" aria-labelledby="namespace-label">
            <label id="namespace-label" className="control-label" htmlFor="namespace-select">
              Namespace
            </label>
            <div className="namespace-select-wrapper">
              <select
                id="namespace-select"
                className="namespace-select"
                value={selectedNamespace?._id ?? 'none'}
                onChange={handleNamespaceSelect}
              >
                <option value="none">None (flat link)</option>
                {myNamespaces?.owned?.map(ns => (
                  <option key={ns._id} value={ns._id}>{ns.slug} (owned)</option>
                ))}
                {myNamespaces?.collaborated?.map(ns => (
                  <option key={ns._id} value={ns._id}>{ns.slug} ({ns.role})</option>
                ))}
                <option value="create-new">+ Create new namespace</option>
              </select>
              <span className="namespace-chevron" aria-hidden="true">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </section>

          {/* Create namespace inline form */}
          {showCreateNamespace && (
            <div className="create-namespace-form">
              <input
                type="text"
                className="url-input"
                placeholder="namespace-name"
                value={newNamespaceName}
                onChange={(e) => setNewNamespaceName(e.target.value.toLowerCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNamespace() }}
                autoFocus
              />
              <div className="create-namespace-actions">
                <button className="ns-create-btn" onClick={handleCreateNamespace}>
                  Create
                </button>
                <button
                  className="ns-cancel-btn"
                  onClick={() => { setShowCreateNamespace(false); setNewNamespaceName('') }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Namespace slug input */}
          {selectedNamespace && (
            <section className="control-section" role="group" aria-labelledby="ns-slug-label">
              <label id="ns-slug-label" className="control-label">
                {selectedNamespace.slug}/
              </label>
              <input
                type="text"
                className="url-input"
                placeholder="e.g., rsvp"
                value={namespaceSlug}
                onChange={(e) => setNamespaceSlug(e.target.value)}
              />
            </section>
          )}

          {/* Namespace nudge: shown after 2+ flat links used */}
          {!selectedNamespace && flatCustomCount >= 2 && (
            <div className="namespace-nudge" role="note">
              <span className="nudge-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" fill="#D89575" />
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" fill="#D89575" />
                </svg>
              </span>
              <span className="nudge-text">
                Want unlimited short links? Try a namespace instead — perfect for grouping event links.
              </span>
            </div>
          )}
        </>
      )}

      {/* Shorten button */}
      <button
        className="shorten-btn"
        onClick={handleShorten}
        disabled={!isValidUrl || loading}
        aria-busy={loading}
      >
        {loading ? 'Shortening...' : 'Shorten'}
      </button>

      {/* Error message */}
      {error && (
        <p className="shorten-error" role="alert">
          {error}
        </p>
      )}

      {/* Result card */}
      {result && shortUrl && (
        <div className="shorten-result" role="status" aria-label="Shortened link ready">
          <div className="result-left">
            <span className="result-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#3D8A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#3D8A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="result-url">{shortUrl}</span>
          </div>
          <button className="copy-btn" onClick={handleCopy} aria-label="Copy shortened link">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Sign-in prompt for anonymous users */}
      {!isAuthenticated && (
        <p className="shorten-hint">
          Sign in for custom slugs and namespaces — perfect for events!
        </p>
      )}

      <div className="panel-spacer" />

      <footer className="panel-footer panel-footer-desktop">
        <span>Powered by</span>
        <a
          href="https://imbensantos.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit imBento website"
        >
          <img src="/imbento-logo-dark.svg" alt="imBento" className="imbento-logo" />
        </a>
      </footer>
    </>
  )
}

export default ShortenPanel
