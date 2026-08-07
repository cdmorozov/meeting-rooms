import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

export interface Room {
  id: string
  name: string
  floor: number
  capacity: number
}

export async function fetchRooms(): Promise<Room[]> {
  const response = await fetch('/api/rooms', { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Не вдалося завантажити кімнати')
  }
  return response.json()
}

export function RoomsListPage() {
  const { data: rooms, status } = useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })

  if (status === 'pending') {
    return <p className="p-4 text-gray-500">Завантаження...</p>
  }

  if (status === 'error') {
    return <p className="p-4 text-red-600">Не вдалося завантажити список кімнат</p>
  }

  if (rooms.length === 0) {
    return <p className="p-4 text-gray-500">Кімнат поки немає</p>
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">Переговорні</h1>
      <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
        {rooms.map((room) => (
          <li key={room.id}>
            <Link to={`/rooms/${room.id}`} className="flex items-center justify-between px-2 py-3 hover:bg-gray-50">
              <span className="font-medium">{room.name}</span>
              <span className="text-sm text-gray-500">
                {room.floor} поверх, {room.capacity} місць
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
