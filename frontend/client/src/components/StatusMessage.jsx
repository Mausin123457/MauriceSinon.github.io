export function LoadingMessage() {
  return <p role="status">Bezig met laden...</p>
}

export function EmptyMessage({ children = 'Geen resultaten gevonden.' }) {
  return <p>{children}</p>
}

export function ErrorMessage({ children = 'Er is iets misgegaan.' }) {
  return <p role="alert">{children}</p>
}
