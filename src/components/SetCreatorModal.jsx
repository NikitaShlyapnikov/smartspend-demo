import { useState } from 'react'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

const CATEGORIES = [
  { slug: 'food',        name: 'Еда & Напитки',    icon: '🥗' },
  { slug: 'care',        name: 'Уход & Гигиена',   icon: '🧴' },
  { slug: 'clothes',     name: 'Одежда',           icon: '👕' },
  { slug: 'electronics', name: 'Техника',           icon: '💻' },
  { slug: 'home',        name: 'Дом & Быт',        icon: '🏠' },
  { slug: 'sport',       name: 'Спорт',            icon: '🏃' },
  { slug: 'other',       name: 'Другое',           icon: '📦' },
]

function calcWeekly(item) {
  const price = Number(item.priceRub) || 0
  if (price <= 0) return 0
  if (item.amortizationType === 'consumable') {
    const pkg = Number(item.packageSize) || 0
    const rate = Number(item.consumptionRate) || 0
    if (pkg <= 0 || rate <= 0) return 0
    const ratePerDay = item.consumptionPeriod === 'daily' ? rate : rate / 7
    const days = pkg / ratePerDay
    return Math.ceil((price / days) * 7)
  } else {
    const years = Number(item.serviceLifeYears) || 1
    return Math.ceil(price / (years * 52))
  }
}

function calcMonthly(items) {
  return Math.round(items.reduce((sum, it) => sum + calcWeekly(it), 0) * 52 / 12)
}

function makeBlankItem() {
  return {
    id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    emoji: '📦',
    name: '',
    amortizationType: 'consumable',
    priceRub: '',
    packageSize: '',
    consumptionUnit: 'г',
    consumptionRate: '',
    consumptionPeriod: 'weekly',
    serviceLifeYears: '',
    isCustom: true,
  }
}

