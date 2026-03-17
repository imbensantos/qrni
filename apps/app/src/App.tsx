import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Outlet, Link } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "./hooks/useAuth";
import { getCachedUser, cacheUser, clearCachedUser } from "./utils/cached-user";
import ProfileDropdown from "./components/ProfileDropdown";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

function App() {
  const { signIn } = useAuthActions();
  const { isLoading } = useAuth();
  const user = useQuery(api.users.currentUser);
  const cachedUser = getCachedUser();

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
      <div className="app">
        <header className="header">
          <Link to="/" className="logo-link">
            <h1 className="logo">QRni ✨</h1>
          </Link>
          {isLoading && !cachedUser ? (
            <div className="auth-placeholder" />
          ) : dropdownUser ? (
            <ProfileDropdown user={dropdownUser} />
          ) : (
            <button className="signin-btn" onClick={() => signIn("google")}>
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
