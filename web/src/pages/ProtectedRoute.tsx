import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { QueryError } from '../components/QueryError'
import { SERVER_UNAVAILABLE } from '../lib/messages'

export interface User {
  id: string
  name: string
  email: string
}

export const meQueryKey = ['me']

export class UnauthenticatedError extends Error {}

export async function fetchMe(): Promise<User> {
  const response = await fetch('/api/auth/me', { credentials: 'include' })
  if (response.status === 401) {
    throw new UnauthenticatedError()
  }
  if (!response.ok) {
    throw new Error(SERVER_UNAVAILABLE)
  }
  const data = await response.json()
  return data.user
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isPending, error, refetch } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    retry: false,
  })

  if (isPending) {
    return <p className="p-6 text-gray-500">Завантаження...</p>
  }

  if (error instanceof UnauthenticatedError) {
    return <Navigate to="/login" replace />
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <QueryError message={SERVER_UNAVAILABLE} onRetry={() => refetch()} />
      </div>
    )
  }

  return <>{children}</>
}
