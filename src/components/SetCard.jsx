import { useNavigate } from 'react-router-dom'

function ItemMeta({ item }) {
  if (item.amortizationType === 'consumable') {
    return <span>{item.weeklyAmount}</span>
  }
  const years = item.serviceLifeYears ?? (item.serviceLifeMonths / 12)
  return <span>~{Number.isInteger(years) ? years : years.toFixed(1)} г</span>
}

function SetCard({ set, categoriesMap, isAdded, onToggle }) {
  const navigate = useNavigate()
  const category = categoriesMap[set.categorySlug]

  return (
    <div
      onClick={() => navigate(`/catalog/${set.categorySlug}/${set.id}`)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = isAdded ? 'var(--accent)' : 'rgba(255,255,255,0.25)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isAdded ? 'var(--accent)' : 'var(--border)' }}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isAdded ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'border-color 0.2s',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {set.badges.includes('popular') && (
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
        {set.badges.includes('economy') && (
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
          {category?.icon}
        </span>
      </div>

      {/* Name & description */}
      <div>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '0.3rem', lineHeight: 1.3 }}>
          {set.name}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.4, marginBottom: '0.2rem' }}>
          {set.description}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.7 }}>
          {set.methodology}
        </p>
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
            {set.exampleBrands.slice(0, 2).join(' · ')}
          </span>
          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>
            {set.monthlyBudget.toLocaleString('ru-RU')} ₽/мес
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggle(set.id) }}
          style={{
            width: '100%',
            padding: '0.6rem',
            borderRadius: '8px',
            border: '1px solid var(--accent)',
            background: isAdded ? 'var(--accent)' : 'transparent',
            color: isAdded ? '#0f0f0f' : 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isAdded) e.currentTarget.style.background = 'var(--accent-dim)'
          }}
          onMouseLeave={(e) => {
            if (!isAdded) e.currentTarget.style.background = 'transparent'
          }}
        >
          {isAdded ? '✓ В инвентаре' : '+ В инвентарь'}
        </button>
      </div>
    </div>
  )
}

function pluralItems(n) {
  if (n === 1) return 'позиция'
  if (n >= 2 && n <= 4) return 'позиции'
  return 'позиций'
}

export default SetCard
