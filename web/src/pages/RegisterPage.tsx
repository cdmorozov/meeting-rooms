import { useState } from 'react'
import { useAuthRequest } from '../hooks/useAuthRequest'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { errors, submitting, submit } = useAuthRequest('/api/auth/register')

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit({ name, email, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Реєстрація</h1>
      {errors.general && <p>{errors.general}</p>}
      <label>
        Ім'я
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        {errors.name && <p>{errors.name}</p>}
      </label>
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
        Зареєструватися
      </button>
    </form>
  )
}
