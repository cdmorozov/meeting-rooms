import { useQuery } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { WeekGrid } from '../components/WeekGrid'
import { DAY_LABELS, type Booking } from '../lib/fakeSchedule'
import { fetchRooms } from './RoomsListPage'

const MOBILE_QUERY = '(max-width: 640px)'
const OFFICE_ZONE = 'Europe/Kyiv'

interface BookingDto {
  id: string
  title: string
  startAt: string
  endAt: string
  userId: string
  userName: string
}

async function fetchWeekBookings(roomId: string, weekStart: string): Promise<BookingDto[]> {
  const response = await fetch(`/api/rooms/${roomId}/bookings?weekStart=${weekStart}`, { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Не вдалося завантажити бронювання')
  }
  return response.json()
}

function toGridBooking(dto: BookingDto, roomId: string): Booking {
  const start = DateTime.fromISO(dto.startAt).setZone(OFFICE_ZONE)
  const end = DateTime.fromISO(dto.endAt).setZone(OFFICE_ZONE)
  return {
    id: dto.id,
    roomId,
    title: dto.title,
    authorName: dto.userName,
    dayIndex: start.weekday - 1,
    startSlot: (start.hour - 9) * 2 + (start.minute === 30 ? 1 : 0),
    endSlot: (end.hour - 9) * 2 + (end.minute === 30 ? 1 : 0),
  }
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const handleChange = () => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7
}

export function RoomSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const isMobile = useIsMobile()
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex)

  const weekStart = DateTime.now().setZone(OFFICE_ZONE).startOf('week').toFormat('yyyy-MM-dd')

  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })
  const bookingsQuery = useQuery({
    queryKey: ['rooms', id, 'bookings', weekStart],
    queryFn: () => fetchWeekBookings(id ?? '', weekStart),
    enabled: Boolean(id),
  })

  if (!id) {
    return null
  }

  if (roomsQuery.status === 'pending' || bookingsQuery.status === 'pending') {
    return <p className="p-4 text-gray-500">Завантаження...</p>
  }

  if (roomsQuery.status === 'error' || bookingsQuery.status === 'error') {
    return <p className="p-4 text-red-600">Не вдалося завантажити розклад</p>
  }

  const room = roomsQuery.data.find((candidate) => candidate.id === id)
  if (!room) {
    return <p className="p-4 text-red-600">Кімнату не знайдено</p>
  }

  const bookings = bookingsQuery.data.map((dto) => toGridBooking(dto, id))
  const days = isMobile ? [selectedDayIndex] : [0, 1, 2, 3, 4, 5, 6]

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">{room.name}</h1>

      {isMobile && (
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedDayIndex((day) => (day + 6) % 7)}
            className="px-3 py-1 text-lg"
          >
            ‹
          </button>
          <span className="font-medium">{DAY_LABELS[selectedDayIndex]}</span>
          <button
            type="button"
            onClick={() => setSelectedDayIndex((day) => (day + 1) % 7)}
            className="px-3 py-1 text-lg"
          >
            ›
          </button>
        </div>
      )}

      <WeekGrid days={days} bookings={bookings} />
    </div>
  )
}
