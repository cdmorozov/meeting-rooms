import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { CancelBookingDialog } from '../components/CancelBookingDialog'
import { QueryError } from '../components/QueryError'
import { OFFICE_ZONE, USER_ZONE, offsetDiffersFromOffice } from '../lib/schedule'

interface MyBooking {
  id: string
  title: string
  startAt: string
  endAt: string
  roomId: string
  roomName: string
  seriesId: string | null
}

interface MyBookingsResponse {
  items: MyBooking[]
  nextCursor: string | null
}

async function fetchMyBookings(scope: 'upcoming' | 'past', cursor: string | null): Promise<MyBookingsResponse> {
  const query = new URLSearchParams({ scope })
  if (cursor) {
    query.set('cursor', cursor)
  }
  const response = await fetch(`/api/bookings/my?${query.toString()}`, { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Не вдалося завантажити бронювання')
  }
  return response.json()
}

function scheduleLink(booking: MyBooking): string {
  const start = DateTime.fromISO(booking.startAt).setZone(OFFICE_ZONE)
  const week = start.startOf('week').toFormat('yyyy-MM-dd')
  return `/rooms/${booking.roomId}?week=${week}&day=${start.weekday - 1}`
}

function formatDate(iso: string): string {
  return DateTime.fromISO(iso).setZone(USER_ZONE).setLocale('uk').toFormat('d MMMM, cccc')
}

function formatTimeRange(startAt: string, endAt: string): string {
  const start = DateTime.fromISO(startAt).setZone(USER_ZONE)
  const end = DateTime.fromISO(endAt).setZone(USER_ZONE)
  return `${start.toFormat('HH:mm')} – ${end.toFormat('HH:mm')}`
}

interface BookingRowProps {
  booking: MyBooking
  onCancel?: (booking: MyBooking) => void
}

function BookingRow({ booking, onCancel }: BookingRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition-colors hover:border-brand-accent">
      <Link to={scheduleLink(booking)} className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-semibold text-gray-900">
          {booking.title}
          {booking.seriesId && (
            <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-brand-accent">
              щотижня
            </span>
          )}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">
          {formatDate(booking.startAt)}, {formatTimeRange(booking.startAt, booking.endAt)} · {booking.roomName}
        </p>
      </Link>
      {onCancel && (
        <button
          type="button"
          onClick={() => onCancel(booking)}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Скасувати
        </button>
      )}
    </li>
  )
}

interface BookingsSectionProps {
  title: string
  status: 'pending' | 'error' | 'success'
  isEmpty: boolean
  emptyText: string
  onRetry: () => void
  children: ReactNode
}

function BookingsSection({ title, status, isEmpty, emptyText, onRetry, children }: BookingsSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>

      {status === 'pending' && <p className="text-gray-500">Завантаження...</p>}

      {status === 'error' && <QueryError message="Не вдалося завантажити бронювання" onRetry={onRetry} />}

      {status === 'success' && (isEmpty ? <p className="text-gray-500">{emptyText}</p> : children)}
    </section>
  )
}

export function MyBookingsPage() {
  const queryClient = useQueryClient()
  const [bookingToCancel, setBookingToCancel] = useState<MyBooking | null>(null)

  const upcomingQuery = useQuery({
    queryKey: ['my-bookings', 'upcoming'],
    queryFn: () => fetchMyBookings('upcoming', null),
  })

  const pastQuery = useInfiniteQuery({
    queryKey: ['my-bookings', 'past'],
    queryFn: ({ pageParam }: { pageParam: string | null }) => fetchMyBookings('past', pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage: MyBookingsResponse) => lastPage.nextCursor,
  })

  const upcomingBookings = upcomingQuery.data?.items ?? []
  const pastBookings = pastQuery.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-brand-primary">Мої бронювання</h1>
          <Link to="/" className="text-sm font-medium text-gray-500 transition-colors hover:text-brand-accent">
            Кімнати
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {offsetDiffersFromOffice(DateTime.now()) && (
          <p className="mb-4 inline-block rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-brand-accent">
            Час показано у вашому поясі ({USER_ZONE}). Офіс працює за київським часом.
          </p>
        )}

        <BookingsSection
          title="Майбутні"
          status={upcomingQuery.status}
          isEmpty={upcomingBookings.length === 0}
          emptyText="Майбутніх бронювань немає"
          onRetry={() => upcomingQuery.refetch()}
        >
          <ul className="grid gap-2">
            {upcomingBookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} onCancel={setBookingToCancel} />
            ))}
          </ul>
        </BookingsSection>

        <div className="mt-10">
          <BookingsSection
            title="Минулі"
            status={pastQuery.status}
            isEmpty={pastBookings.length === 0}
            emptyText="Минулих бронювань немає"
            onRetry={() => pastQuery.refetch()}
          >
            <ul className="grid gap-2">
              {pastBookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </ul>
            {pastQuery.hasNextPage && (
              <button
                type="button"
                onClick={() => pastQuery.fetchNextPage()}
                disabled={pastQuery.isFetchingNextPage}
                className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {pastQuery.isFetchingNextPage ? 'Завантаження...' : 'Показати ще'}
              </button>
            )}
          </BookingsSection>
        </div>
      </main>

      {bookingToCancel && (
        <CancelBookingDialog
          bookingId={bookingToCancel.id}
          bookingTitle={bookingToCancel.title}
          isSeries={bookingToCancel.seriesId !== null}
          onClose={() => setBookingToCancel(null)}
          onCancelled={() => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
            setBookingToCancel(null)
          }}
        />
      )}
    </div>
  )
}
