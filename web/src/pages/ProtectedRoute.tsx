import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-600">{SERVER_UNAVAILABLE}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Спробувати ще
        </button>
      </div>
    )
  }

  return <>{children}</>
}
