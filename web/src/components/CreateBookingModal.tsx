import { DateTime } from 'luxon'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { USER_ZONE, offsetDiffersFromOffice } from '../lib/schedule'

interface CreateBookingModalProps {
  roomId: string
  onClose: () => void
  onCreated: () => void
}

type FormErrors = Record<string, string>

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-brand-accent focus:bg-white'

export function CreateBookingModal({ roomId, onClose, onCreated }: CreateBookingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => DateTime.now().toISODate() ?? '')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const reduced = useReducedMotion()

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
    <dialog ref={dialogRef} onClose={onClose} className="m-auto w-full max-w-sm rounded-2xl p-0 backdrop:bg-black/40">
      <motion.form
        onSubmit={handleSubmit}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col gap-4 p-6"
      >
        <h2 className="text-lg font-bold text-brand-primary">Нове бронювання</h2>

        {errors.general && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.general}</p>}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Назва
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required className={INPUT_CLASS} />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Дата
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className={INPUT_CLASS} />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-gray-700">
            Початок
            <input
              type="time"
              step={1800}
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-gray-700">
            Кінець
            <input
              type="time"
              step={1800}
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
              className={INPUT_CLASS}
            />
          </label>
        </div>

        {offsetDiffersFromOffice(DateTime.fromISO(date)) && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-brand-accent">
            Час вводиться у вашому поясі ({USER_ZONE}). Офіс приймає бронювання з 09:00 до 19:00 за київським часом.
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Забронювати
          </button>
        </div>
      </motion.form>
    </dialog>
  )
}
