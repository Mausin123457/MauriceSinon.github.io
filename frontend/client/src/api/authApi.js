import { apiFetch, ApiError } from './client.js'

export async function getAuthSession() {
  try {
    return await apiFetch('/auth/session')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export function registerAccount(username, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export function login(username, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' })
}
