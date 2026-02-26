import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import InventoryItemCard from './InventoryItemCard'
import EditAmortizationModal from './EditAmortizationModal'
import ActivateItemModal from './ActivateItemModal'
import { getUrgencyStatus } from '../utils/inventoryUtils'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS  = 24 * 60 * 60 * 1000

const URGENCY_CONFIG = [
  { key: 'danger',  label: 'Срочно',           sub: '≤ 3 дней',   color: '#ff6b6b',  bg: 'rgba(255,107,107,0.08)' },
  { key: 'warn',    label: 'Скоро',             sub: '4–14 дней',  color: '#ffb347',  bg: 'rgba(255,179,71,0.08)'  },
  { key: 'ok',      label: 'В норме',           sub: '>14 дней',   color: '#c8f047',  bg: 'rgba(200,240,71,0.08)'  },
  { key: 'idle',    label: 'Долгосрочные',      sub: 'мес/годы',   color: '#78909c',  bg: 'rgba(120,144,156,0.08)' },
  { key: 'overuse', label: 'Переэксплуатация',  sub: 'срок истёк', color: '#ce93d8',  bg: 'rgba(156,39,176,0.08)'  },
  { key: 'empty',   label: 'Закончилось',       sub: 'пополнить',  color: '#ff7043',  bg: 'rgba(255,112,67,0.08)'  },
]

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

