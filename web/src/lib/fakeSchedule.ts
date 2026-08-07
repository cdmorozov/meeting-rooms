export interface Booking {
  id: string
  roomId: string
  userId: string
  title: string
  authorName: string
  dayIndex: number
  startSlot: number
  endSlot: number
}

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export const SLOT_COUNT = 20
