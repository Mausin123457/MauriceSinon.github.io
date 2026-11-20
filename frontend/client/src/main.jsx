import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { HomePage, NotFoundPage, PlaceholderPage } from './pages.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<PlaceholderPage title="Projecten" />} />
          <Route path="blogposts" element={<PlaceholderPage title="Blog" />} />
          <Route path="login" element={<PlaceholderPage title="Inloggen" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
