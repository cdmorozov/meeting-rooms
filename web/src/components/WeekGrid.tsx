import { DAY_LABELS, SLOT_COUNT, type Booking } from '../lib/fakeSchedule'

interface WeekGridProps {
  days: number[]
  bookings: Booking[]
  slotLabels: string[]
  todayDayIndex: number | null
  currentTime: { dayIndex: number; position: number } | null
  currentUserId: string | undefined
  onCancelBooking: (booking: Booking) => void
}

export function WeekGrid({ days, bookings, slotLabels, todayDayIndex, currentTime, currentUserId, onCancelBooking }: WeekGridProps) {
  const columns = `80px repeat(${days.length}, minmax(0, 1fr))`
  const rows = `40px repeat(${SLOT_COUNT}, 40px)`

  return (
    <div className="grid border-t border-l border-gray-200" style={{ gridTemplateColumns: columns, gridTemplateRows: rows }}>
      <div className="border-r border-b border-gray-200" />
      {days.map((dayIndex) => (
        <div
          key={dayIndex}
          className={`flex items-center justify-center border-r border-b border-gray-200 py-2 text-sm font-medium ${
            dayIndex === todayDayIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
        >
          {DAY_LABELS[dayIndex]}
        </div>
      ))}

      {Array.from({ length: SLOT_COUNT }, (_, slot) => (
        <div key={`label-${slot}`} className="flex items-start justify-end border-r border-b border-gray-200 pr-2 text-xs text-gray-400">
          {slot % 2 === 0 ? slotLabels[slot] : null}
        </div>
      ))}

      {days.map((dayIndex) =>
        Array.from({ length: SLOT_COUNT }, (_, slot) => (
          <div key={`cell-${dayIndex}-${slot}`} className="border-r border-b border-gray-200" style={{ gridColumn: days.indexOf(dayIndex) + 2, gridRow: slot + 2 }} />
        )),
      )}

      {bookings
        .filter((booking) => days.includes(booking.dayIndex))
        .map((booking) => {
          const isOwn = booking.userId === currentUserId
          return (
            <div
              key={booking.id}
              onClick={isOwn ? () => onCancelBooking(booking) : undefined}
              className={`m-0.5 overflow-hidden rounded border p-1 text-xs ${
                isOwn ? 'cursor-pointer border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200' : 'border-gray-300 bg-gray-100 text-gray-700'
              }`}
              style={{
                gridColumn: days.indexOf(booking.dayIndex) + 2,
                gridRow: `${booking.startSlot + 2} / ${booking.endSlot + 2}`,
              }}
            >
              <p className="font-medium">{booking.title}</p>
              <p className={isOwn ? 'text-blue-700' : 'text-gray-500'}>{booking.authorName}</p>
            </div>
          )
        })}

      {currentTime && days.includes(currentTime.dayIndex) && (
        <div
          className="relative"
          style={{ gridColumn: days.indexOf(currentTime.dayIndex) + 2, gridRow: '2 / -1' }}
        >
          <div
            className="absolute inset-x-0 border-t-2 border-red-500"
            style={{ top: `${(currentTime.position / SLOT_COUNT) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
