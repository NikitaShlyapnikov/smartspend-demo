import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from './Navbar'
import { STRATEGIES } from '../utils/determineStrategy'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

function WaterfallRow({ label, value, type, noBorder }) {
  const valueColor =
    type === 'core' ? 'var(--accent)' : type === 'expense' ? '#e06060' : 'var(--text)'

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.85rem 1.25rem',
      borderBottom: noBorder ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{
        color: type === 'core' ? 'var(--text)' : 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: type === 'core' ? 600 : 400,
      }}>
        {label}
      </span>
      <span style={{ color: valueColor, fontWeight: type === 'core' ? 700 : 400, fontSize: '0.9rem' }}>
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

  const { name, monthlyIncome, monthlyHousing, monthlyOther, capitalAmount, strategy } = profileData
  const smartSetsTotal = currentUser?.profile?.smartSetsTotal || 0
  const investCore = monthlyIncome - monthlyHousing - monthlyOther - smartSetsTotal

  const strategyObj = strategy && typeof strategy === 'object'
    ? strategy
    : strategy ? STRATEGIES[strategy] : null

  const userSets = catalogData
    ? userSetIds.map((id) => catalogData.sets.find((s) => s.id === id)).filter(Boolean)
    : []

  const capital = Number(capitalAmount) || 0
  const emoMin = capital > 0 ? Math.floor(capital * 0.04 / 12) : 0
  const emoMax = capital > 0 ? Math.floor(capital * 0.10 / 12) : 0

  const handleReset = () => {
    localStorage.removeItem('userProfile')
    localStorage.removeItem('tempOnboarding')
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <Navbar />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

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
            marginBottom: '1.25rem',
          }}>
            <WaterfallRow label="Доход" value={monthlyIncome} type="income" />
            <WaterfallRow label="− Жильё" value={monthlyHousing} type="expense" />
            <WaterfallRow label="− Прочие расходы" value={monthlyOther} type="expense" />
            {smartSetsTotal > 0 && (
              <WaterfallRow label="− Smart-наборы" value={smartSetsTotal} type="expense" />
            )}
            <WaterfallRow
              label="💰 Инвестиционное ядро"
              value={investCore}
              type="core"
              noBorder
            />
          </div>

          {/* Capital block */}
          {capital > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              marginBottom: '1.25rem',
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Текущий капитал
              </p>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.01em' }}>
                {capital.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          )}

          {/* EmoSpend block */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            marginBottom: '1.25rem',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              ✨ EmoSpend
            </p>
            {capital > 0 ? (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Сколько капитал позволяет тратить на хотелки в месяц
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{
                    flex: 1,
                    background: 'var(--surface-light)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Минимум (4%)</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {emoMin.toLocaleString('ru-RU')} ₽
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.6, marginTop: '0.2rem' }}>в месяц</p>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'var(--surface-light)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Максимум (10%)</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {emoMax.toLocaleString('ru-RU')} ₽
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.6, marginTop: '0.2rem' }}>в месяц</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', opacity: 0.7, textAlign: 'center' }}>
                  Эта сумма не уменьшает капитал
                </p>
              </>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Начните копить капитал — появится ваш EmoSpend
              </p>
            )}
          </div>

          {/* Smart sets section */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
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

          {/* Capital forecast */}
          {(capital > 0 || investCore > 0) && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                📈 Прогноз капитала (8% годовых)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: '1 год',  months: 12  },
                  { label: '3 года', months: 36  },
                  { label: '5 лет',  months: 60  },
                  { label: '10 лет', months: 120 },
                ].map(({ label, months }, i, arr) => {
                  const r = 0.08 / 12
                  const P = Math.max(0, investCore)
                  const C = capital
                  const fv = Math.round(P * ((Math.pow(1 + r, months) - 1) / r) + C * Math.pow(1 + r, months))
                  const emoMinFV = Math.floor(fv * 0.04 / 12)
                  const emoMaxFV = Math.floor(fv * 0.10 / 12)
                  const isLast = i === arr.length - 1
                  return (
                    <div key={label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '3.5rem' }}>{label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)' }}>
                          {fv.toLocaleString('ru-RU')} ₽
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          EmoSpend: {emoMinFV.toLocaleString('ru-RU')} – {emoMaxFV.toLocaleString('ru-RU')} ₽/мес
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.75rem', opacity: 0.65, lineHeight: 1.4 }}>
                P = {Math.max(0, investCore).toLocaleString('ru-RU')} ₽/мес · FV = P×((1+r)^n−1)/r + C×(1+r)^n
              </p>
            </div>
          )}

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
    </div>
  )
}

export default Profile
