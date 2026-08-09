import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const SEGMENTS = 4

const LABELS = ['', 'Закороткий', 'Прийнятний', 'Добрий', 'Надійний']
const BAR_COLORS = ['', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']
const TEXT_COLORS = ['', 'text-red-600', 'text-amber-600', 'text-lime-600', 'text-emerald-600']

function scoreFor(length: number): number {
  if (length === 0) return 0
  if (length < 8) return 1
  if (length < 12) return 2
  if (length < 16) return 3
  return 4
}

interface PasswordStrengthProps {
  value: string
  className?: string
}

export function PasswordStrength({ value, className = '' }: PasswordStrengthProps) {
  const reduced = useReducedMotion()

  if (value.length === 0) {
    return null
  }

  const score = scoreFor(value.length)
  const barTransition = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 500, damping: 30 }

  return (
    <div className={className}>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div key={i} className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className={`h-full origin-left rounded-full ${BAR_COLORS[score]}`}
              initial={false}
              animate={{ scaleX: i < score ? 1 : 0 }}
              transition={{ ...barTransition, delay: reduced || i >= score ? 0 : i * 0.03 }}
            />
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={score}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.15 }}
          className={`mt-1 text-xs font-medium ${TEXT_COLORS[score]}`}
        >
          {LABELS[score]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
