import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

async function getSession() {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error('De huidige sessie kon niet worden opgehaald.')
  }

  return response.json()
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCurrent = true

    getSession()
      .then((currentSession) => {
        if (isCurrent) {
          setSession(currentSession)
        }
      })
      .catch((sessionError) => {
        if (isCurrent) {
          setError(sessionError)
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

// The hook shares the context with AuthProvider by design.
// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth moet binnen AuthProvider worden gebruikt.')
  }

  return context
}
