import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from './Navbar'
import { createInventoryItems } from '../utils/inventoryUtils'

const CATALOG_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/catalog.json'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

function SetPage() {
  const { category, setId } = useParams()
  const navigate = useNavigate()
  const [catalogData, setCatalogData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    fetch(CATALOG_URL)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => {
        setCatalogData(data)
        setLoading(false)
        const user = getUser()
        if (user?.sets) {
          setIsAdded(user.sets.includes(setId))
        }
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [setId])

  const handleToggle = () => {
    const user = getUser()
    if (!user) { navigate('/login'); return }

    if (!user.sets) user.sets = []
    if (!user.inventory) user.inventory = []

    const set = catalogData.sets.find((s) => s.id === setId)

    if (isAdded) {
      user.sets = user.sets.filter((id) => id !== setId)
      user.inventory = user.inventory.filter((item) => item.setId !== setId)
      user.profile.smartSetsTotal = Math.max(
        0,
        (user.profile.smartSetsTotal || 0) - (set?.monthlyBudget || 0)
      )
      setIsAdded(false)
    } else {
      user.sets.push(setId)
      const newItems = set ? createInventoryItems(set) : []
      user.inventory = [...user.inventory, ...newItems]
      user.profile.smartSetsTotal =
        (user.profile.smartSetsTotal || 0) + (set?.monthlyBudget || 0)
      setIsAdded(true)
    }

    localStorage.setItem('currentUser', JSON.stringify(user))
  }

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

  const set = catalogData?.sets.find((s) => s.id === setId)
  const cat = catalogData?.categories.find((c) => c.slug === (set?.categorySlug || category))

  if (!set) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Набор не найден</p>
      </div>
    )
  }

  const totalWeeklyCost = set.items.reduce((sum, i) => sum + (i.weeklyCostRub || 0), 0)
  const consumables = set.items.filter((i) => i.amortizationType === 'consumable')
  const depreciating = set.items.filter((i) => i.amortizationType !== 'consumable')
  const isFood = set.categorySlug === 'food' || set.categorySlug === 'питание' || set.categorySlug === 'nutrition'
  const hasRecipes = isFood || (set.recipes && set.recipes.length > 0)

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Breadcrumbs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <Link to="/catalog" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Каталог
          </Link>
          <span style={{ opacity: 0.5 }}>›</span>
          <Link
            to={`/catalog`}
            onClick={(e) => { e.preventDefault(); navigate('/catalog') }}
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            {cat?.icon} {cat?.name || category}
          </Link>
          <span style={{ opacity: 0.5 }}>›</span>
          <span style={{ color: 'var(--text)' }}>{set.name}</span>
        </nav>

        {/* Set header */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {set.badges.includes('popular') && (
              <span style={badgeStyle('var(--accent-dim)', 'var(--accent)', 'var(--accent)')}>
                Популярный
              </span>
            )}
            {set.badges.includes('economy') && (
              <span style={badgeStyle('rgba(255,152,0,0.15)', '#ff9800', 'rgba(255,152,0,0.4)')}>
                Экономия
              </span>
            )}
            {set.featured && (
              <span style={badgeStyle('rgba(100,181,246,0.12)', '#64b5f6', 'rgba(100,181,246,0.3)')}>
                Рекомендуем
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {cat?.icon} {set.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.35rem', lineHeight: 1.5 }}>
            {set.description}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', opacity: 0.65 }}>
            {set.methodology}
          </p>
        </div>

        {/* Stats panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          <StatCard label="Бюджет" value={`${set.monthlyBudget.toLocaleString('ru-RU')} ₽`} sub="в месяц" />
          <StatCard label="Позиций" value={set.items.length} sub="в наборе" />
          <StatCard label="Откладывать" value={`${totalWeeklyCost.toLocaleString('ru-RU')} ₽`} sub="в неделю" />
          {consumables.length > 0 && (
            <StatCard label="Расходники" value={consumables.length} sub="позиций" dim />
          )}
          {depreciating.length > 0 && (
            <StatCard label="Техника/вещи" value={depreciating.length} sub="позиций" dim />
          )}
        </div>

        {/* Add button */}
        <button
          onClick={handleToggle}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '360px',
            margin: '0 0 2.5rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--accent)',
            background: isAdded ? 'var(--accent)' : 'transparent',
            color: isAdded ? '#0f0f0f' : 'var(--accent)',
            fontSize: '0.95rem',
            fontWeight: 700,
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
          {isAdded ? '✓ В инвентаре' : '+ Добавить в инвентарь'}
        </button>

        {/* Two-column layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '2rem',
          alignItems: 'start',
          marginBottom: '2.5rem',
        }}>
          {/* Left: Ingredient list (sticky) */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <h2 style={sectionHeading}>Состав набора</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {set.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Right: Description + cost breakdown */}
          <div>
            <h2 style={sectionHeading}>О наборе</h2>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.65, marginBottom: '1rem' }}>
                {set.description}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6, fontStyle: 'italic', opacity: 0.75 }}>
                {set.methodology}
              </p>

              {set.exampleBrands && set.exampleBrands.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                    Примеры брендов
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                    {set.exampleBrands.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            {/* Cost breakdown */}
            <h2 style={{ ...sectionHeading, marginTop: '1.5rem' }}>Разбивка расходов</h2>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              {set.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 1rem',
                    borderBottom: idx < set.items.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ color: 'var(--text)' }}>
                    {item.emoji} {item.name}
                  </span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                    {(item.weeklyCostRub || 0).toLocaleString('ru-RU')} ₽/нед
                  </span>
                </div>
              ))}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'var(--surface-light)',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}>
                <span>Итого</span>
                <span style={{ color: 'var(--accent)' }}>
                  {totalWeeklyCost.toLocaleString('ru-RU')} ₽/нед · {set.monthlyBudget.toLocaleString('ru-RU')} ₽/мес
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recipes section (food sets) */}
        {hasRecipes && (
          <div>
            <h2 style={sectionHeading}>Рецепты из набора</h2>
            {set.recipes && set.recipes.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1rem',
              }}>
                {set.recipes.map((recipe, idx) => (
                  <RecipeCard key={idx} recipe={recipe} setItems={set.items} />
                ))}
              </div>
            ) : (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🍳</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Рецепты на основе этого набора появятся в следующем обновлении
                </p>
              </div>
            )}
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Link to="/catalog" style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '2px',
          }}>
            ← Вернуться в каталог
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ label, value, sub, dim }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '0.9rem 1rem',
      textAlign: 'center',
      opacity: dim ? 0.75 : 1,
    }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.2rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.6, marginTop: '0.1rem' }}>
        {sub}
      </div>
    </div>
  )
}

