import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

function Inventory() {
  const [catalogData, setCatalogData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const user = getUser()
  const userSetIds = user?.sets || []

  useEffect(() => {
    fetch(CATALOG_URL)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => { setCatalogData(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const userSets = catalogData
    ? userSetIds.map((id) => catalogData.sets.find((s) => s.id === id)).filter(Boolean)
    : []

  const totalItems = userSets.reduce((acc, s) => acc + s.items.length, 0)
  const totalBudget = user?.profile?.smartSetsTotal || 0

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.1rem 2rem',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.15rem',
          color: 'var(--accent)',
          fontWeight: 700,
        }}>
          SmartSpend
        </span>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/feed" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Лента
          </Link>
          <Link to="/catalog" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Каталог
          </Link>
          <Link to="/profile" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Профиль
          </Link>
        </nav>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.3rem',
            }}>
              Мой инвентарь
            </h1>
            {!loading && !error && userSets.length > 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {userSets.length} {pluralSets(userSets.length)} · {totalItems} позиций
              </p>
            )}
          </div>
          {!loading && totalBudget > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                Smart-наборы
              </div>
              <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>
                {totalBudget.toLocaleString('ru-RU')} ₽/мес
              </div>
            </div>
          )}
        </div>

        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Загрузка...
          </p>
        )}
        {error && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Ошибка загрузки, попробуйте позже
          </p>
        )}

        {!loading && !error && userSets.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Вы ещё не добавили ни одного набора
            </p>
            <Link
              to="/catalog"
              style={{
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Открыть каталог
            </Link>
          </div>
        )}

        {!loading && !error && userSets.map((set) => (
          <div
            key={set.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              marginBottom: '1rem',
              overflow: 'hidden',
            }}
          >
            {/* Set header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {set.name}
              </h3>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.88rem' }}>
                {set.monthlyBudget.toLocaleString('ru-RU')} ₽/мес
              </span>
            </div>

            {/* Items list */}
            <div style={{ padding: '0.5rem 0' }}>
              {set.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.55rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ fontSize: '0.88rem' }}>
                    {item.emoji} {item.name}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    borderRadius: '4px',
                    padding: '0.15rem 0.4rem',
                    fontWeight: 500,
                  }}>
                    Активен
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!loading && !error && userSets.length > 0 && (
          <Link
            to="/catalog"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '1rem',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '0.88rem',
              padding: '0.65rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            + Добавить ещё
          </Link>
        )}
      </div>
    </div>
  )
}

function pluralSets(n) {
  if (n === 1) return 'набор'
  if (n >= 2 && n <= 4) return 'набора'
  return 'наборов'
}

export default Inventory
