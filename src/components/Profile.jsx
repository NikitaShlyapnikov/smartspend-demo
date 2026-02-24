import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { STRATEGIES } from '../utils/determineStrategy'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

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
  const [catalogData, setCatalogData] = useState(null)

  // Support both onboarding flow (userProfile) and login flow (currentUser)
  const getProfileData = () => {
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
  }

  const profileData = getProfileData()

  // currentUser for sets info (always fresh from localStorage)
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
  })()
  const userSetIds = currentUser?.sets || []

  useEffect(() => {
    if (userSetIds.length > 0) {
      fetch(CATALOG_URL)
        .then((r) => r.json())
        .then(setCatalogData)
        .catch(() => {})
    }
  }, [])

  if (!profileData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Профиль не найден</p>
      </div>
    )
  }

  const { name, monthlyIncome, monthlyHousing, monthlyOther, strategy } = profileData
  const freeFlow = monthlyIncome - monthlyHousing - monthlyOther

  const strategyObj = strategy && typeof strategy === 'object'
    ? strategy
    : strategy ? STRATEGIES[strategy] : null

  const smartSetsTotal = currentUser?.profile?.smartSetsTotal || 0

  const userSets = catalogData
    ? userSetIds.map((id) => catalogData.sets.find((s) => s.id === id)).filter(Boolean)
    : []

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
          {smartSetsTotal > 0 && (
            <WaterfallRow label="− Smart-наборы" value={smartSetsTotal} type="expense" />
          )}
          <WaterfallRow
            label="Свободный поток"
            value={freeFlow - smartSetsTotal}
            type="free"
            noBorder
          />
        </div>

        {/* Smart sets section */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: userSetIds.length > 0 ? '1rem' : 0,
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Мои Smart-наборы</h3>
            {smartSetsTotal > 0 && (
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                {smartSetsTotal.toLocaleString('ru-RU')} ₽/мес
              </span>
            )}
          </div>

          {userSetIds.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Нет добавленных наборов
            </p>
          ) : catalogData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {userSets.map((set) => (
                <div
                  key={set.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--surface-light)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>{set.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {set.monthlyBudget.toLocaleString('ru-RU')} ₽/мес
                  </span>
                </div>
              ))}
            </div>
          ) : userSetIds.length > 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {userSetIds.length} набор(а) выбрано
            </p>
          ) : null}

          <Link
            to="/catalog"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.6rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '0.85rem',
            }}
          >
            + Добавить из каталога
          </Link>
        </div>

        {/* CTA */}
        <Link
          to="/catalog"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '0.85rem',
            border: '1px solid var(--accent)',
            borderRadius: '8px',
            color: 'var(--accent)',
            textDecoration: 'none',
            fontSize: '0.95rem',
            marginBottom: '0.75rem',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#0f0f0f' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)' }}
        >
          Подобрать Smart-наборы →
        </Link>

        <button
          onClick={handleReset}
          style={{
            width: '100%',
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
