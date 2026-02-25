import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import SetCard from './SetCard'
import { createInventoryItems } from '../utils/inventoryUtils'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

function Catalog() {
  const navigate = useNavigate()
  const [catalogData, setCatalogData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeFilter, setActiveFilter] = useState(null) // null = all
  const [userSets, setUserSets] = useState(() => getUser()?.sets || [])

  useEffect(() => {
    fetch(CATALOG_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((data) => { setCatalogData(data); setLoading(false) })
      .catch((err) => {
        console.error('[Catalog] fetch error:', err)
        setError(true)
        setLoading(false)
      })
  }, [])

  const handleToggle = (setId) => {
    const user = getUser()
    if (!user) { navigate('/login'); return }

    if (!user.sets) user.sets = []
    if (!user.inventory) user.inventory = []

    const set = catalogData.sets.find((s) => s.id === setId)
    const isAdded = user.sets.includes(setId)

    if (isAdded) {
      // Remove set and its inventory items
      user.sets = user.sets.filter((id) => id !== setId)
      user.inventory = user.inventory.filter((item) => item.setId !== setId)
      user.profile.smartSetsTotal = Math.max(
        0,
        (user.profile.smartSetsTotal || 0) - (set?.monthlyBudget || 0)
      )
    } else {
      // Add set and create inventory items with pending status
      user.sets.push(setId)
      const newItems = set ? createInventoryItems(set) : []
      user.inventory = [...user.inventory, ...newItems]
      user.profile.smartSetsTotal =
        (user.profile.smartSetsTotal || 0) + (set?.monthlyBudget || 0)
    }

    localStorage.setItem('currentUser', JSON.stringify(user))
    setUserSets([...user.sets])
  }

  const categoriesMap = catalogData
    ? Object.fromEntries(catalogData.categories.map((c) => [c.slug, c]))
    : {}

  const visibleSets = catalogData
    ? activeFilter
      ? catalogData.sets.filter((s) => s.categorySlug === activeFilter)
      : catalogData.sets
    : []

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
          <Link to="/inventory" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Инвентарь
          </Link>
          <Link to="/profile" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Профиль
          </Link>
        </nav>
      </header>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '0.4rem',
        }}>
          Каталог Smart-наборов
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Выберите наборы, которые подходят вашему образу жизни
        </p>

        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Загрузка...</p>
        )}
        {error && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Ошибка загрузки каталога, попробуйте позже
          </p>
        )}

        {catalogData && (
          <>
            {/* Category filter pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <FilterPill
                label="Все"
                active={activeFilter === null}
                onClick={() => setActiveFilter(null)}
              />
              {catalogData.categories.map((cat) => (
                <FilterPill
                  key={cat.slug}
                  label={`${cat.icon} ${cat.name}`}
                  active={activeFilter === cat.slug}
                  onClick={() => setActiveFilter(activeFilter === cat.slug ? null : cat.slug)}
                />
              ))}
            </div>

            {/* Sets grid */}
            {visibleSets.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                Нет наборов в этой категории
              </p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}>
                {visibleSets.map((set) => (
                  <SetCard
                    key={set.id}
                    set={set}
                    categoriesMap={categoriesMap}
                    isAdded={userSets.includes(set.id)}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}

            {/* Summary bar if sets are added */}
            {userSets.length > 0 && (
              <div style={{
                position: 'fixed',
                bottom: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--surface)',
                border: '1px solid var(--accent)',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                zIndex: 20,
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Выбрано: <strong style={{ color: 'var(--text)' }}>{userSets.length}</strong>
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
                  {(getUser()?.profile?.smartSetsTotal || 0).toLocaleString('ru-RU')} ₽/мес
                </span>
                <Link
                  to="/inventory"
                  style={{
                    color: '#0f0f0f',
                    background: 'var(--accent)',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  В инвентарь →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 0.85rem',
        borderRadius: '20px',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        fontSize: '0.82rem',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export default Catalog