function Inventory() {
  const [catalogData, setCatalogData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState(() => getUser()?.inventory || [])
  const [urgencyFilter, setUrgencyFilter] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [editModalItem, setEditModalItem] = useState(null)
  const [activateModalItem, setActivateModalItem] = useState(null)

  // Time simulation
  const [timeOffsetMs, setTimeOffsetMs] = useState(0)
  const [speedMode, setSpeedMode] = useState(false)
  const now = Date.now() + timeOffsetMs

  useEffect(() => {
    if (!speedMode) return
    const id = setInterval(() => {
      setTimeOffsetMs((prev) => prev + WEEK_MS / 20) // 1 week per 20 ticks
    }, 1000)
    return () => clearInterval(id)
  }, [speedMode])

  const adjustTime = (days) => setTimeOffsetMs((prev) => prev + days * DAY_MS)

  const offsetDays = Math.round(timeOffsetMs / DAY_MS)

  useEffect(() => {
    fetch(CATALOG_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data) => { setCatalogData(data); setLoading(false) })
      .catch((err) => {
        console.error('[Inventory] catalog fetch error:', err)
        setLoading(false)
      })
  }, [])

  // Urgency counts using simulated now
  const urgencyCounts = URGENCY_CONFIG.reduce((acc, { key }) => {
    acc[key] = inventory.filter((i) => getUrgencyStatus(i, now) === key).length
    return acc
  }, {})
  const pendingCount = inventory.filter((i) => i.status === 'pending').length

  // Apply urgency + category filters
  const displayedItems = inventory.filter((i) => {
    if (urgencyFilter && getUrgencyStatus(i, now) !== urgencyFilter) return false
    if (categoryFilter) {
      const slug = i.categorySlug
        || (catalogData?.sets.find((s) => s.id === i.setId)?.categorySlug)
        || 'other'
      if (slug !== categoryFilter) return false
    }
    return true
  })

  // Group by category — works with or without catalogData
  const groupByCategory = (items) => {
    const result = {}
    items.forEach((item) => {
      let slug = item.categorySlug
      let category = null
      if (!slug && catalogData) {
        const set = catalogData.sets.find((s) => s.id === item.setId)
        slug = set?.categorySlug
      }
      if (catalogData) category = catalogData.categories.find((c) => c.slug === slug)
      const key = slug || 'other'
      if (!result[key]) result[key] = { category, slug: key, items: [] }
      result[key].items.push(item)
    })
    return result
  }

  // Unique categories present in full inventory (for filter tabs)
  const inventoryCategories = (() => {
    const slugs = new Set(
      inventory.map((item) => {
        if (item.categorySlug) return item.categorySlug
        if (catalogData) return catalogData.sets.find((s) => s.id === item.setId)?.categorySlug || 'other'
        return 'other'
      })
    )
    if (!catalogData) return [...slugs].map((s) => ({ slug: s, name: s, icon: '📦' }))
    return catalogData.categories.filter((c) => slugs.has(c.slug))
  })()

  const toggleCollapse = (slug) =>
    setCollapsed((prev) => ({ ...prev, [slug]: !prev[slug] }))

  const persistInventory = (updated) => {
    const user = getUser()
    if (!user) return
    user.inventory = updated
    localStorage.setItem('currentUser', JSON.stringify(user))
    setInventory([...updated])
  }

  const activateItem = (itemId) => {
    const item = inventory.find((i) => i.id === itemId)
    if (item?.amortizationType === 'consumable') {
      setActivateModalItem(item)
    } else {
      const nowIso = new Date(now).toISOString()
      persistInventory(
        inventory.map((i) =>
          i.id !== itemId ? i : { ...i, status: 'active', activatedAt: nowIso, lastPurchasedAt: nowIso }
        )
      )
    }
  }

  const handleSaveActivate = ({ quantity }) => {
    const item = activateModalItem
    const packageSize = item.packageSize || item.currentAmount || 1
    const newTotalDays = Math.round((quantity / packageSize) * item.consumptionDays)
    const nowIso = new Date(now).toISOString()
    persistInventory(
      inventory.map((i) => {
        if (i.id !== item.id) return i
        return {
          ...i,
          status: 'active',
          activatedAt: nowIso,
          lastPurchasedAt: nowIso,
          totalDays: newTotalDays,
          currentAmount: quantity,
        }
      })
    )
    setActivateModalItem(null)
  }

  const handleSaveEdit = ({ serviceLifeWeeks, replacementPrice, weeksElapsed }) => {
    const newLastPurchased = new Date(
      now - weeksElapsed * WEEK_MS
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

  const totalBudget = getUser()?.profile?.smartSetsTotal || 0

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <Navbar />

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Page title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
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

        {/* Speed controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          padding: '0.65rem 1rem',
          background: 'var(--surface)',
          border: `1px solid ${speedMode ? '#ffb347' : 'var(--border)'}`,
          borderRadius: '10px',
          transition: 'border-color 0.2s',
        }}>
          <button
            onClick={() => setSpeedMode((v) => !v)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '6px',
              border: `1px solid ${speedMode ? '#ffb347' : 'var(--border)'}`,
              background: speedMode ? 'rgba(255,179,71,0.12)' : 'transparent',
              color: speedMode ? '#ffb347' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: speedMode ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {speedMode ? '⏸ Стоп' : '⚡ Ускорение (1 нед = 20 с)'}
          </button>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[[-365, '−1г'], [-7, '−7д'], [-1, '−1д'], [1, '+1д'], [7, '+1нед'], [365, '+1г']].map(([d, label]) => (
              <button
                key={label}
                onClick={() => adjustTime(d)}
                style={{
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {offsetDays !== 0 && (
            <>
              <span style={{ fontSize: '0.78rem', color: offsetDays > 0 ? '#ffb347' : '#64b5f6', marginLeft: '0.25rem' }}>
                {offsetDays > 0 ? '+' : ''}{offsetDays} дн.
              </span>
              <button
                onClick={() => { setTimeOffsetMs(0); setSpeedMode(false) }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.78rem', cursor: 'pointer', padding: '0', marginLeft: 'auto' }}
              >
                Сброс
              </button>
            </>
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
            {/* Urgency stats bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.4rem',
              marginBottom: '1.25rem',
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
                      padding: '0.55rem 0.25rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color, marginBottom: '0.1rem' }}>
                      {count}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Category filter tabs */}
            {inventoryCategories.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <CatPill label="Все" active={categoryFilter === null} onClick={() => setCategoryFilter(null)} />
                {inventoryCategories.map((cat) => (
                  <CatPill
                    key={cat.slug}
                    label={`${cat.icon} ${cat.name}`}
                    active={categoryFilter === cat.slug}
                    onClick={() => setCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
                  />
                ))}
              </div>
            )}

            {/* Active filter chips */}
            {(urgencyFilter || categoryFilter) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {urgencyFilter && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.5rem' }}>
                    Срочность: {URGENCY_CONFIG.find((u) => u.key === urgencyFilter)?.label}
                    <button onClick={() => setUrgencyFilter(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>×</button>
                  </span>
                )}
                {categoryFilter && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.5rem' }}>
                    {inventoryCategories.find((c) => c.slug === categoryFilter)?.name || categoryFilter}
                    <button onClick={() => setCategoryFilter(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}>×</button>
                  </span>
                )}
              </div>
            )}

            {displayedItems.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
                Нет позиций с таким фильтром
              </p>
            )}

            {/* ── Category groups (collapsible) ── */}
            {Object.entries(groupByCategory(displayedItems)).map(([slug, group]) => {
              const isCollapsed = !!collapsed[slug]
              return (
                <div key={slug} style={{ marginBottom: '1.5rem' }}>
                  {/* Group header */}
                  <div
                    onClick={() => toggleCollapse(slug)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginBottom: isCollapsed ? 0 : '0.75rem',
                      padding: '0.35rem 0',
                      userSelect: 'none',
                    }}
                  >
                    <h3 style={{ ...sectionLabel, margin: 0 }}>
                      {group.category?.icon || '📦'} {group.category?.name || slug}
                      <span style={{ fontWeight: 400, marginLeft: '0.5rem', opacity: 0.6 }}>
                        · {group.items.length}
                      </span>
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {isCollapsed ? '▶' : '▼'}
                    </span>
                  </div>

                  {/* Items */}
                  {!isCollapsed && group.items.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      now={now}
                      onActivate={activateItem}
                      onEdit={setEditModalItem}
                    />
                  ))}
                </div>
              )
            })}

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

      {/* Activate consumable modal */}
      {activateModalItem && (
        <ActivateItemModal
          item={activateModalItem}
          onClose={() => setActivateModalItem(null)}
          onSave={handleSaveActivate}
        />
      )}
    </div>
  )
}

const sectionLabel = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.75rem',
}

function CatPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.8rem',
        borderRadius: '20px',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        fontSize: '0.8rem',
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

export default Inventory
