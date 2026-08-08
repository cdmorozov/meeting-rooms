import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { SERVER_UNAVAILABLE } from '../lib/messages'
import { meQueryKey } from '../pages/ProtectedRoute'

type AuthErrors = Record<string, string>

export function useAuthRequest(url: string) {
  const [errors, setErrors] = useState<AuthErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function submit(body: Record<string, string>) {
    setErrors({})
    setSubmitting(true)
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) {
        setErrors(data.errors ?? {})
        return
      }
      queryClient.setQueryData(meQueryKey, data.user)
      navigate('/')
    } catch {
      setErrors({ general: SERVER_UNAVAILABLE })
    } finally {
      setSubmitting(false)
    }
  }

  return { errors, submitting, submit }
}
