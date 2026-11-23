import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'

export function useApiResource(path) {
  const [resource, setResource] = useState({
    data: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    let isCurrent = true

    // Reset the previous request state whenever the resource path changes.
    // oxlint-disable-next-line react/set-state-in-effect
    setResource({ data: null, isLoading: true, error: null })

    apiFetch(path, { signal: controller.signal })
      .then((data) => {
        if (isCurrent) {
          setResource({ data, isLoading: false, error: null })
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError' || !isCurrent) {
          return
        }

        setResource({ data: null, isLoading: false, error })
      })

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [path])

  return resource
}
