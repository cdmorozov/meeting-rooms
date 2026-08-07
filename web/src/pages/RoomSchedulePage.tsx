import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CancelBookingDialog } from '../components/CancelBookingDialog'
import { CreateBookingModal } from '../components/CreateBookingModal'
import { WeekGrid } from '../components/WeekGrid'
import { DAY_LABELS, SLOT_COUNT, type Booking } from '../lib/fakeSchedule'
import { fetchRooms } from './HomePage'
import { fetchMe, meQueryKey } from './ProtectedRoute'

const MOBILE_QUERY = '(max-width: 640px)'
const OFFICE_ZONE = 'Europe/Kyiv'
const USER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

function buildSlotLabels(): string[] {
  const start = DateTime.now().setZone(OFFICE_ZONE).startOf('day').set({ hour: 9 })
  return Array.from({ length: SLOT_COUNT }, (_, slot) =>
    start.plus({ minutes: slot * 30 }).setZone(USER_ZONE).toFormat('HH:mm'),
  )
}

function officeOffsetDiffers(): boolean {
  return DateTime.now().setZone(OFFICE_ZONE).offset !== DateTime.now().setZone(USER_ZONE).offset
}

function currentSlotPosition(): number | null {
  const now = DateTime.now().setZone(OFFICE_ZONE)
  const minutesSinceOpen = (now.hour - 9) * 60 + now.minute
  if (minutesSinceOpen < 0 || minutesSinceOpen > SLOT_COUNT * 30) {
    return null
  }
  return minutesSinceOpen / 30
}

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
    userId: dto.userId,
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
  return DateTime.now().setZone(OFFICE_ZONE).weekday - 1
}

export function RoomSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex)
  const [weekOffset, setWeekOffset] = useState(0)
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)

  const weekStartDate = DateTime.now().setZone(OFFICE_ZONE).startOf('week').plus({ weeks: weekOffset })
  const weekStart = weekStartDate.toFormat('yyyy-MM-dd')
  const weekLabel = `${weekStartDate.setLocale('uk').toFormat('d MMMM')} – ${weekStartDate.plus({ days: 6 }).setLocale('uk').toFormat('d MMMM')}`

  const meQuery = useQuery({ queryKey: meQueryKey, queryFn: fetchMe })
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
  const slotLabels = buildSlotLabels()
  const todayDayIndex = weekOffset === 0 ? todayIndex() : null
  const currentPosition = weekOffset === 0 ? currentSlotPosition() : null
  const currentTime = todayDayIndex !== null && currentPosition !== null ? { dayIndex: todayDayIndex, position: currentPosition } : null

  return (
    <div className="p-4">
      <Link to="/" className="mb-2 inline-block text-sm text-gray-500 hover:text-brand-accent">
        ← Кімнати
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{room.name}</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
        >
          Забронювати
        </button>
      </div>

      {officeOffsetDiffers() && (
        <p className="mb-2 text-sm text-gray-500">
          Час показано у вашому поясі ({USER_ZONE}). Офіс працює за київським часом.
        </p>
      )}

      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setWeekOffset((offset) => offset - 1)} className="px-3 py-1 text-lg">
          ‹
        </button>
        <span className="font-medium">{weekLabel}</span>
        <button type="button" onClick={() => setWeekOffset((offset) => offset + 1)} className="px-3 py-1 text-lg">
          ›
        </button>
      </div>

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

      <WeekGrid
        days={days}
        bookings={bookings}
        slotLabels={slotLabels}
        todayDayIndex={todayDayIndex}
        currentTime={currentTime}
        currentUserId={meQuery.data?.id}
        onCancelBooking={setBookingToCancel}
      />

      {isCreateOpen && (
        <CreateBookingModal
          roomId={id}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['rooms', id, 'bookings'] })
            setCreateOpen(false)
          }}
        />
      )}

      {bookingToCancel && (
        <CancelBookingDialog
          bookingId={bookingToCancel.id}
          bookingTitle={bookingToCancel.title}
          onClose={() => setBookingToCancel(null)}
          onCancelled={() => {
            queryClient.invalidateQueries({ queryKey: ['rooms', id, 'bookings'] })
            setBookingToCancel(null)
          }}
        />
      )}
    </div>
  )
}
