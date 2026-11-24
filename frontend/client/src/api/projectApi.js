import { apiFetch } from './client.js'

export function getProjects() {
  return apiFetch('/projects/')
}

export function getProject(id) {
  return apiFetch(`/projects/${encodeURIComponent(id)}`)
}

export function createProject(project) {
  return apiFetch('/projects/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  })
}

export function updateProject(id, project) {
  return apiFetch(`/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  })
}

export function deleteProject(id) {
  return apiFetch(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
