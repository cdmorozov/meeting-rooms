import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { CancelBookingDialog } from '../components/CancelBookingDialog'
import { CreateBookingModal } from '../components/CreateBookingModal'
import { QueryError } from '../components/QueryError'
import { WeekGrid } from '../components/WeekGrid'
import {
  DAY_LABELS,
  OFFICE_OPEN_HOUR,
  OFFICE_ZONE,
  SLOT_COUNT,
  SLOT_MINUTES,
  USER_ZONE,
  offsetDiffersFromOffice,
  type Booking,
} from '../lib/schedule'
import { fetchRooms } from './HomePage'
import { fetchMe, meQueryKey } from './ProtectedRoute'

const MOBILE_QUERY = '(max-width: 640px)'

function toSlotIndex(officeTime: DateTime): number {
  const minutesSinceOpen = (officeTime.hour - OFFICE_OPEN_HOUR) * 60 + officeTime.minute
  return minutesSinceOpen / SLOT_MINUTES
}

function buildSlotLabels(weekStart: DateTime): string[] {
  const start = weekStart.set({ hour: OFFICE_OPEN_HOUR, minute: 0 })
  return Array.from({ length: SLOT_COUNT }, (_, slot) =>
    start.plus({ minutes: slot * SLOT_MINUTES }).setZone(USER_ZONE).toFormat('HH:mm'),
  )
}

function currentSlotPosition(): number | null {
  const position = toSlotIndex(DateTime.now().setZone(OFFICE_ZONE))
  if (position < 0 || position > SLOT_COUNT) {
    return null
  }
  return position
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
    startSlot: toSlotIndex(start),
    endSlot: toSlotIndex(end),
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

function weekOffsetFromParam(week: string | null): number {
  if (!week) {
    return 0
  }
  const target = DateTime.fromISO(week, { zone: OFFICE_ZONE }).startOf('week')
  if (!target.isValid) {
    return 0
  }
  const thisWeek = DateTime.now().setZone(OFFICE_ZONE).startOf('week')
  return Math.round(target.diff(thisWeek, 'weeks').weeks)
}

export function RoomSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex)
  const [weekOffset, setWeekOffset] = useState(() => weekOffsetFromParam(searchParams.get('week')))
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
    return (
      <div className="p-4">
        <QueryError
          message="Не вдалося завантажити розклад"
          onRetry={() => {
            roomsQuery.refetch()
            bookingsQuery.refetch()
          }}
        />
      </div>
    )
  }

  const room = roomsQuery.data.find((candidate) => candidate.id === id)
  if (!room) {
    return <p className="p-4 text-red-600">Кімнату не знайдено</p>
  }

  const bookings = bookingsQuery.data.map((dto) => toGridBooking(dto, id))
  const days = isMobile ? [selectedDayIndex] : [0, 1, 2, 3, 4, 5, 6]
  const slotLabels = buildSlotLabels(weekStartDate)
  const todayDayIndex = weekOffset === 0 ? todayIndex() : null
  const currentPosition = weekOffset === 0 ? currentSlotPosition() : null
  const currentTime = todayDayIndex !== null && currentPosition !== null ? { dayIndex: todayDayIndex, position: currentPosition } : null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Link
        to="/"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-brand-accent"
      >
        ← Кімнати
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-primary">{room.name}</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Забронювати
        </button>
      </div>

      {offsetDiffersFromOffice(weekStartDate) && (
        <p className="mb-3 inline-block rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-brand-accent">
          Час показано у вашому поясі ({USER_ZONE}). Офіс працює за київським часом.
        </p>
      )}

      <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-1.5">
        <button
          type="button"
          onClick={() => setWeekOffset((offset) => offset - 1)}
          className="rounded-md px-3 py-1 text-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-accent"
        >
          ‹
        </button>
        <span className="font-semibold text-gray-900">{weekLabel}</span>
        <button
          type="button"
          onClick={() => setWeekOffset((offset) => offset + 1)}
          className="rounded-md px-3 py-1 text-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-accent"
        >
          ›
        </button>
      </div>

      {isMobile && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-1.5">
          <button
            type="button"
            onClick={() => setSelectedDayIndex((day) => (day + 6) % 7)}
            className="rounded-md px-3 py-1 text-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-accent"
          >
            ‹
          </button>
          <span className="font-semibold text-gray-900">{DAY_LABELS[selectedDayIndex]}</span>
          <button
            type="button"
            onClick={() => setSelectedDayIndex((day) => (day + 1) % 7)}
            className="rounded-md px-3 py-1 text-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-accent"
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
