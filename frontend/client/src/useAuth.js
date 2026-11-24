import { useContext } from 'react'
import { AuthContext } from './AuthContextValue.js'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth moet binnen AuthProvider worden gebruikt.')
  }

  return context
}
