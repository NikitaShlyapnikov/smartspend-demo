import { useNavigate, Link } from 'react-router-dom'

function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
        color: 'var(--accent)',
        marginBottom: '1rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      }}>
        SmartSpend
      </h1>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '1.1rem',
        marginBottom: '3rem',
        maxWidth: '360px',
        lineHeight: 1.5,
      }}>
        Узнайте, сколько вы можете накопить
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        width: '100%',
        maxWidth: '280px',
      }}>
        <button className="btn-accent" onClick={() => navigate('/onboarding')}>
          Начать бесплатно
        </button>
        <button className="btn-accent" onClick={() => navigate('/onboarding')}>
          Пройти тест · 2 минуты
        </button>
      </div>

      <p style={{ marginTop: '2.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Уже есть аккаунт?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Войти
        </Link>
      </p>
    </div>
  )
}

export default Landing
