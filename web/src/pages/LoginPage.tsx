import { useState } from 'react'
import { useAuthRequest } from '../hooks/useAuthRequest'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { errors, submitting, submit } = useAuthRequest('/api/auth/login')

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit({ email, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Вхід</h1>
      {errors.general && <p>{errors.general}</p>}
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {errors.email && <p>{errors.email}</p>}
      </label>
      <label>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {errors.password && <p>{errors.password}</p>}
      </label>
      <button type="submit" disabled={submitting}>
        Увійти
      </button>
    </form>
  )
}
