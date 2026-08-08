import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { QueryError } from '../components/QueryError'
import { fetchMe, meQueryKey } from './ProtectedRoute'

export interface Room {
  id: string
  name: string
  floor: number
  capacity: number
}

export async function fetchRooms(): Promise<Room[]> {
  const response = await fetch('/api/rooms', { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Не вдалося завантажити кімнати')
  }
  return response.json()
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25, ease: 'easeOut' } }),
}

export function HomePage() {
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const reduced = useReducedMotion()

  const [minCapacity, setMinCapacity] = useState(0)

  const meQuery = useQuery({ queryKey: meQueryKey, queryFn: fetchMe })
  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })

  const rooms = roomsQuery.data ?? []
  const capacityOptions = [...new Set(rooms.map((room) => room.capacity))].sort((a, b) => a - b)
  const visibleRooms = rooms.filter((room) => room.capacity >= minCapacity)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      queryClient.removeQueries({ queryKey: meQueryKey })
      navigate('/login')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-accent uppercase">Переговорні</p>
            {meQuery.data && <p className="mt-0.5 text-sm text-gray-500">Вітаємо, {meQuery.data.name}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/my"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Мої бронювання
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Вийти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-brand-primary">Кімнати</h1>

        {roomsQuery.status === 'pending' && <p className="text-gray-500">Завантаження...</p>}
        {roomsQuery.status === 'error' && (
          <QueryError message="Не вдалося завантажити список кімнат" onRetry={() => roomsQuery.refetch()} />
        )}
        {roomsQuery.status === 'success' && rooms.length === 0 && <p className="text-gray-500">Кімнат поки немає</p>}

        {roomsQuery.status === 'success' && rooms.length > 0 && (
          <>
            <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              Місткість
              <select
                value={minCapacity}
                onChange={(event) => setMinCapacity(Number(event.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900"
              >
                <option value={0}>будь-яка</option>
                {capacityOptions.map((capacity) => (
                  <option key={capacity} value={capacity}>
                    від {capacity} місць
                  </option>
                ))}
              </select>
            </label>

            {visibleRooms.length === 0 && <p className="text-gray-500">Немає кімнат такої місткості</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              {visibleRooms.map((room, i) => (
              <motion.div
                key={room.id}
                custom={i}
                initial={reduced ? false : 'hidden'}
                animate="visible"
                variants={cardVariants}
              >
                <Link
                  to={`/rooms/${room.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition-colors hover:border-brand-accent hover:bg-blue-50/40"
                >
                  <span className="font-semibold text-gray-900">{room.name}</span>
                  <span className="text-sm text-gray-500">
                    {room.floor} поверх, {room.capacity} місць
                  </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
