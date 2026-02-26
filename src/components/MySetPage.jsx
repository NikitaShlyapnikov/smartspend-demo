import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import SetCreatorModal from './SetCreatorModal'

const CATEGORY_MAP = {
  food:        '🥗 Еда & Напитки',
  care:        '🧴 Уход & Гигиена',
  clothes:     '👕 Одежда',
  electronics: '💻 Техника',
  home:        '🏠 Дом & Быт',
  sport:       '🏃 Спорт',
  other:       '📦 Другое',
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}
function saveUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user))
}
function getSharedSets() {
  try { return JSON.parse(localStorage.getItem('sharedSets')) || {} } catch { return {} }
}
function saveSharedSets(s) {
  localStorage.setItem('sharedSets', JSON.stringify(s))
}

function MySetPage() {
  const { setId } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [set, setSet] = useState(() => getUser()?.mySets?.find((s) => s.id === setId) || null)

  if (!set) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          Набор не найден
        </div>
      </div>
    )
  }

  const handleSave = (setData) => {
    const merged = { ...set, ...setData }
    const user = getUser()
    if (!user) return
    user.mySets = user.mySets.map((s) => (s.id === setId ? merged : s))
    saveUser(user)
    if (set.isPublic) {
      const shared = getSharedSets()
      shared[set.shareId] = merged
      saveSharedSets(shared)
    }
    setSet(merged)
    setEditOpen(false)
  }

  const weeklyTotal = set.items.reduce((sum, it) => sum + (it.weeklyCostRub || 0), 0)

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <Navbar />

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <span
            onClick={() => navigate('/my-sets')}
            style={{ cursor: 'pointer', color: 'var(--accent)' }}
          >
            Мои наборы
          </span>
          <span>/</span>
          <span>{set.name}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {CATEGORY_MAP[set.categorySlug] || '📦 Набор'}
              {set.originalAuthor && (
                <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                  · скопировано от {set.originalAuthor}
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '0.5rem' }}>
              {set.name}
            </h1>
            {set.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {set.description}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              padding: '0.55rem 1.1rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            ✎ Редактировать
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          {[
            { label: 'Позиций',  value: set.items.length },
            { label: 'В неделю', value: `${weeklyTotal.toLocaleString('ru-RU')} ₽` },
            { label: 'В месяц',  value: `${set.monthlyBudget.toLocaleString('ru-RU')} ₽` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '1rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.2rem' }}>
                {value}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Items list */}
        <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Состав набора
        </h2>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '2rem',
        }}>
          {set.items.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', fontSize: '0.88rem' }}>
              Нет позиций — добавьте через «Редактировать»
            </p>
          )}
          {set.items.map((item, i) => {
            const isConsumable = item.amortizationType === 'consumable'
            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2rem 1fr auto auto',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderBottom: i < set.items.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.2rem', textAlign: 'center', lineHeight: 1 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {isConsumable
                      ? `${item.packageSize || '—'} ${item.consumptionUnit || ''} · расход ${item.consumptionRate || '—'}/нед`
                      : `Срок: ${item.serviceLifeYears || '—'} лет`}
                    {item.coefficient && item.coefficient !== 1 && (
                      <span style={{ marginLeft: '0.4rem', color: 'var(--accent)', opacity: 0.8 }}>
                        ×{item.coefficient}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {(item.priceRub || 0).toLocaleString('ru-RU')} ₽
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {item.weeklyCostRub || 0} ₽/нед
                </span>
              </div>
            )
          })}
        </div>

        {/* Cost breakdown */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: set.isPublic ? '1rem' : 0,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Итого в месяц
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>
              {set.monthlyBudget.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            <div>{weeklyTotal} ₽/нед</div>
            <div style={{ opacity: 0.6, fontSize: '0.72rem' }}>{set.items.length} позиций</div>
          </div>
        </div>

        {/* Share info */}
        {set.isPublic && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🔗 Публичная ссылка:</span>
            <code style={{ flex: 1, fontSize: '0.75rem', color: 'var(--accent)', wordBreak: 'break-all' }}>
              {window.location.origin}/shared/{set.shareId}
            </code>
            {set.copiesCount > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                {set.copiesCount} копий
              </span>
            )}
          </div>
        )}
      </div>

      {editOpen && (
        <SetCreatorModal
          initialSet={set}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default MySetPage