function ItemRow({ item }) {
  const isConsumable = item.amortizationType === 'consumable'

  let meta = ''
  if (isConsumable) {
    if (item.weeklyAmount) meta = item.weeklyAmount
    else if (item.consumptionRate && item.consumptionUnit) {
      const period = item.consumptionPeriod === 'daily' ? 'день' : 'нед'
      meta = `${item.consumptionRate} ${item.consumptionUnit}/${period}`
    }
  } else {
    const years = item.serviceLifeYears ?? (item.serviceLifeMonths ? item.serviceLifeMonths / 12 : null)
    if (years != null) {
      meta = `~${Number.isInteger(years) ? years : years.toFixed(1)} г`
    } else if (item.serviceLifeMonths) {
      meta = `${item.serviceLifeMonths} мес`
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '0.5rem',
      alignItems: 'center',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '0.65rem 0.85rem',
    }}>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.15rem' }}>
          {item.emoji} {item.name}
        </div>
        {meta && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {isConsumable ? '📦 ' : '⏱ '}{meta}
            {item.packageSize && item.consumptionUnit ? ` · пачка ${item.packageSize} ${item.consumptionUnit}` : ''}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
          {(item.weeklyCostRub || 0)} ₽/нед
        </div>
        {item.priceRub && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {item.priceRub.toLocaleString('ru-RU')} ₽
          </div>
        )}
      </div>
    </div>
  )
}

function RecipeCard({ recipe, setItems }) {
  const usedItems = recipe.itemIds
    ? setItems.filter((i) => recipe.itemIds.includes(i.id))
    : []

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1rem',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{recipe.emoji || '🍽'}</div>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.35rem' }}>{recipe.name}</h3>
      {recipe.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
          {recipe.description}
        </p>
      )}
      {usedItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
          {usedItems.map((i) => (
            <span key={i.id} style={{
              fontSize: '0.72rem',
              background: 'var(--surface-light)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
              color: 'var(--text-muted)',
            }}>
              {i.emoji} {i.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────

function badgeStyle(bg, color, border) {
  return {
    background: bg,
    color,
    border: `1px solid ${border}`,
    borderRadius: '4px',
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    letterSpacing: '0.05em',
  }
}


const sectionHeading = {
  fontFamily: "'Playfair Display', serif",
  fontSize: '1.15rem',
  fontWeight: 700,
  marginBottom: '1rem',
}

export default SetPage
