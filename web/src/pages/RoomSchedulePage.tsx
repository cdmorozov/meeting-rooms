import { useEffect, useState } from 'react'
import { WeekGrid } from '../components/WeekGrid'
import { DAY_LABELS, fakeBookings, fakeRoom } from '../lib/fakeSchedule'

const MOBILE_QUERY = '(max-width: 640px)'

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
  const isMobile = useIsMobile()
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex)

  const days = isMobile ? [selectedDayIndex] : [0, 1, 2, 3, 4, 5, 6]

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">{fakeRoom.name}</h1>

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

      <WeekGrid days={days} bookings={fakeBookings} />
    </div>
  )
}
