import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from './Navbar'
import SetCard from './SetCard'
import { createInventoryItems } from '../utils/inventoryUtils'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'
const COMMUNITY_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/community_sets.json'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

const TYPE_TABS = [
  { key: 'all',       label: 'Все наборы' },
  { key: 'default',   label: '🔥 SmartSpend' },
  { key: 'my',        label: '👤 Мои' },
  { key: 'community', label: '🌍 Сообщество' },
]

function Catalog() {
  const navigate = useNavigate()
  const [catalogData, setCatalogData] = useState(null)
  const [communityData, setCommunityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeFilter, setActiveFilter] = useState(null)  // category slug filter
  const [typeFilter, setTypeFilter] = useState('all')
  const [userSets, setUserSets] = useState(() => getUser()?.sets || [])
  const [mySets] = useState(() => getUser()?.mySets || [])

  useEffect(() => {
    fetch(CATALOG_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data) => { setCatalogData(data); setLoading(false) })
      .catch((err) => { console.error('[Catalog] fetch error:', err); setError(true); setLoading(false) })
  }, [])

  useEffect(() => {
    if (typeFilter !== 'community' && typeFilter !== 'all') return
    if (communityData) return
    fetch(COMMUNITY_URL)
      .then((r) => r.json())
      .then((data) => setCommunityData(data?.sets || []))
      .catch(() => setCommunityData([]))
  }, [typeFilter, communityData])

  const handleToggle = (setId) => {
    const user = getUser()
    if (!user) { navigate('/login'); return }
    if (!user.sets) user.sets = []
    if (!user.inventory) user.inventory = []

    const set = catalogData.sets.find((s) => s.id === setId)
    const isAdded = user.sets.includes(setId)

    if (isAdded) {
      user.sets = user.sets.filter((id) => id !== setId)
      user.inventory = user.inventory.filter((item) => item.setId !== setId)
      user.profile.smartSetsTotal = Math.max(0, (user.profile.smartSetsTotal || 0) - (set?.monthlyBudget || 0))
    } else {
      user.sets.push(setId)
      const newItems = set ? createInventoryItems(set) : []
      user.inventory = [...user.inventory, ...newItems]
      user.profile.smartSetsTotal = (user.profile.smartSetsTotal || 0) + (set?.monthlyBudget || 0)
    }

    localStorage.setItem('currentUser', JSON.stringify(user))
    setUserSets([...user.sets])
  }

  const categoriesMap = catalogData
    ? Object.fromEntries(catalogData.categories.map((c) => [c.slug, c]))
    : {}

  // Build mixed set list based on typeFilter
  const buildVisibleSets = () => {
    const results = []

    const showDefault = typeFilter === 'all' || typeFilter === 'default'
    const showMy      = typeFilter === 'all' || typeFilter === 'my'
    const showCom     = typeFilter === 'all' || typeFilter === 'community'

    if (showDefault && catalogData) {
      let sets = catalogData.sets
      if (activeFilter) sets = sets.filter((s) => s.categorySlug === activeFilter)
      sets.forEach((s) => results.push({ ...s, _type: 'default' }))
    }
    if (showMy) {
      let sets = mySets
      if (activeFilter) sets = sets.filter((s) => s.categorySlug === activeFilter)
      sets.forEach((s) => results.push({ ...s, _type: 'my' }))
    }
    if (showCom && communityData) {
      let sets = communityData
      if (activeFilter) sets = sets.filter((s) => s.categorySlug === activeFilter)
      sets.forEach((s) => results.push({ ...s, _type: 'community' }))
    }

    return results
  }

  const visibleSets = buildVisibleSets()

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          Каталог Smart-наборов
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
          Выберите наборы, которые подходят вашему образу жизни
        </p>

        {/* Type tabs */}
        <div style={{
          display: 'flex',
          gap: '2px',
          background: 'var(--surface)',
          borderRadius: '8px',
          padding: '3px',
          width: 'fit-content',
          marginBottom: '1.25rem',
        }}>
          {TYPE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              style={{
                padding: '0.38rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                background: typeFilter === key ? 'var(--surface-light)' : 'transparent',
                color: typeFilter === key ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: typeFilter === key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Загрузка...</p>
        )}
        {error && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Ошибка загрузки каталога, попробуйте позже
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Category filter pills — show only for default/all */}
            {catalogData && (typeFilter === 'all' || typeFilter === 'default') && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <FilterPill label="Все" active={activeFilter === null} onClick={() => setActiveFilter(null)} />
                {catalogData.categories.map((cat) => (
                  <FilterPill
                    key={cat.slug}
                    label={`${cat.icon} ${cat.name}`}
                    active={activeFilter === cat.slug}
                    onClick={() => setActiveFilter(activeFilter === cat.slug ? null : cat.slug)}
                  />
                ))}
              </div>
            )}

            {/* Empty states */}
            {typeFilter === 'my' && mySets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  У вас пока нет своих наборов
                </p>
                <button
                  onClick={() => navigate('/my-sets')}
                  style={{ padding: '0.6rem 1.25rem', background: 'var(--accent)', color: '#0f0f0f', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Создать первый набор
                </button>
              </div>
            )}

            {typeFilter === 'community' && !communityData && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', fontSize: '0.88rem' }}>
                Загрузка наборов сообщества...
              </p>
            )}

            {/* Sets grid */}
            {visibleSets.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
              }}>
                {visibleSets.map((set) => (
                  <SetCard
                    key={`${set._type}-${set.id}`}
                    set={set}
                    categoriesMap={categoriesMap}
                    isAdded={set._type === 'default' && userSets.includes(set.id)}
                    onToggle={handleToggle}
                    setType={set._type}
                  />
                ))}
              </div>
            )}

            {visibleSets.length === 0 && typeFilter !== 'my' && (typeFilter !== 'community' || communityData) && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.88rem' }}>
                Нет наборов в этой категории
              </p>
            )}

            {/* Summary bar */}
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
