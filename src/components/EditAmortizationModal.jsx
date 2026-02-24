import { useState } from 'react'

const inputStyle = {
  width: '100%',
  background: 'var(--surface-light)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.65rem 1rem',
  color: 'var(--text)',
  fontSize: '0.9rem',
}

function EditAmortizationModal({ item, onClose, onSave }) {
  const [serviceLifeWeeks, setServiceLifeWeeks] = useState(
    item.serviceLifeWeeks || Math.ceil((item.totalDays || 365) / 7)
  )
  const [replacementPrice, setReplacementPrice] = useState(
    item.replacementPrice || item.priceRub || 0
  )
  const [weeksElapsed, setWeeksElapsed] = useState(
    item.lastPurchasedAt
      ? Math.floor((Date.now() - new Date(item.lastPurchasedAt)) / (7 * 24 * 60 * 60 * 1000))
      : 0
  )

  const weeklyContribution =
    serviceLifeWeeks > 0 ? Math.ceil(replacementPrice / serviceLifeWeeks) : 0
  const isOveruse = weeksElapsed > serviceLifeWeeks

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '380px',
        }}
      >
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.1rem',
          marginBottom: '1.5rem',
        }}>
          {item.emoji} Изменить параметры
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Срок эксплуатации (недель)
            </span>
            <input
              type="number"
              min="1"
              value={serviceLifeWeeks}
              onChange={(e) => setServiceLifeWeeks(Number(e.target.value))}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Стоимость замены (₽)
            </span>
            <input
              type="number"
              min="0"
              value={replacementPrice}
              onChange={(e) => setReplacementPrice(Number(e.target.value))}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Прошло с покупки (недель)
            </span>
            <input
              type="number"
              min="0"
              value={weeksElapsed}
              onChange={(e) => setWeeksElapsed(Number(e.target.value))}
              style={inputStyle}
            />
          </label>
        </div>

        {isOveruse && (
          <div style={{
            background: 'rgba(156,39,176,0.1)',
            border: '1px solid rgba(206,147,216,0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            color: '#ce93d8',
          }}>
            ⚠️ Переэксплуатация: {weeksElapsed - serviceLifeWeeks} нед. сверх нормы
          </div>
        )}

        <div style={{
          background: 'var(--surface-light)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
        }}>
          Нужно откладывать:{' '}
          <strong style={{ color: 'var(--accent)' }}>{weeklyContribution} ₽/нед</strong>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.7rem',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Отмена
          </button>
          <button
            onClick={() => onSave({ serviceLifeWeeks, replacementPrice, weeksElapsed })}
            className="btn-accent"
            style={{ flex: 1, padding: '0.7rem' }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditAmortizationModal
