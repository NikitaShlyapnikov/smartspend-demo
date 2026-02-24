import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const USERS_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/users.json'

const inputStyle = {
  width: '100%',
  background: 'var(--surface-light)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  color: 'var(--text)',
  fontSize: '1rem',
}

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(USERS_URL)
      if (!res.ok) throw new Error()
      const data = await res.json()

      const user = data.users.find(
        (u) =>
          u.username === username.toLowerCase().trim() &&
          u.password === password
      )

      if (!user) {
        setError('Неверный логин или пароль')
        setLoading(false)
        return
      }

      localStorage.setItem('currentUser', JSON.stringify(user))
      navigate('/feed')
    } catch {
      setError('Ошибка соединения, попробуйте позже')
      setLoading(false)
    }
  }

  const canSubmit = username.trim() && password.trim()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2rem',
          color: 'var(--accent)',
          marginBottom: '0.4rem',
          textAlign: 'center',
        }}>
          SmartSpend
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: '2rem',
          fontSize: '0.9rem',
        }}>
          Войдите в аккаунт
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              autoFocus
              type="text"
              placeholder="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{
              color: '#e06060',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="btn-accent"
            style={{
              width: '100%',
              padding: '0.85rem',
              opacity: canSubmit && !loading ? 1 : 0.4,
              cursor: canSubmit && !loading ? 'pointer' : 'default',
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}>
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Зарегистрироваться
          </Link>
        </p>

        <p style={{
          textAlign: 'center',
          marginTop: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          opacity: 0.6,
        }}>
          Демо: анна / demo123
        </p>
      </div>
    </div>
  )
}

export default Login
