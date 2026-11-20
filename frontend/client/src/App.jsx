import { Link, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="site-header">
        <nav className="navigation" aria-label="Hoofdnavigatie">
          <Link to="/" className="brand">Maurice Sinon</Link>
          <div className="navigation-links">
            <Link to="/projects">Projecten</Link>
            <Link to="/blogposts">Blog</Link>
            <Link to="/login">Inloggen</Link>
          </div>
        </nav>
      </header>
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
