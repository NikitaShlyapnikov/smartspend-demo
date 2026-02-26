import { useNavigate } from 'react-router-dom'

function ItemMeta({ item }) {
  if (item.amortizationType === 'consumable') {
    return <span>{item.weeklyAmount || `${item.consumptionRate || '—'} ${item.consumptionUnit || ''}/нед`}</span>
  }
  const years = item.serviceLifeYears ?? (item.serviceLifeMonths ? item.serviceLifeMonths / 12 : null)
  if (years == null) return null
  return <span>~{Number.isInteger(years) ? years : years.toFixed(1)} г</span>
}

// setType: 'default' | 'my' | 'community'
function SetCard({ set, categoriesMap, isAdded, onToggle, onAddToInventory, setType = 'default' }) {
  const navigate = useNavigate()
  const category = categoriesMap?.[set.categorySlug]

  const handleCardClick = () => {
    if (setType === 'my') navigate(`/my-sets/${set.id}`)
    else if (setType === 'community') navigate(`/shared/${set.shareId}`)
    else navigate(`/catalog/${set.categorySlug}/${set.id}`)
  }

  const actionLabel = isAdded ? '✓ В инвентаре' : '+ В инвентарь'

  const handleAction = (e) => {
    e.stopPropagation()
    if (isAdded) return
    if (setType === 'default') onToggle?.(set.id)
    else onAddToInventory?.(set)
  }

  const isDefaultAdded = setType === 'default' && isAdded
  const borderColor = isDefaultAdded ? 'var(--accent)' : 'var(--border)'

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDefaultAdded ? 'var(--accent)' : 'rgba(255,255,255,0.25)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor }}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'border-color 0.2s',
        cursor: 'pointer',
      }}
    >
      {/* Header — badges + category icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Type badge */}
        {setType === 'my' && (
          <span style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '0.12rem 0.4rem',
            letterSpacing: '0.04em',
          }}>
            Мой набор
          </span>
        )}
        {setType === 'community' && (
          <span style={{
            background: 'rgba(100,181,246,0.12)',
            color: '#64b5f6',
            border: '1px solid rgba(100,181,246,0.3)',
            borderRadius: '4px',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '0.12rem 0.4rem',
            letterSpacing: '0.04em',
          }}>
            от {set.authorName || 'участника'}
          </span>
        )}

        {/* Default catalog badges */}
        {setType === 'default' && set.badges?.includes('popular') && (
          <span style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            letterSpacing: '0.05em',
          }}>
            Популярный
          </span>
        )}
        {setType === 'default' && set.badges?.includes('economy') && (
          <span style={{
            background: 'rgba(255,152,0,0.15)',
            color: '#ff9800',
            border: '1px solid rgba(255,152,0,0.4)',
            borderRadius: '4px',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            letterSpacing: '0.05em',
          }}>
            Экономия
          </span>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '1.25rem' }}>
          {category?.icon || CATEGORY_ICONS[set.categorySlug] || '📦'}
        </span>
      </div>

      {/* Name & description */}
      <div>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '0.3rem', lineHeight: 1.3 }}>
          {set.name}
        </h3>
        {set.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.4, marginBottom: '0.2rem' }}>
            {set.description}
          </p>
        )}
        {set.methodology && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.7 }}>
            {set.methodology}
          </p>
        )}
      </div>

      {/* Items preview */}
      <div style={{
        background: 'var(--surface-light)',
        borderRadius: '8px',
        padding: '0.6rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}>
        {set.items.slice(0, 3).map((item) => (
          <div key={item.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
          }}>
            <span>{item.emoji} {item.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ItemMeta item={item} />
            </span>
          </div>
        ))}
        {set.items.length > 3 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.7 }}>
            + ещё {set.items.length - 3} {pluralItems(set.items.length - 3)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {set.exampleBrands?.slice(0, 2).join(' · ')
              || (set.authorName && setType === 'community' ? `👤 ${set.authorName}` : '')}
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
            {(set.monthlyBudget || 0).toLocaleString('ru-RU')} ₽/мес
          </span>
        </div>

        <button
          onClick={handleAction}
          style={{
            width: '100%',
            padding: '0.6rem',
            borderRadius: '8px',
            border: '1px solid var(--accent)',
            background: isDefaultAdded ? 'var(--accent)' : 'transparent',
            color: isDefaultAdded ? '#0f0f0f' : 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => { if (!isDefaultAdded) e.currentTarget.style.background = 'var(--accent-dim)' }}
          onMouseLeave={(e) => { if (!isDefaultAdded) e.currentTarget.style.background = 'transparent' }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

const CATEGORY_ICONS = {
  food: '🥗', care: '🧴', clothes: '👕',
  electronics: '💻', home: '🏠', sport: '🏃', other: '📦',
}

function pluralItems(n) {
  if (n === 1) return 'позиция'
  if (n >= 2 && n <= 4) return 'позиции'
  return 'позиций'
}

export default SetCard
