const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function getCsrfToken() {
  const csrfCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('maurice-csrf='))

  return csrfCookie
    ? decodeURIComponent(csrfCookie.substring('maurice-csrf='.length))
    : null
}

function getErrorMessage(status) {
  if (status === 401) return 'Je moet ingelogd zijn voor deze actie.'
  if (status === 403) return 'Je hebt onvoldoende rechten voor deze actie.'
  if (status === 404) return 'De gevraagde bron bestaat niet.'
  return 'De aanvraag kon niet worden verwerkt.'
}

export async function apiFetch(path, options = {}) {
  const method = options.method?.toUpperCase() || 'GET'
  const headers = new Headers(options.headers)
  const csrfToken = getCsrfToken()

  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers.set('X-CSRF-TOKEN', csrfToken)
  }

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new ApiError(0, 'De API is momenteel niet bereikbaar.')
  }

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const details = body?.errors || body?.detail || body
    throw new ApiError(
      response.status,
      body?.error || getErrorMessage(response.status),
      details,
    )
  }

  return body
}

export function getApiUrl() {
  return apiBaseUrl
}
