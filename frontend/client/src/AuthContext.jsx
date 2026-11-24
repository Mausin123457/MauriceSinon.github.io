import { useEffect, useState } from 'react'
import { getAuthSession, login as loginRequest, logout as logoutRequest } from './api/authApi.js'
import { AuthContext } from './AuthContextValue.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCurrent = true

    getAuthSession()
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

  const refreshSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSession = await getAuthSession()
      setSession(currentSession)
      return currentSession
    } catch (sessionError) {
      setError(sessionError)
      throw sessionError
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username, password) => {
    await loginRequest(username, password)
    return refreshSession()
  }

  const logout = async () => {
    await logoutRequest()
    setSession(null)
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, error, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
