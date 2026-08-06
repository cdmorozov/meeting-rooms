export interface Room {
  id: string
  name: string
  floor: number
  capacity: number
}

export interface Booking {
  id: string
  roomId: string
  title: string
  authorName: string
  dayIndex: number
  startSlot: number
  endSlot: number
}

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export const SLOT_COUNT = 20

export function slotLabel(slot: number): string {
  const hour = 9 + Math.floor(slot / 2)
  const minute = slot % 2 === 0 ? '00' : '30'
  return `${hour}:${minute}`
}

export const fakeRoom: Room = {
  id: 'room-1',
  name: 'Марс',
  floor: 3,
  capacity: 6,
}

export const fakeBookings: Booking[] = [
  {
    id: 'b1',
    roomId: 'room-1',
    title: 'Мітинг з клієнтом',
    authorName: 'Іван Петренко',
    dayIndex: 0,
    startSlot: 1,
    endSlot: 3,
  },
  {
    id: 'b2',
    roomId: 'room-1',
    title: 'Дейлі',
    authorName: 'Олена Ковальчук',
    dayIndex: 1,
    startSlot: 0,
    endSlot: 1,
  },
  {
    id: 'b3',
    roomId: 'room-1',
    title: 'Ретроспектива',
    authorName: 'Іван Петренко',
    dayIndex: 3,
    startSlot: 6,
    endSlot: 10,
  },
  {
    id: 'b4',
    roomId: 'room-1',
    title: 'Співбесіда',
    authorName: 'Марія Бондар',
    dayIndex: 4,
    startSlot: 4,
    endSlot: 5,
  },
]
