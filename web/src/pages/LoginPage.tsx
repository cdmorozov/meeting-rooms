import { motion, useReducedMotion, type Variants } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PasswordInput } from '../components/PasswordInput'
import { useAuthRequest } from '../hooks/useAuthRequest'

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-brand-accent focus:bg-white'

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' } }),
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { errors, submitting, submit } = useAuthRequest('/api/auth/login')
  const reduced = useReducedMotion()

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit({ email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div>
          <p className="text-xs font-semibold tracking-wide text-brand-accent uppercase">Переговорні</p>
          <h1 className="mt-1 text-2xl font-bold text-brand-primary">Вхід</h1>
        </div>

        {errors.general && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.general}</p>}

        <motion.label
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
          className="flex flex-col gap-1.5 text-sm font-medium text-gray-700"
        >
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className={INPUT_CLASS}
          />
          {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
        </motion.label>

        <motion.label
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
          className="flex flex-col gap-1.5 text-sm font-medium text-gray-700"
        >
          Пароль
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" className={INPUT_CLASS} />
          {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
        </motion.label>

        <motion.button
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
          whileTap={reduced ? undefined : { scale: 0.97 }}
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
        >
          Увійти
        </motion.button>

        <p className="text-center text-sm text-gray-500">
          Немає акаунта?{' '}
          <Link to="/register" className="font-medium text-brand-accent hover:underline">
            Зареєструватися
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
