import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "@tanstack/react-router";
import "./InviteAcceptPage.css";

function InviteAcceptPage() {
  const { token } = useParams({ from: "/invite/$token" });
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const invite = useQuery(api.collaboration.getInviteByToken, { token });
  const acceptInvite = useMutation(api.collaboration.acceptInvite);
  const [status, setStatus] = useState<"idle" | "accepting" | "accepted" | "error">("idle");
  const [error, setError] = useState("");

  async function handleAccept() {
    setStatus("accepting");
    setError("");
    try {
      await acceptInvite({ token });
      setStatus("accepted");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message || "Failed to accept invite");
    }
  }

  // Loading state
  if (invite === undefined || authLoading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-loading">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired invite
  if (invite === null) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-icon-circle invite-icon-error">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D08068"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="invite-title">Invite not found</h1>
          <p className="invite-subtitle">This invitation may have expired or been revoked.</p>
          <a href="/" className="invite-cta-secondary">
            Go to QRni
          </a>
        </div>
      </div>
    );
  }

  // Accepted state
  if (status === "accepted") {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-icon-circle">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3D8A5A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="invite-title">You're in!</h1>
          <p className="invite-subtitle">
            You've joined <strong>{invite.namespaceName}</strong> as {invite.role}.
          </p>
          <a href="/" className="invite-cta">
            Go to QRni
          </a>
        </div>
      </div>
    );
  }

  // Main invite view
  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-icon-circle">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3D8A5A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h1 className="invite-title">You're invited!</h1>
        <p className="invite-subtitle">{invite.inviterName} invited you to collaborate on</p>

        <div className="invite-namespace-badge">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D89575"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span>{invite.namespaceName}</span>
        </div>

        <div className="invite-role-row">
          <span className="invite-role-label">as</span>
          <span className="invite-role-badge">
            {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
          </span>
        </div>

        {!isAuthenticated ? (
          <button className="invite-cta" onClick={() => signIn("google")}>
            Sign in with Google to accept
          </button>
        ) : (
          <button className="invite-cta" onClick={handleAccept} disabled={status === "accepting"}>
            {status === "accepting" ? "Accepting..." : "Accept Invitation"}
          </button>
        )}

        {error && <p className="invite-error">{error}</p>}
      </div>
    </div>
  );
}

export default InviteAcceptPage;
