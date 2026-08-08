import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { USER_ZONE } from '../lib/schedule'

const POLL_INTERVAL_MS = 30_000

interface EndingBooking {
  id: string
  title: string
  endAt: string
  roomName: string
}

async function fetchNotifications(): Promise<EndingBooking[]> {
  const response = await fetch('/api/bookings/notifications', { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Не вдалося отримати сповіщення')
  }
  return response.json()
}

export function BookingEndNotifier() {
  const [shown, setShown] = useState<EndingBooking[]>([])

  const notificationsQuery = useQuery({
    queryKey: ['booking-notifications'],
    queryFn: fetchNotifications,
    refetchInterval: POLL_INTERVAL_MS,
    retry: false,
  })

  const arrived = notificationsQuery.data
  useEffect(() => {
    if (arrived && arrived.length > 0) {
      setShown((current) => [...current, ...arrived])
    }
  }, [arrived])

  function dismiss(id: string) {
    setShown((current) => current.filter((booking) => booking.id !== id))
  }

  if (shown.length === 0) {
    return null
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2">
      {shown.map((booking) => (
        <div key={booking.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-lg">
          <p className="text-sm font-semibold text-amber-900">Бронювання скоро закінчиться</p>
          <p className="mt-1 text-sm text-amber-800">
            «{booking.title}» у кімнаті {booking.roomName} завершується о{' '}
            {DateTime.fromISO(booking.endAt).setZone(USER_ZONE).toFormat('HH:mm')}. Наступний слот уже зайнятий.
          </p>
          <button
            type="button"
            onClick={() => dismiss(booking.id)}
            className="mt-2 text-sm font-medium text-amber-900 underline"
          >
            Зрозуміло
          </button>
        </div>
      ))}
    </div>
  )
}
