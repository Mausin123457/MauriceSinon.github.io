import { Link, useParams } from 'react-router-dom'

function RoutePlaceholder({ title, description }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
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
  return (
    <RoutePlaceholder
      title="Projecten"
      description="De projecten worden in de volgende fase uit de API geladen."
    />
  )
}

export function ProjectDetailPage() {
  const { id } = useParams()
  return (
    <RoutePlaceholder
      title={`Project ${id}`}
      description="Projectdetails worden in de volgende fase uit de API geladen."
    />
  )
}

export function BlogPostsPage() {
  return (
    <RoutePlaceholder
      title="Blog"
      description="De blogposts worden in de volgende fase uit de API geladen."
    />
  )
}

export function BlogDetailPage() {
  const { id } = useParams()
  return (
    <RoutePlaceholder
      title={`Blogpost ${id}`}
      description="Blogpostdetails worden in de volgende fase uit de API geladen."
    />
  )
}

export function LoginPage() {
  return (
    <RoutePlaceholder
      title="Inloggen"
      description="Het loginformulier wordt in een volgende fase toegevoegd."
    />
  )
}

export function RegisterPage() {
  return (
    <RoutePlaceholder
      title="Registreren"
      description="Het registratieformulier wordt in een volgende fase toegevoegd."
    />
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
