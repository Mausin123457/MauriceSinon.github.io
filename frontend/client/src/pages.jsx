import { Link, useParams } from 'react-router-dom'
import { ErrorMessage, EmptyMessage, LoadingMessage } from './components/StatusMessage.jsx'
import { useApiResource } from './hooks/useApiResource.js'

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
  return <section><h1>Inloggen</h1><p>Het loginformulier wordt in een volgende fase toegevoegd.</p></section>
}

export function RegisterPage() {
  return <section><h1>Registreren</h1><p>Het registratieformulier wordt in een volgende fase toegevoegd.</p></section>
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
