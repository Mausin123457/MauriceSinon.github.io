import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorMessage, EmptyMessage, LoadingMessage } from './components/StatusMessage.jsx'
import { useApiResource } from './hooks/useApiResource.js'
import { useAuth } from './useAuth.js'
import { registerAccount } from './api/authApi.js'
import {
  createProject,
  deleteProject,
  getProject,
  updateProject,
} from './api/projectApi.js'
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPost,
  updateBlogPost,
} from './api/blogPostApi.js'

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

function canManage(session) {
  return session?.roles?.some((role) => role === 'Editor' || role === 'Admin')
}

function getValidationDetails(error) {
  if (!error?.details) return null
  if (Array.isArray(error.details)) return error.details.join(' ')
  if (typeof error.details === 'object') {
    return Object.values(error.details).flat().join(' ')
  }
  return String(error.details)
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
  const { data, isLoading, error, reload } = useApiResource('/projects/')
  const { session } = useAuth()
  const [actionMessage, setActionMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  const handleDelete = async (project) => {
    if (!window.confirm(`Weet je zeker dat je het project "${project.title}" wilt verwijderen?`)) {
      return
    }

    setActionMessage(null)
    setActionError(null)
    try {
      await deleteProject(project.id)
      setActionMessage(`Project "${project.title}" is verwijderd.`)
      reload()
    } catch (deleteError) {
      setActionError(deleteError)
    }
  }

  return (
    <section>
      <h1>Projecten</h1>
      {canManage(session) && <Link to="/projects/new" className="button-link">Nieuw project</Link>}
      {actionMessage && <p role="status">{actionMessage}</p>}
      {actionError && <ErrorMessage>{actionError.message}</ErrorMessage>}
      <ResourceState isLoading={isLoading} error={error}>
        {data?.length ? (
          <div className="card-grid">
            {data.map((project) => (
              <article className="card" key={project.id}>
                <p className="card-meta">{project.category} · {formatDate(project.date)}</p>
                <h2>{project.title}</h2>
                <p>{project.description}</p>
                <Link to={`/projects/${project.id}`}>Bekijk project</Link>
                {canManage(session) && (
                  <div className="card-actions">
                    <Link to={`/projects/${project.id}/edit`}>Wijzigen</Link>
                    <button type="button" onClick={() => handleDelete(project)}>Verwijderen</button>
                  </div>
                )}
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
  const { session } = useAuth()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState(null)

  const handleDelete = async () => {
    if (!window.confirm(`Weet je zeker dat je "${data.title}" wilt verwijderen?`)) return
    setActionError(null)
    try {
      await deleteProject(id)
      navigate('/projects')
    } catch (deleteError) {
      setActionError(deleteError)
    }
  }

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
      {actionError && <ErrorMessage>{actionError.message}</ErrorMessage>}
      {data && canManage(session) && (
        <div className="card-actions">
          <Link to={`/projects/${id}/edit`}>Wijzigen</Link>
          <button type="button" onClick={handleDelete}>Verwijderen</button>
        </div>
      )}
      <Link to="/projects">Terug naar projecten</Link>
    </section>
  )
}

export function BlogPostsPage() {
  const { data, isLoading, error, reload } = useApiResource('/blogposts/')
  const { session } = useAuth()
  const [actionMessage, setActionMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  const handleDelete = async (post) => {
    if (!window.confirm(`Weet je zeker dat je "${post.title}" wilt verwijderen?`)) {
      return
    }

    setActionMessage(null)
    setActionError(null)
    try {
      await deleteBlogPost(post.id)
      setActionMessage(`Blogpost "${post.title}" is verwijderd.`)
      reload()
    } catch (deleteError) {
      setActionError(deleteError)
    }
  }

  return (
    <section>
      <h1>Blog</h1>
      {canManage(session) && <Link to="/blogposts/new" className="button-link">Nieuwe blogpost</Link>}
      {actionMessage && <p role="status">{actionMessage}</p>}
      {actionError && <ErrorMessage>{actionError.message}</ErrorMessage>}
      <ResourceState isLoading={isLoading} error={error}>
        {data?.length ? (
          <div className="card-grid">
            {data.map((post) => (
              <article className="card" key={post.id}>
                <p className="card-meta">{formatDate(post.publicationDate)}</p>
                <h2>{post.title}</h2>
                <p>{post.content}</p>
                <Link to={`/blogposts/${post.id}`}>Lees blogpost</Link>
                {canManage(session) && (
                  <div className="card-actions">
                    <Link to={`/blogposts/${post.id}/edit`}>Wijzigen</Link>
                    <button type="button" onClick={() => handleDelete(post)}>Verwijderen</button>
                  </div>
                )}
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
  const { session } = useAuth()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState(null)

  const handleDelete = async () => {
    if (!window.confirm(`Weet je zeker dat je "${data.title}" wilt verwijderen?`)) return
    setActionError(null)
    try {
      await deleteBlogPost(id)
      navigate('/blogposts')
    } catch (deleteError) {
      setActionError(deleteError)
    }
  }

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
      {actionError && <ErrorMessage>{actionError.message}</ErrorMessage>}
      {data && canManage(session) && (
        <div className="card-actions">
          <Link to={`/blogposts/${id}/edit`}>Wijzigen</Link>
          <button type="button" onClick={handleDelete}>Verwijderen</button>
        </div>
      )}
      <Link to="/blogposts">Terug naar blog</Link>
    </section>
  )
}

export function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, isLoading: sessionLoading } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    githubUrl: '',
    date: '',
  })
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!id) return
    let isCurrent = true

    getProject(id)
      .then((project) => {
        if (isCurrent) {
          setForm({
            title: project.title,
            description: project.description,
            category: project.category,
            githubUrl: project.githubUrl || '',
            date: project.date.substring(0, 10),
          })
        }
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [id])

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    const input = {
      title: form.title,
      description: form.description,
      category: form.category,
      githubUrl: form.githubUrl || null,
      date: `${form.date}T00:00:00Z`,
    }

    try {
      if (id) {
        await updateProject(id, input)
        setSuccess('Het project is gewijzigd.')
      } else {
        await createProject(input)
        setSuccess('Het project is aangemaakt.')
      }
    } catch (submitError) {
      setError(submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionLoading) return <LoadingMessage />
  if (!canManage(session)) {
    return <ErrorMessage>Alleen Editor en Admin mogen projecten beheren.</ErrorMessage>
  }
  if (isLoading) return <LoadingMessage />

  const validationMessage = getValidationDetails(error)

  return (
    <section className="auth-page">
      <h1>{id ? 'Project wijzigen' : 'Nieuw project'}</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="project-title">Titel</label>
        <input id="project-title" name="title" value={form.title} onChange={updateField} minLength={1} maxLength={200} required />

        <label htmlFor="project-description">Beschrijving</label>
        <textarea id="project-description" name="description" value={form.description} onChange={updateField} minLength={1} maxLength={2000} required />

        <label htmlFor="project-category">Categorie</label>
        <input id="project-category" name="category" value={form.category} onChange={updateField} minLength={1} maxLength={100} required />

        <label htmlFor="project-github">GitHub-link</label>
        <input id="project-github" name="githubUrl" type="url" value={form.githubUrl} onChange={updateField} maxLength={500} />

        <label htmlFor="project-date">Datum</label>
        <input id="project-date" name="date" type="date" value={form.date} onChange={updateField} required />

        {error && <ErrorMessage>{validationMessage || error.message}</ErrorMessage>}
        {success && <p role="status">{success}</p>}
        <div className="card-actions">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Opslaan...' : 'Opslaan'}</button>
          <button type="button" onClick={() => navigate('/projects')}>Naar projecten</button>
        </div>
      </form>
    </section>
  )
}

export function BlogPostFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, isLoading: sessionLoading } = useAuth()
  const [form, setForm] = useState({ title: '', content: '', publicationDate: '' })
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!id) return
    let isCurrent = true

    getBlogPost(id)
      .then((post) => {
        if (isCurrent) {
          setForm({
            title: post.title,
            content: post.content,
            publicationDate: post.publicationDate.substring(0, 10),
          })
        }
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [id])

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    const input = {
      title: form.title,
      content: form.content,
      publicationDate: `${form.publicationDate}T00:00:00Z`,
    }

    try {
      if (id) {
        await updateBlogPost(id, input)
        setSuccess('De blogpost is gewijzigd.')
      } else {
        await createBlogPost(input)
        setSuccess('De blogpost is aangemaakt.')
      }
    } catch (submitError) {
      setError(submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sessionLoading) return <LoadingMessage />
  if (!canManage(session)) {
    return <ErrorMessage>Alleen Editor en Admin mogen blogposts beheren.</ErrorMessage>
  }
  if (isLoading) return <LoadingMessage />

  const validationMessage = getValidationDetails(error)

  return (
    <section className="auth-page">
      <h1>{id ? 'Blogpost wijzigen' : 'Nieuwe blogpost'}</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="post-title">Titel</label>
        <input id="post-title" name="title" value={form.title} onChange={updateField} minLength={1} maxLength={200} required />

        <label htmlFor="post-content">Inhoud</label>
        <textarea id="post-content" name="content" value={form.content} onChange={updateField} minLength={1} maxLength={10000} required />

        <label htmlFor="post-date">Publicatiedatum</label>
        <input id="post-date" name="publicationDate" type="date" value={form.publicationDate} onChange={updateField} required />

        {error && <ErrorMessage>{validationMessage || error.message}</ErrorMessage>}
        {success && <p role="status">{success}</p>}
        <div className="card-actions">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Opslaan...' : 'Opslaan'}</button>
          <button type="button" onClick={() => navigate('/blogposts')}>Naar blogposts</button>
        </div>
      </form>
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
