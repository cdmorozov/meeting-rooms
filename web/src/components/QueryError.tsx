interface QueryErrorProps {
  message: string
  onRetry: () => void
}

export function QueryError({ message, onRetry }: QueryErrorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-red-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
      >
        Спробувати ще раз
      </button>
    </div>
  )
}
