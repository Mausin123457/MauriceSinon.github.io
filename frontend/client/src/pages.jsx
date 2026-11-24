import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorMessage, EmptyMessage, LoadingMessage } from './components/StatusMessage.jsx'
import { useApiResource } from './hooks/useApiResource.js'
import { useAuth } from './useAuth.js'
import { registerAccount } from './api/authApi.js'

function formatDate(value) {
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'long',
  }).format(new Date(value))
}

function ResourceState({ isLoading, error, children }) {
  if (isLoading) return <LoadingMessage />
  if (error) return <ErrorMessage>{error.message}</ErrorMessage>
  return children
}

export function HomePage() {
  return (
    <section>
      <h1>Welkom op mijn portfolio</h1>
      <p>Bekijk mijn projecten en blogposts.</p>
    </section>
  )
}

export function ProjectsPage() {
  const { data, isLoading, error } = useApiResource('/projects/')

  return (
    <section>
      <h1>Projecten</h1>
      <ResourceState isLoading={isLoading} error={error}>
        {data?.length ? (
          <div className="card-grid">
            {data.map((project) => (
              <article className="card" key={project.id}>
                <p className="card-meta">{project.category} · {formatDate(project.date)}</p>
                <h2>{project.title}</h2>
                <p>{project.description}</p>
                <Link to={`/projects/${project.id}`}>Bekijk project</Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage>Er zijn nog geen projecten.</EmptyMessage>
        )}
      </ResourceState>
    </section>
  )
}

export function ProjectDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error } = useApiResource(`/projects/${encodeURIComponent(id)}`)

  return (
    <section>
      <ResourceState isLoading={isLoading} error={error}>
        {data && (
          <>
            <p className="card-meta">{data.category} · {formatDate(data.date)}</p>
            <h1>{data.title}</h1>
            <p>{data.description}</p>
            {data.githubUrl && (
              <p><a href={data.githubUrl} target="_blank" rel="noreferrer">Bekijk op GitHub</a></p>
            )}
          </>
        )}
      </ResourceState>
      <Link to="/projects">Terug naar projecten</Link>
    </section>
  )
}

export function BlogPostsPage() {
  const { data, isLoading, error } = useApiResource('/blogposts/')

  return (
    <section>
      <h1>Blog</h1>
      <ResourceState isLoading={isLoading} error={error}>
        {data?.length ? (
          <div className="card-grid">
            {data.map((post) => (
              <article className="card" key={post.id}>
                <p className="card-meta">{formatDate(post.publicationDate)}</p>
                <h2>{post.title}</h2>
                <p>{post.content}</p>
                <Link to={`/blogposts/${post.id}`}>Lees blogpost</Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage>Er zijn nog geen blogposts.</EmptyMessage>
        )}
      </ResourceState>
    </section>
  )
}

export function BlogDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error } = useApiResource(`/blogposts/${encodeURIComponent(id)}`)

  return (
    <section>
      <ResourceState isLoading={isLoading} error={error}>
        {data && (
          <>
            <p className="card-meta">{formatDate(data.publicationDate)}</p>
            <h1>{data.title}</h1>
            <p className="long-content">{data.content}</p>
          </>
        )}
      </ResourceState>
      <Link to="/blogposts">Terug naar blog</Link>
    </section>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (loginError) {
      setError(loginError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <h1>Inloggen</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-username">Gebruikersnaam</label>
        <input
          id="login-username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label htmlFor="login-password">Wachtwoord</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Inloggen...' : 'Inloggen'}
        </button>
      </form>
      <p>Nog geen account? <Link to="/register">Registreren</Link></p>
    </section>
  )
}

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      await registerAccount(username, password)
      setSuccess('Je account is aangemaakt als Gast.')
      setUsername('')
      setPassword('')
    } catch (registrationError) {
      setError(registrationError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <h1>Registreren</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-username">Gebruikersnaam</label>
        <input
          id="register-username"
          name="username"
          autoComplete="username"
          minLength={3}
          maxLength={100}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label htmlFor="register-password">Wachtwoord</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={200}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <ErrorMessage>{error.details ? JSON.stringify(error.details) : error.message}</ErrorMessage>}
        {success && <p role="status">{success}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registreren...' : 'Registreren'}
        </button>
        {success && <Link to="/login" className="button-link">Naar inloggen</Link>}
      </form>
    </section>
  )
}

export function NotFoundPage() {
  return (
    <section>
      <h1>Pagina niet gevonden</h1>
      <p>De gevraagde pagina bestaat niet.</p>
      <Link to="/">Terug naar de homepagina</Link>
    </section>
  )
}
