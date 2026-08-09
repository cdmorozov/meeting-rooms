import type { DateTime } from 'luxon'

export interface Booking {
  id: string
  roomId: string
  userId: string
  title: string
  authorName: string
  seriesId: string | null
  dayIndex: number
  startSlot: number
  endSlot: number
}

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export const SLOT_COUNT = 20

export const SLOT_MINUTES = 30

export const OFFICE_OPEN_HOUR = 9

export const OFFICE_ZONE = 'Europe/Kyiv'

export const USER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

export function offsetDiffersFromOffice(moment: DateTime): boolean {
  return moment.setZone(OFFICE_ZONE).offset !== moment.setZone(USER_ZONE).offset
}
