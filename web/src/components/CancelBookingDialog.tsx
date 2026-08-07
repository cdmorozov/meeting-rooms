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
    <dialog ref={dialogRef} onClose={onClose} className="w-full max-w-sm rounded-lg p-0 backdrop:bg-black/40">
      <div className="flex flex-col gap-3 p-4">
        <h2 className="text-lg font-semibold">Скасувати бронювання?</h2>
        <p className="text-sm text-gray-600">«{bookingTitle}» буде скасовано. Цю дію не можна відмінити.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} className="px-3 py-1 text-sm text-gray-600">
            Ні
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Так, скасувати
          </button>
        </div>
      </div>
    </dialog>
  )
}
