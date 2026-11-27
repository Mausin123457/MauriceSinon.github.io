export function LoadingMessage() {
  return <p role="status" aria-live="polite">Bezig met laden...</p>
}

export function EmptyMessage({ children = 'Geen resultaten gevonden.' }) {
  return <p role="status">{children}</p>
}

export function ErrorMessage({ children = 'Er is iets misgegaan.' }) {
  return <p role="alert" aria-live="assertive">{children}</p>
}
