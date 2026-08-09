import { motion, useReducedMotion } from 'motion/react'
import { SLOT_COUNT, type Booking } from '../lib/schedule'

const FIRST_DAY_COLUMN = 2
const FIRST_SLOT_ROW = 2

interface WeekGridProps {
  days: number[]
  dayLabels: string[]
  bookings: Booking[]
  slotLabels: string[]
  todayDayIndex: number | null
  currentTime: { dayIndex: number; position: number } | null
  currentUserId: string | undefined
  onCancelBooking: (booking: Booking) => void
}

export function WeekGrid({ days, dayLabels, bookings, slotLabels, todayDayIndex, currentTime, currentUserId, onCancelBooking }: WeekGridProps) {
  const reduced = useReducedMotion()
  const columns = `80px repeat(${days.length}, minmax(0, 1fr))`
  const rows = `auto repeat(${SLOT_COUNT}, 40px)`

  function gridColumnFor(dayIndex: number): number {
    return days.indexOf(dayIndex) + FIRST_DAY_COLUMN
  }

  function gridRowFor(slot: number): number {
    return slot + FIRST_SLOT_ROW
  }

  return (
    <div
      className="grid overflow-hidden rounded-xl border-t border-l border-gray-200 bg-white"
      style={{ gridTemplateColumns: columns, gridTemplateRows: rows }}
    >
      <div className="border-r border-b border-gray-100" />
      {days.map((dayIndex) => (
        <div
          key={dayIndex}
          className={`flex items-center justify-center border-r border-b border-gray-100 py-2 text-center text-sm font-semibold leading-tight ${
            dayIndex === todayDayIndex ? 'bg-blue-50 text-brand-accent' : 'text-gray-700'
          }`}
        >
          {dayLabels[dayIndex]}
        </div>
      ))}

      {Array.from({ length: SLOT_COUNT }, (_, slot) => (
        <div key={`label-${slot}`} className="flex items-start justify-end border-r border-b border-gray-100 pr-2 text-xs text-gray-400">
          {slot % 2 === 0 ? slotLabels[slot] : null}
        </div>
      ))}

      {days.map((dayIndex) =>
        Array.from({ length: SLOT_COUNT }, (_, slot) => (
          <div
            key={`cell-${dayIndex}-${slot}`}
            className={`border-r border-b border-gray-100 ${dayIndex === todayDayIndex ? 'bg-blue-50/30' : ''}`}
            style={{ gridColumn: gridColumnFor(dayIndex), gridRow: gridRowFor(slot) }}
          />
        )),
      )}

      {bookings
        .filter((booking) => days.includes(booking.dayIndex))
        .map((booking) => {
          const isOwn = booking.userId === currentUserId
          return (
            <motion.div
              key={booking.id}
              onClick={isOwn ? () => onCancelBooking(booking) : undefined}
              initial={reduced ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`m-0.5 overflow-hidden rounded-lg border p-1.5 text-xs transition-colors ${
                isOwn
                  ? 'cursor-pointer border-brand-accent/30 bg-brand-accent/10 text-brand-primary hover:border-brand-accent/50 hover:bg-brand-accent/15'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
              style={{
                gridColumn: gridColumnFor(booking.dayIndex),
                gridRow: `${gridRowFor(booking.startSlot)} / ${gridRowFor(booking.endSlot)}`,
              }}
            >
              <p className="font-semibold">{booking.title}</p>
              <p className={isOwn ? 'text-brand-accent' : 'text-gray-400'}>{booking.authorName}</p>
            </motion.div>
          )
        })}

      {currentTime && days.includes(currentTime.dayIndex) && (
        <div className="relative" style={{ gridColumn: gridColumnFor(currentTime.dayIndex), gridRow: '2 / -1' }}>
          <div
            className="absolute inset-x-0 flex items-center"
            style={{ top: `${(currentTime.position / SLOT_COUNT) * 100}%` }}
          >
            <div className="-ml-1 size-2 rounded-full bg-rose-500" />
            <div className="h-0.5 flex-1 bg-rose-500" />
          </div>
        </div>
      )}
    </div>
  )
}