function SetCreatorModal({ initialSet, onClose, onSave }) {
  const [name, setName] = useState(initialSet?.name || '')
  const [description, setDescription] = useState(initialSet?.description || '')
  const [categorySlug, setCategorySlug] = useState(initialSet?.categorySlug || 'other')
  const [items, setItems] = useState(
    initialSet?.items?.map((it) => ({ ...it, id: it.id || `ci-${Date.now()}-${Math.random()}` })) || []
  )
  const [showCatalog, setShowCatalog] = useState(false)
  const [catalogData, setCatalogData] = useState(null)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [expandedSet, setExpandedSet] = useState(null)

  const monthlyBudget = calcMonthly(items)

  const fetchCatalog = () => {
    if (catalogData) { setShowCatalog(true); return }
    setCatalogLoading(true)
    fetch(CATALOG_URL)
      .then((r) => r.json())
      .then((data) => { setCatalogData(data); setCatalogLoading(false); setShowCatalog(true) })
      .catch(() => setCatalogLoading(false))
  }

  const addItem = () => setItems((prev) => [...prev, makeBlankItem()])

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id))

  const updateItem = (id, field, value) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)))

  const addFromCatalog = (catItem) => {
    setItems((prev) => [
      ...prev,
      {
        id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emoji: catItem.emoji,
        name: catItem.name,
        amortizationType: catItem.amortizationType,
        priceRub: catItem.priceRub,
        consumptionRate: catItem.consumptionRate || '',
        consumptionPeriod: catItem.consumptionPeriod || 'weekly',
        consumptionUnit: catItem.consumptionUnit || 'г',
        packageSize: catItem.packageSize || '',
        serviceLifeYears: catItem.serviceLifeYears || '',
        weeklyCostRub: catItem.weeklyCostRub,
        isCustom: false,
      },
    ])
    setShowCatalog(false)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const savedItems = items.map((it) => ({
      ...it,
      priceRub: Number(it.priceRub) || 0,
      consumptionRate: Number(it.consumptionRate) || 0,
      packageSize: Number(it.packageSize) || 0,
      serviceLifeYears: Number(it.serviceLifeYears) || 1,
      weeklyCostRub: calcWeekly(it),
    }))
    onSave({
      name: name.trim(),
      description: description.trim(),
      categorySlug,
      items: savedItems,
      monthlyBudget: calcMonthly(savedItems),
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem 1rem',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {initialSet ? 'Редактировать набор' : 'Новый набор'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.35rem', cursor: 'pointer', padding: '0 0.25rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Basic info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <input
              placeholder="Название набора *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
            <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Items header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Позиции {items.length > 0 && `(${items.length})`}
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button type="button" onClick={addItem} style={smallBtn}>
                + Своя позиция
              </button>
              <button type="button" onClick={fetchCatalog} style={smallBtn}>
                {catalogLoading ? '...' : '📦 Из каталога'}
              </button>
            </div>
          </div>

          {items.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1.25rem', background: 'var(--surface)', borderRadius: '8px', marginBottom: '0.75rem' }}>
              Добавьте позиции в набор
            </p>
          )}

          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onChange={(field, val) => updateItem(item.id, field, val)}
              onRemove={() => removeItem(item.id)}
            />
          ))}

          {/* Catalog browser */}
          {showCatalog && catalogData && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '0.85rem',
              marginBottom: '1rem',
              maxHeight: '260px',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Выберите позицию из каталога
                </span>
                <button type="button" onClick={() => setShowCatalog(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
              </div>
              {catalogData.sets.map((set) => (
                <div key={set.id} style={{ marginBottom: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedSet((p) => (p === set.id ? null : set.id))}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: 'var(--surface-light)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '0.4rem 0.75rem',
                      color: 'var(--text)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{set.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {expandedSet === set.id ? '▴' : '▾'}
                    </span>
                  </button>
                  {expandedSet === set.id && (
                    <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem' }}>
                      {set.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addFromCatalog(item)}
                          style={{
                            display: 'flex',
                            width: '100%',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '0.3rem 0.5rem',
                            borderRadius: '4px',
                            textAlign: 'left',
                          }}
                        >
                          <span>{item.emoji}</span>
                          <span style={{ flex: 1 }}>{item.name}</span>
                          <span style={{ color: 'var(--accent)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>+ добавить</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Итого: </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                {monthlyBudget.toLocaleString('ru-RU')} ₽/мес
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.6rem 1rem',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0f0f0f',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function ItemRow({ item, onChange, onRemove }) {
  const weekly = calcWeekly(item)
  const isConsumable = item.amortizationType === 'consumable'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '0.85rem',
      marginBottom: '0.5rem',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginBottom: '0.55rem' }}>
        <input
          value={item.emoji}
          onChange={(e) => onChange('emoji', e.target.value)}
          maxLength={2}
          style={{ ...inputStyle, width: '3rem', textAlign: 'center', padding: '0.45rem 0.3rem', fontSize: '1.15rem' }}
        />
        <input
          placeholder="Название *"
          value={item.name}
          onChange={(e) => onChange('name', e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select
          value={item.amortizationType}
          onChange={(e) => onChange('amortizationType', e.target.value)}
          style={{ ...inputStyle, width: 'auto', flexShrink: 0 }}
        >
          <option value="consumable">Расходник</option>
          <option value="depreciating">Амортизация</option>
        </select>
        <button
          type="button"
          onClick={onRemove}
          style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1rem', padding: '0.3rem', flexShrink: 0 }}
        >
          🗑
        </button>
      </div>

      {/* Fields */}
      {isConsumable ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.4rem' }}>
          <div>
            <label style={labelStyle}>Цена (₽)</label>
            <input type="number" min={0} placeholder="500" value={item.priceRub}
              onChange={(e) => onChange('priceRub', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Упаковка</label>
            <input type="number" min={0} placeholder="500" value={item.packageSize}
              onChange={(e) => onChange('packageSize', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Единица</label>
            <input placeholder="г, мл, шт" value={item.consumptionUnit}
              onChange={(e) => onChange('consumptionUnit', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Расход/нед</label>
            <input type="number" min={0} placeholder="70" value={item.consumptionRate}
              onChange={(e) => onChange('consumptionRate', e.target.value)} style={inputStyle} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
          <div>
            <label style={labelStyle}>Цена (₽)</label>
            <input type="number" min={0} placeholder="5000" value={item.priceRub}
              onChange={(e) => onChange('priceRub', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Срок службы (лет)</label>
            <input type="number" min={0.1} step={0.5} placeholder="2" value={item.serviceLifeYears}
              onChange={(e) => onChange('serviceLifeYears', e.target.value)} style={inputStyle} />
          </div>
        </div>
      )}

      {weekly > 0 && (
        <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--accent)', textAlign: 'right' }}>
          ≈ {weekly} ₽/нед
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  background: 'var(--surface-light)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.66rem',
  color: 'var(--text-muted)',
  marginBottom: '0.2rem',
}

const smallBtn = {
  padding: '0.32rem 0.65rem',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-muted)',
  fontSize: '0.75rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

export default SetCreatorModal
