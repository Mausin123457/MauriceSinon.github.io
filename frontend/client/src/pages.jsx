export function HomePage() {
  return (
    <section>
      <h1>Welkom op mijn portfolio</h1>
      <p>Bekijk mijn projecten en blogposts.</p>
    </section>
  )
}

export function PlaceholderPage({ title }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>Deze pagina wordt in een volgende fase verder uitgewerkt.</p>
    </section>
  )
}

export function NotFoundPage() {
  return (
    <section>
      <h1>Pagina niet gevonden</h1>
      <p>De gevraagde pagina bestaat niet.</p>
    </section>
  )
}
