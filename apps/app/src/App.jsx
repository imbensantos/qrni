import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Outlet, Link } from '@tanstack/react-router'
import { api } from '../../../convex/_generated/api'
import ProfileDropdown from './components/ProfileDropdown'
import './App.css'

function App() {
  const { signIn } = useAuthActions()
  const user = useQuery(api.users.currentUser)

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo-link">
          <h1 className="logo">QRni ✨</h1>
        </Link>
        {user ? (
          <ProfileDropdown user={user} />
        ) : (
          <button className="signin-btn" onClick={() => signIn("google")}>
            Sign in
          </button>
        )}
      </header>
      <Outlet />
    </div>
  )
}

export default App
