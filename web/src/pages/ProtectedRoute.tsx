import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

export interface User {
  id: string
  name: string
  email: string
}

export const meQueryKey = ['me']

export async function fetchMe(): Promise<User> {
  const response = await fetch('/api/auth/me', { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Not authenticated')
  }
  const data = await response.json()
  return data.user
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isError } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    retry: false,
  })

  if (isLoading) {
    return <div>Завантаження...</div>
  }

  if (isError) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
