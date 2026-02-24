import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import InventoryItemCard from './InventoryItemCard'
import EditAmortizationModal from './EditAmortizationModal'
import { getUrgencyStatus } from '../utils/inventoryUtils'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

const URGENCY_CONFIG = [
  { key: 'danger',  label: 'Срочно',           sub: '≤ 3 дней',   color: '#ff6b6b',  bg: 'rgba(255,107,107,0.08)' },
  { key: 'warn',    label: 'Скоро',             sub: '4–14 дней',  color: '#ffb347',  bg: 'rgba(255,179,71,0.08)'  },
  { key: 'ok',      label: 'В норме',           sub: '>14 дней',   color: '#c8f047',  bg: 'rgba(200,240,71,0.08)'  },
  { key: 'idle',    label: 'Долгосрочные',      sub: 'мес/годы',   color: '#78909c',  bg: 'rgba(120,144,156,0.08)' },
  { key: 'overuse', label: 'Переэксплуатация',  sub: 'срок истёк', color: '#ce93d8',  bg: 'rgba(156,39,176,0.08)'  },
]

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

function Inventory() {
  const [catalogData, setCatalogData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [inventory, setInventory] = useState(() => getUser()?.inventory || [])
  const [viewMode, setViewMode] = useState('category')
  const [urgencyFilter, setUrgencyFilter] = useState(null)
  const [editModalItem, setEditModalItem] = useState(null)

  useEffect(() => {
    fetch(CATALOG_URL)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => { setCatalogData(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  // Urgency counts (for bar — excludes pending)
  const urgencyCounts = URGENCY_CONFIG.reduce((acc, { key }) => {
    acc[key] = inventory.filter((i) => getUrgencyStatus(i) === key).length
    return acc
  }, {})
  const pendingCount = inventory.filter((i) => i.status === 'pending').length

  // Active filter
  const displayedItems = urgencyFilter
    ? inventory.filter((i) => getUrgencyStatus(i) === urgencyFilter)
    : inventory

  // Group by set's category
  const groupByCategory = (items) => {
    if (!catalogData) return {}
    const result = {}
    items.forEach((item) => {
      const set = catalogData.sets.find((s) => s.id === item.setId)
      const cat = catalogData.categories.find((c) => c.slug === set?.categorySlug)
      const key = cat?.slug || 'other'
      if (!result[key]) result[key] = { category: cat, items: [] }
      result[key].items.push(item)
    })
    return result
  }

  const groupByUrgency = (items) => {
    const result = {}
    items.forEach((item) => {
      const u = getUrgencyStatus(item)
      if (!result[u]) result[u] = []
      result[u].push(item)
    })
    return result
  }

  const persistInventory = (updated) => {
    const user = getUser()
    if (!user) return
    user.inventory = updated
    localStorage.setItem('currentUser', JSON.stringify(user))
    setInventory([...updated])
  }

  const activateItem = (itemId) => {
    const now = new Date().toISOString()
    persistInventory(
      inventory.map((i) =>
        i.id !== itemId ? i : { ...i, status: 'active', activatedAt: now, lastPurchasedAt: now }
      )
    )
  }

  const handleSaveEdit = ({ serviceLifeWeeks, replacementPrice, weeksElapsed }) => {
    const newLastPurchased = new Date(
      Date.now() - weeksElapsed * 7 * 24 * 60 * 60 * 1000
    ).toISOString()
    const newTotalDays = serviceLifeWeeks * 7
    persistInventory(
      inventory.map((i) => {
        if (i.id !== editModalItem.id) return i
        return {
          ...i,
          serviceLifeWeeks,
          serviceLifeDays: newTotalDays,
          totalDays: newTotalDays,
          replacementPrice,
          weeklyCostRub: serviceLifeWeeks > 0 ? Math.ceil(replacementPrice / serviceLifeWeeks) : i.weeklyCostRub,
          lastPurchasedAt: newLastPurchased,
          status: weeksElapsed > serviceLifeWeeks ? 'overuse' : 'active',
        }
      })
    )
    setEditModalItem(null)
  }

  const handleFilterBy = (key) => setUrgencyFilter((prev) => (prev === key ? null : key))

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Ошибка загрузки, попробуйте позже</p>
      </div>
    )
  }

  const categoryGroups = groupByCategory(displayedItems)
  const urgencyGroups = groupByUrgency(displayedItems)
  const totalBudget = getUser()?.profile?.smartSetsTotal || 0

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
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', color: 'var(--accent)', fontWeight: 700 }}>
          SmartSpend
        </span>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/feed"    style={navLink}>Лента</Link>
          <Link to="/catalog" style={navLink}>Каталог</Link>
          <Link to="/profile" style={navLink}>Профиль</Link>
        </nav>
      </header>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Page title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700 }}>
            Мой инвентарь
            {inventory.length > 0 && (
              <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontFamily: 'sans-serif', fontWeight: 400, marginLeft: '0.75rem' }}>
                {inventory.length} позиций
              </span>
            )}
          </h1>
          {totalBudget > 0 && (
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1rem' }}>
              {totalBudget.toLocaleString('ru-RU')} ₽/мес
            </span>
          )}
        </div>

        {/* Empty state */}
        {inventory.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Добавьте наборы из каталога — позиции появятся здесь
            </p>
            <Link to="/catalog" style={{
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              padding: '0.65rem 1.25rem',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}>
              Открыть каталог
            </Link>
          </div>
        )}

        {inventory.length > 0 && (
          <>
            {/* Urgency bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.75rem',
            }}>
              {URGENCY_CONFIG.map(({ key, label, sub, color, bg }) => {
                const count = urgencyCounts[key]
                const isActive = urgencyFilter === key
                return (
                  <div
                    key={key}
                    onClick={() => handleFilterBy(key)}
                    style={{
                      background: isActive ? bg : 'var(--surface)',
                      border: `1px solid ${isActive ? color : 'var(--border)'}`,
                      borderRadius: '10px',
                      padding: '0.65rem 0.4rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color, marginBottom: '0.15rem' }}>
                      {count}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.1rem', lineHeight: 1.2 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.6rem', color, opacity: 0.75 }}>{sub}</div>
                  </div>
                )
              })}
            </div>

            {/* View toggle */}
            <div style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '1.25rem',
              background: 'var(--surface)',
              borderRadius: '8px',
              padding: '3px',
              width: 'fit-content',
            }}>
              {['category', 'urgency'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '0.38rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === mode ? 'var(--surface-light)' : 'transparent',
                    color: viewMode === mode ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: viewMode === mode ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {mode === 'category' ? 'По категориям' : 'По срочности'}
                </button>
              ))}
            </div>

            {/* Active filter chip */}
            {urgencyFilter && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}>
                <span>Фильтр: {URGENCY_CONFIG.find((u) => u.key === urgencyFilter)?.label}</span>
                <button
                  onClick={() => setUrgencyFilter(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '0.82rem' }}
                >
                  × Сбросить
                </button>
              </div>
            )}

            {displayedItems.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
                Нет позиций с таким статусом
              </p>
            )}

            {/* ── Category view ── */}
            {viewMode === 'category' && Object.entries(categoryGroups).map(([slug, group]) => (
              <div key={slug} style={{ marginBottom: '2rem' }}>
                <h3 style={sectionLabel}>
                  {group.category?.icon} {group.category?.name || slug}
                </h3>
                {group.items.map((item) => (
                  <InventoryItemCard
                    key={item.id}
                    item={item}
                    onActivate={activateItem}
                    onEdit={setEditModalItem}
                    onAddToList={() => alert('Список покупок — в разработке')}
                  />
                ))}
              </div>
            ))}

            {/* ── Urgency view ── */}
            {viewMode === 'urgency' && (
              <>
                {URGENCY_CONFIG.map(({ key, label, color }) => {
                  const items = urgencyGroups[key] || []
                  if (items.length === 0) return null
                  return (
                    <div key={key} style={{ marginBottom: '2rem' }}>
                      <h3 style={{ ...sectionLabel, color }}>{label} · {items.length}</h3>
                      {items.map((item) => (
                        <InventoryItemCard
                          key={item.id}
                          item={item}
                          onActivate={activateItem}
                          onEdit={setEditModalItem}
                          onAddToList={() => alert('Список покупок — в разработке')}
                        />
                      ))}
                    </div>
                  )
                })}

                {/* Pending group at bottom */}
                {!urgencyFilter && pendingCount > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={sectionLabel}>Ожидают покупки · {pendingCount}</h3>
                    {inventory.filter((i) => i.status === 'pending').map((item) => (
                      <InventoryItemCard
                        key={item.id}
                        item={item}
                        onActivate={activateItem}
                        onEdit={setEditModalItem}
                        onAddToList={() => alert('Список покупок — в разработке')}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            <Link to="/catalog" style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '0.5rem',
              padding: '0.65rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '0.85rem',
            }}>
              + Добавить ещё из каталога
            </Link>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editModalItem && (
        <EditAmortizationModal
          item={editModalItem}
          onClose={() => setEditModalItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}

const navLink = { color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }
const sectionLabel = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.75rem',
}

export default Inventory
