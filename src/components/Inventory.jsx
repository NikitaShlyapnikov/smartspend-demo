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
  const [viewMode, setViewMode] = useState('category')
  const [urgencyFilter, setUrgencyFilter] = useState(null)
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

  // Active filter
  const displayedItems = urgencyFilter
    ? inventory.filter((i) => getUrgencyStatus(i, now) === urgencyFilter)
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
      const u = getUrgencyStatus(item, now)
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

  const categoryGroups = groupByCategory(displayedItems)
  const urgencyGroups = groupByUrgency(displayedItems)
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
                    now={now}
                    onActivate={activateItem}
                    onEdit={setEditModalItem}
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
                          now={now}
                          onActivate={activateItem}
                          onEdit={setEditModalItem}
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
                        now={now}
                        onActivate={activateItem}
                        onEdit={setEditModalItem}
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

export default Inventory
