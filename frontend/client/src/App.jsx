import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth.js'
import './App.css'

function App() {
  const { session, isLoading, error, logout } = useAuth()
  const [logoutError, setLogoutError] = useState(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLogoutError(null)
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (requestError) {
      setLogoutError(requestError)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Naar hoofdinhoud</a>
      <header className="site-header">
        <nav className="navigation" aria-label="Hoofdnavigatie">
          <Link to="/" className="brand">Maurice Sinon</Link>
          <div className="navigation-links">
            <Link to="/projects">Projecten</Link>
            <Link to="/blogposts">Blog</Link>
            {isLoading && <span> Sessie laden...</span>}
            {!isLoading && !error && !session && (
              <>
                <Link to="/login">Inloggen</Link>
                <Link to="/register">Registreren</Link>
              </>
            )}
            {!isLoading && !error && session && (
              <>
                <span>Ingelogd als {session.username} ({session.roles.join(', ')})</span>
                <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Uitloggen...' : 'Uitloggen'}
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
      {error && <p className="page-error" role="alert">De sessie kon niet worden geladen: {error.message}</p>}
      {logoutError && <p className="page-error" role="alert">Uitloggen is mislukt: {logoutError.message}</p>}
      <main className="page-content" id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>WPFW portfolio</p>
      </footer>
    </div>
  )
}

export default App
