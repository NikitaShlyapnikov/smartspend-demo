import { useState } from 'react'

function ActivateItemModal({ item, onClose, onSave }) {
  const defaultQty = item.packageSize || item.currentAmount || 1
  const [quantity, setQuantity] = useState(defaultQty)

  const daysPerUnit = item.consumptionDays / (item.packageSize || item.currentAmount || 1)
  const previewDays = Math.round(quantity * daysPerUnit)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (quantity > 0) onSave({ quantity: Number(quantity) })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
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
          maxWidth: '360px',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          {item.emoji} {item.name}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Введите количество купленных единиц
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
            Количество ({item.unit})
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '0.65rem 0.9rem',
              background: 'var(--surface-light)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '0.75rem',
            }}
          />

          {quantity > 0 && (
            <p style={{
              fontSize: '0.78rem',
              color: 'var(--accent)',
              marginBottom: '1.25rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--accent-dim)',
              borderRadius: '6px',
            }}>
              Хватит примерно на {previewDays} {pluralDays(previewDays)}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.65rem',
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
              disabled={!quantity || quantity <= 0}
              style={{
                flex: 1,
                padding: '0.65rem',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '8px',
                color: '#0f0f0f',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Активировать
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function pluralDays(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'дня'
  return 'дней'
}

export default ActivateItemModal
