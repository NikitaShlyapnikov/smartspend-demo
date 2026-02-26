import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}
function getSharedSets() {
  try { return JSON.parse(localStorage.getItem('sharedSets')) || {} } catch { return {} }
}
function saveSharedSets(shared) {
  localStorage.setItem('sharedSets', JSON.stringify(shared))
}

function SharedSetPage() {
  const { shareId } = useParams()
  const navigate = useNavigate()
  const [set, setSet] = useState(null)
  const [added, setAdded] = useState(false)
  const currentUser = getUser()

  useEffect(() => {
    const shared = getSharedSets()
    setSet(shared[shareId] || null)
  }, [shareId])

  if (!set) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Набор не найден или ссылка недействительна
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          На главную
        </button>
      </div>
    )
  }

  const handleAdd = () => {
    if (!currentUser) { navigate('/login'); return }
    const user = getUser()
    if (!user.mySets) user.mySets = []

    const alreadyAdded = user.mySets.some(
      (s) => s.shareId === shareId || s.originalShareId === shareId
    )
    if (alreadyAdded) { setAdded(true); setTimeout(() => navigate('/my-sets'), 1200); return }

    const copiedSet = {
      ...set,
      id: `my-set-${Date.now()}`,
      name: `${set.name} (копия)`,
      originalAuthor: set.authorName,
      originalShareId: shareId,
      isPublic: false,
      createdAt: new Date().toISOString(),
      copiesCount: 0,
    }
    user.mySets.push(copiedSet)
    localStorage.setItem('currentUser', JSON.stringify(user))

    // Increment copies count on original
    const shared = getSharedSets()
    if (shared[shareId]) {
      shared[shareId] = { ...shared[shareId], copiesCount: (shared[shareId].copiesCount || 0) + 1 }
      saveSharedSets(shared)
      setSet(shared[shareId])
    }

    setAdded(true)
    setTimeout(() => navigate('/my-sets'), 1500)
  }

  const category = CATEGORY_ICONS[set.categorySlug] || '📦'

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Simple header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 2rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <Link
          to="/"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.1rem',
            color: 'var(--accent)',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          SmartSpend
        </Link>
        {currentUser ? (
          <Link to="/my-sets" style={{ color: 'var(--accent)', fontSize: '0.82rem', textDecoration: 'none' }}>
            Мои наборы →
          </Link>
        ) : (
          <Link to="/login" style={{ color: 'var(--accent)', fontSize: '0.82rem', textDecoration: 'none' }}>
            Войти
          </Link>
        )}
      </header>

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Author badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.3rem 0.75rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginBottom: '1.25rem',
        }}>
          👤 {set.authorName}
        </div>

        {/* Category + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{category}</span>
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.9rem',
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: '0.75rem',
        }}>
          {set.name}
        </h1>

        {set.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            {set.description}
          </p>
        )}

        {/* Items */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}>
          {set.items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderBottom: i < set.items.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '0.88rem',
              }}
            >
              <span>{item.emoji} {item.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {(item.weeklyCostRub || 0)} ₽/нед
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          marginBottom: '1.5rem',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>В месяц</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.15rem' }}>
            {set.monthlyBudget.toLocaleString('ru-RU')} ₽
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={handleAdd}
          style={{
            width: '100%',
            padding: '0.9rem',
            background: added ? 'rgba(200,240,71,0.12)' : 'var(--accent)',
            color: added ? 'var(--accent)' : '#0f0f0f',
            border: added ? '1px solid var(--accent)' : 'none',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '0.75rem',
          }}
        >
          {added
            ? '✓ Добавлено — переходим в Мои наборы...'
            : currentUser
              ? '+ Добавить в мои наборы'
              : 'Войдите, чтобы скопировать набор'}
        </button>

        {set.copiesCount > 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.65 }}>
            Скопирован {set.copiesCount} {pluralTimes(set.copiesCount)}
          </p>
        )}
      </div>
    </div>
  )
}

const CATEGORY_ICONS = {
  food:        '🥗',
  care:        '🧴',
  clothes:     '👕',
  electronics: '💻',
  home:        '🏠',
  sport:       '🏃',
  other:       '📦',
}

function pluralTimes(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'раз'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'раза'
  return 'раз'
}

export default SharedSetPage
