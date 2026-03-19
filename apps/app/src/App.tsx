import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useWebHaptics } from "web-haptics/react";
import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "./hooks/useAuth";
import { getCachedUser, cacheUser, clearCachedUser } from "./utils/cached-user";
import ProfileDropdown from "./components/ProfileDropdown";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

const INVITE_RETURN_KEY = "qrni_invite_return";

function App() {
  const { signIn } = useAuthActions();
  const { trigger } = useWebHaptics();
  const { isLoading } = useAuth();
  const user = useQuery(api.users.currentUser);
  const cachedUser = getCachedUser();
  const navigate = useNavigate();

  // Keep cache in sync with real auth state
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        cacheUser({
          name: user.name ?? "",
          email: user.email ?? "",
          image: user.image,
        });
      } else {
        clearCachedUser();
      }
    }
  }, [isLoading, user]);

  // After OAuth account switch, redirect back to the invite page
  useEffect(() => {
    const returnPath = sessionStorage.getItem(INVITE_RETURN_KEY);
    if (returnPath && !isLoading) {
      sessionStorage.removeItem(INVITE_RETURN_KEY);
      void navigate({ to: returnPath });
    }
  }, [isLoading, navigate]);

  // While loading: show cached user optimistically, or empty placeholder if no cache
  const displayUser = isLoading ? cachedUser : user;

  // Normalize to ProfileDropdown-compatible shape (image must be string | undefined, not null)
  const dropdownUser = displayUser
    ? {
        name: displayUser.name ?? undefined,
        email: displayUser.email ?? undefined,
        image: displayUser.image ?? undefined,
      }
    : null;

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="app">
        <header className="header">
          <Link to="/" className="logo-link" onClick={() => trigger("nudge")}>
            <h1 className="logo">QRni ✨</h1>
          </Link>
          {isLoading && !cachedUser ? (
            <div className="auth-placeholder" />
          ) : dropdownUser ? (
            <ProfileDropdown user={dropdownUser} />
          ) : (
            <button
              className="signin-btn"
              onClick={() => {
                trigger("nudge");
                signIn("google");
              }}
            >
              Sign in
            </button>
          )}
        </header>
        <Outlet />
      </div>
    </ErrorBoundary>
  );
}

export default App;
