import { DateTime } from 'luxon'
import { useEffect, useRef, useState } from 'react'

interface CreateBookingModalProps {
  roomId: string
  onClose: () => void
  onCreated: () => void
}

type FormErrors = Record<string, string>

export function CreateBookingModal({ roomId, onClose, onCreated }: CreateBookingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => DateTime.now().toISODate() ?? '')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setSubmitting(true)

    try {
      const startAt = DateTime.fromISO(`${date}T${startTime}`).toUTC().toISO()
      const endAt = DateTime.fromISO(`${date}T${endTime}`).toUTC().toISO()

      const response = await fetch(`/api/rooms/${roomId}/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startAt, endAt }),
      })
      const data = await response.json()

      if (!response.ok) {
        setErrors(data.errors ?? {})
        return
      }

      onCreated()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} className="w-full max-w-sm rounded-lg p-0 backdrop:bg-black/40">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
        <h2 className="text-lg font-semibold">Нове бронювання</h2>

        {errors.general && <p className="text-sm text-red-600">{errors.general}</p>}

        <label className="flex flex-col gap-1 text-sm">
          Назва
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="rounded border border-gray-300 px-2 py-1"
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Дата
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Початок
            <input
              type="time"
              step={1800}
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Кінець
            <input
              type="time"
              step={1800}
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} className="px-3 py-1 text-sm text-gray-600">
            Скасувати
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Забронювати
          </button>
        </div>
      </form>
    </dialog>
  )
}
