import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "@tanstack/react-router";
import "./InviteAcceptPage.css";
import { ERR, INVITE_RETURN_KEY } from "../../utils/constants";
import {
  IconCheck,
  IconXCircle,
  IconWarning,
  IconFolderOpen,
  IconUserPlus,
} from "../../components/common/Icons";

function InviteAcceptPage() {
  const { token } = useParams({ from: "/invite/$token" });
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const invite = useQuery(api.collaboration.getInviteByToken, { token });
  const acceptInvite = useMutation(api.collaboration.acceptInvite);
  const [status, setStatus] = useState<"idle" | "accepting" | "accepted" | "error">("idle");
  const [error, setError] = useState("");
  const [acceptedInvite, setAcceptedInvite] = useState<{
    namespaceName: string;
    role: string;
  } | null>(null);

  async function handleAccept() {
    setStatus("accepting");
    setError("");
    setAcceptedInvite(invite ? { namespaceName: invite.namespaceName, role: invite.role } : null);
    try {
      await acceptInvite({ token });
      setStatus("accepted");
    } catch (err) {
      setAcceptedInvite(null);
      const message = (err as Error).message || "Failed to accept invite";
      setStatus("error");
      if (message.includes(ERR.ALREADY_OWNER)) {
        setError("You already own this namespace.");
      } else if (message.includes(ERR.ALREADY_MEMBER)) {
        setError("You're already a member of this namespace.");
      } else {
        setError(message);
      }
    }
  }

  async function handleSwitchAccount() {
    // Persist the invite URL so we can return after OAuth
    sessionStorage.setItem(INVITE_RETURN_KEY, `/invite/${token}`);
    await signOut();
    void signIn("google");
  }

  // Accepted state — check before reactive query nulls out
  if (status === "accepted" && acceptedInvite) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-icon-circle">
            <IconCheck size={28} color="#3D8A5A" />
          </div>
          <h1 className="invite-title">You're in!</h1>
          <p className="invite-subtitle">
            You've joined <strong>{acceptedInvite.namespaceName}</strong> as {acceptedInvite.role}.
          </p>
          <a href="/" className="invite-cta">
            Go to QRni
          </a>
        </div>
      </div>
    );
  }

  // Accepting in-progress — don't react to query changes mid-flight
  if (status === "accepting") {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-loading">Accepting invitation...</p>
        </div>
      </div>
    );
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
            <IconXCircle size={28} color="#D08068" />
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

  // Invite details (shared across states below)
  const inviteDetails = (
    <>
      <p className="invite-subtitle">{invite.inviterName} invited you to collaborate on</p>
      <div className="invite-namespace-badge">
        <IconFolderOpen size={20} color="#D89575" />
        <span>{invite.namespaceName}</span>
      </div>
      <div className="invite-role-row">
        <span className="invite-role-label">as</span>
        <span className="invite-role-badge">
          {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
        </span>
      </div>
    </>
  );

  // Email mismatch — signed in as wrong account
  if (isAuthenticated && invite.emailMatch === false) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-icon-circle invite-icon-warning">
            <IconWarning size={28} color="#D4A64A" />
          </div>
          <h1 className="invite-title">Wrong account</h1>
          <p className="invite-subtitle">
            This invite was sent to a different email address. Please switch to the correct account
            to accept.
          </p>
          {inviteDetails}
          <button className="invite-cta" onClick={handleSwitchAccount}>
            Switch account
          </button>
        </div>
      </div>
    );
  }

  // Main invite view
  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-icon-circle">
          <IconUserPlus size={28} color="#3D8A5A" />
        </div>
        <h1 className="invite-title">You're invited!</h1>
        {inviteDetails}

        {!isAuthenticated ? (
          <button className="invite-cta" onClick={() => signIn("google")}>
            Sign in with Google to accept
          </button>
        ) : (
          <button className="invite-cta" onClick={handleAccept}>
            Accept Invitation
          </button>
        )}

        {error && <p className="invite-error">{error}</p>}
      </div>
    </div>
  );
}

export default InviteAcceptPage;
