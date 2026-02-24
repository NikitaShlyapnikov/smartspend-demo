import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const inputStyle = {
  width: '100%',
  background: 'var(--surface-light)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  color: 'var(--text)',
  fontSize: '1rem',
}

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    const newUser = {
      id: 'user-' + Date.now(),
      username: username.toLowerCase().trim(),
      profile: {
        name: name.trim(),
        monthlyIncome: 0,
        monthlyHousing: 0,
        monthlyOther: 0,
        capitalAmount: 0,
        strategy: null,
      },
    }

    localStorage.setItem('currentUser', JSON.stringify(newUser))
    // Go through onboarding to fill profile and determine strategy
    navigate('/onboarding')
  }

  const canSubmit = name.trim() && username.trim() && password.trim()

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
          Создайте аккаунт
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              autoFocus
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
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

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-accent"
            style={{
              width: '100%',
              padding: '0.85rem',
              opacity: canSubmit ? 1 : 0.4,
              cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            Зарегистрироваться
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
