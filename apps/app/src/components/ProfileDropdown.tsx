import { useState, useRef } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useWebHaptics } from "web-haptics/react";
import { Link } from "@tanstack/react-router";
import { useClickOutside } from "../hooks/useClickOutside";
import "./ProfileDropdown.css";

interface ProfileDropdownUser {
  name?: string;
  email?: string;
  image?: string;
}

interface ProfileDropdownProps {
  user: ProfileDropdownUser;
}

function ProfileDropdown({ user }: ProfileDropdownProps) {
  const { trigger } = useWebHaptics();
  const [open, setOpen] = useState(false);
  const { signOut } = useAuthActions();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setOpen(false), open);

  const initial = (user.name || user.email || "?")[0].toUpperCase();
  const firstName = (user.name || user.email || "User").split(" ")[0];

  return (
    <div className="pd" ref={dropdownRef}>
      <button
        className="pd-trigger"
        onClick={() => {
          trigger(8);
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Profile menu"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="pd-trigger-avatar-img"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="pd-trigger-avatar-fallback">{initial}</span>
        )}
        <span className="pd-trigger-name">{firstName}</span>
        <svg
          className="pd-trigger-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="pd-menu" role="menu">
          <Link
            to="/profile"
            className="pd-menu-info"
            onClick={() => {
              trigger("nudge");
              setOpen(false);
            }}
          >
            <span className="pd-menu-name">{user.name || user.email || "User"}</span>
            {user.email && <span className="pd-menu-email">{user.email}</span>}
          </Link>
          <div className="pd-menu-divider" />
          <button
            className="pd-menu-item"
            role="menuitem"
            onClick={() => {
              trigger("nudge");
              signOut();
              setOpen(false);
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
