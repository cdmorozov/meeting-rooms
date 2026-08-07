import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

interface CancelBookingDialogProps {
  bookingId: string
  bookingTitle: string
  onClose: () => void
  onCancelled: () => void
}

export function CancelBookingDialog({ bookingId, bookingTitle, onClose, onCancelled }: CancelBookingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  async function handleConfirm() {
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.errors?.general ?? 'Не вдалося скасувати бронювання')
        return
      }
      onCancelled()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} onClose={onClose} className="m-auto w-full max-w-sm rounded-2xl p-0 backdrop:bg-black/40">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col gap-4 p-6"
      >
        <h2 className="text-lg font-bold text-brand-primary">Скасувати бронювання?</h2>
        <p className="text-sm text-gray-500">«{bookingTitle}» буде скасовано. Цю дію не можна відмінити.</p>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Ні
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Так, скасувати
          </button>
        </div>
      </motion.div>
    </dialog>
  )
}
