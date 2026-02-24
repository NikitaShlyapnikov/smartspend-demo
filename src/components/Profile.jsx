import { useNavigate } from 'react-router-dom'
import { STRATEGIES } from '../utils/determineStrategy'

function WaterfallRow({ label, value, type, noBorder }) {
  const valueColor =
    type === 'free' ? 'var(--accent)' : type === 'expense' ? '#e06060' : 'var(--text)'

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.85rem 1.25rem',
      borderBottom: noBorder ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{
        color: type === 'free' ? 'var(--text)' : 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: type === 'free' ? 600 : 400,
      }}>
        {label}
      </span>
      <span style={{ color: valueColor, fontWeight: type === 'free' ? 700 : 400, fontSize: '0.9rem' }}>
        {value.toLocaleString('ru-RU')} ₽
      </span>
    </div>
  )
}

function Profile() {
  const navigate = useNavigate()

  // Support both onboarding flow (userProfile) and login flow (currentUser)
  const profileData = (() => {
    try {
      const up = JSON.parse(localStorage.getItem('userProfile'))
      if (up?.onboardingCompleted) return up

      const cu = JSON.parse(localStorage.getItem('currentUser'))
      if (cu?.profile) {
        const stratId = cu.profile.strategy
        return {
          ...cu.profile,
          strategy: stratId ? STRATEGIES[stratId] : null,
          onboardingCompleted: true,
        }
      }
    } catch {}
    return null
  })()

  if (!profileData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Профиль не найден</p>
      </div>
    )
  }

  const { name, monthlyIncome, monthlyHousing, monthlyOther, strategy } = profileData
  const freeFlow = monthlyIncome - monthlyHousing - monthlyOther

  // Strategy can be an object (onboarding) or string id (login)
  const strategyObj = strategy && typeof strategy === 'object'
    ? strategy
    : strategy
    ? STRATEGIES[strategy]
    : null

  const handleReset = () => {
    localStorage.removeItem('userProfile')
    localStorage.removeItem('tempOnboarding')
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 1rem 2rem',
      minHeight: '100vh',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
          }}>
            Привет, {name}!
          </h1>

          {strategyObj && (
            <>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                borderRadius: '8px',
                padding: '0.45rem 0.9rem',
                marginBottom: '0.75rem',
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>
                  {strategyObj.name}
                </span>
              </div>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                maxWidth: '320px',
                margin: '0 auto',
              }}>
                {strategyObj.longDescription || strategyObj.description}
              </p>
            </>
          )}
        </div>

        {/* Waterfall */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}>
          <WaterfallRow label="Доход" value={monthlyIncome} type="income" />
          <WaterfallRow label="− Жильё" value={monthlyHousing} type="expense" />
          <WaterfallRow label="− Прочие расходы" value={monthlyOther} type="expense" />
          <WaterfallRow label="Свободный поток" value={freeFlow} type="free" noBorder />
        </div>

        {/* CTA */}
        <button
          className="btn-accent"
          style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
          onClick={() => alert('Далее → Каталог (в разработке)')}
        >
          Подобрать Smart-наборы →
        </button>

        <button
          onClick={handleReset}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            padding: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Сбросить данные
        </button>
      </div>
    </div>
  )
}

export default Profile
