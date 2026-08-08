import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SERVER_UNAVAILABLE } from '../lib/messages'
import { meQueryKey } from './ProtectedRoute'

const MISSING_TOKEN = 'Посилання недійсне'

async function verifyEmail(token: string): Promise<void> {
  let response: Response
  try {
    response = await fetch('/api/auth/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch {
    throw new Error(SERVER_UNAVAILABLE)
  }

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.errors?.general ?? data.errors?.token ?? MISSING_TOKEN)
  }
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const token = searchParams.get('token') ?? ''

  const verification = useMutation({
    mutationFn: () => verifyEmail(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meQueryKey }),
  })

  const { mutate } = verification
  useEffect(() => {
    if (token) {
      mutate()
    }
  }, [token, mutate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <h1 className="mb-3 text-xl font-bold text-brand-primary">Підтвердження email</h1>

        {!token && <p className="text-red-600">{MISSING_TOKEN}</p>}
        {token && verification.isPending && <p className="text-gray-500">Перевіряємо посилання...</p>}
        {verification.isError && <p className="text-red-600">{verification.error.message}</p>}
        {verification.isSuccess && <p className="text-gray-700">Email підтверджено. Тепер можна бронювати.</p>}

        <Link
          to="/"
          className="mt-5 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          До кімнат
        </Link>
      </div>
    </div>
  )
}
