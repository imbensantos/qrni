import { useState, useRef, useEffect } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import './ProfileDropdown.css'

function ProfileDropdown({ user }) {
  const [open, setOpen] = useState(false)
  const { signOut } = useAuthActions()
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const initial = (user.name || user.email || '?')[0].toUpperCase()

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-avatar-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Profile menu"
      >
        {user.image ? (
          <img src={user.image} alt="" className="profile-avatar-img" />
        ) : (
          <span className="profile-avatar-fallback">{initial}</span>
        )}
      </button>
      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-info">
            <span className="profile-menu-name">{user.name}</span>
            {user.email && (
              <span className="profile-menu-email">{user.email}</span>
            )}
          </div>
          <hr className="profile-menu-divider" />
          <button
            className="profile-menu-item"
            role="menuitem"
            onClick={() => { signOut(); setOpen(false) }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
