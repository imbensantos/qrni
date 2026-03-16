import { useQuery, useMutation } from 'convex/react'
import { useState } from 'react'
import { useWebHaptics } from 'web-haptics/react'
import { api } from '../../../../convex/_generated/api'
import { useAuth } from '../hooks/useAuth'
import './ShortenPreview.css'

const BASE_URL = window.location.origin + '/'
const COPY_RESET_DELAY_MS = 2000
const DEST_URL_MAX_LEN = 40

function truncateUrl(url, maxLen = DEST_URL_MAX_LEN) {
  return url.length > maxLen ? url.slice(0, maxLen) + '...' : url
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function EmptyState({ icon, message }) {
  return (
    <div className="shorten-empty">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <p className="empty-text">{message}</p>
    </div>
  )
}

function LinkRow({ link, copiedId, onCopy, onDelete }) {
  const isCopied = copiedId === link._id

  return (
    <tr>
      <td className="link-short">
        <span className="link-code">{link.shortCode}</span>
      </td>
      <td className="link-dest" title={link.destinationUrl}>
        {truncateUrl(link.destinationUrl)}
      </td>
      <td className="link-clicks">{link.clickCount}</td>
      <td className="link-date col-date">{formatDate(link.createdAt)}</td>
      <td className="link-actions">
        <button
          className="action-btn copy"
          onClick={() => onCopy(link.shortCode, link._id)}
          title="Copy short URL"
          aria-label={isCopied ? 'Copied!' : `Copy short URL for ${link.shortCode}`}
        >
          {isCopied ? '✓' : 'Copy'}
        </button>
        <button
          className="action-btn delete"
          onClick={() => onDelete(link._id)}
          title="Delete link"
          aria-label={`Delete short link ${link.shortCode}`}
        >
          ×
        </button>
      </td>
    </tr>
  )
}

function LinksTable({ links, copiedId, onCopy, onDelete }) {
  return (
    <div className="links-table-wrapper">
      <table className="links-table" aria-label="Your shortened links">
        <thead>
          <tr>
            <th scope="col">Short URL</th>
            <th scope="col">Destination</th>
            <th scope="col">Clicks</th>
            <th scope="col" className="col-date">Created</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {links.map(link => (
            <LinkRow
              key={link._id}
              link={link}
              copiedId={copiedId}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ShortenPreview() {
  const { isAuthenticated } = useAuth()
  const { trigger } = useWebHaptics()
  const myLinks = useQuery(api.links.listMyLinks) ?? []
  const deleteLink = useMutation(api.links.deleteLink)
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = async (shortCode, linkId) => {
    await navigator.clipboard.writeText(BASE_URL + shortCode)
    setCopiedId(linkId)
    trigger('success')
    setTimeout(() => setCopiedId(null), COPY_RESET_DELAY_MS)
  }

  const handleDelete = async (linkId) => {
    try {
      await deleteLink({ linkId })
      trigger('nudge')
    } catch (err) {
      console.error(err)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="shorten-preview">
        <EmptyState icon="🔗" message="Your shortened links will appear here" />
      </div>
    )
  }

  return (
    <div className="shorten-preview">
      {myLinks.length === 0 ? (
        <EmptyState icon="✨" message="Your shortened links will appear here" />
      ) : (
        <LinksTable
          links={myLinks}
          copiedId={copiedId}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default ShortenPreview
