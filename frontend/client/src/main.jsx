import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import {
  BlogDetailPage,
  BlogPostFormPage,
  BlogPostsPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  ProjectDetailPage,
  ProjectFormPage,
  ProjectsPage,
  RegisterPage,
} from './pages.jsx'
import { AuthProvider } from './AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/new" element={<ProjectFormPage />} />
            <Route path="projects/:id/edit" element={<ProjectFormPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="blogposts" element={<BlogPostsPage />} />
            <Route path="blogposts/new" element={<BlogPostFormPage />} />
            <Route path="blogposts/:id/edit" element={<BlogPostFormPage />} />
            <Route path="blogposts/:id" element={<BlogDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
