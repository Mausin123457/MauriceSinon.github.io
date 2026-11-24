import { Link, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth.js'
import './App.css'

function App() {
  const { session, isLoading, error, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="app">
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
                <button type="button" onClick={handleLogout}>Uitloggen</button>
              </>
            )}
          </div>
        </nav>
      </header>
      {error && <p role="alert">De sessie kon niet worden geladen.</p>}
      <main className="page-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>WPFW portfolio</p>
      </footer>
    </div>
  )
}

export default App
