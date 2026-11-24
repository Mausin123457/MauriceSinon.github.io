import { apiFetch } from './client.js'

export function getBlogPosts() {
  return apiFetch('/blogposts/')
}

export function getBlogPost(id) {
  return apiFetch(`/blogposts/${encodeURIComponent(id)}`)
}

export function createBlogPost(post) {
  return apiFetch('/blogposts/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  })
}

export function updateBlogPost(id, post) {
  return apiFetch(`/blogposts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  })
}

export function deleteBlogPost(id) {
  return apiFetch(`/blogposts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
