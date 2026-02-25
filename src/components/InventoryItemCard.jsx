import {
  CIRCUMFERENCE,
  RING_R,
  getDaysLeft,
  getUrgencyStatus,
  getTimerDisplay,
  getRingProgress,
  getRingColor,
  getSavedAmount,
  getProgressPercent,
} from '../utils/inventoryUtils'

const BORDER_COLORS = {
  danger:  '#ff6b6b',
  warn:    '#ffb347',
  ok:      'var(--accent)',
  idle:    '#78909c',
  overuse: '#ce93d8',
  empty:   '#ff7043',
}

function InventoryItemCard({ item, onActivate, onEdit, now = Date.now() }) {
  const urgency = getUrgencyStatus(item, now)
  const isPending = item.status === 'pending'
  const daysLeft = getDaysLeft(item, now)
  const timerDisplay = getTimerDisplay(item, now)
  const ringProgress = getRingProgress(item, now)
  const ringColor = getRingColor(urgency)
  const borderColor = BORDER_COLORS[urgency]

  const showAmortization = item.amortizationType === 'depreciating' && !isPending
  const savedAmount = showAmortization ? getSavedAmount(item, now) : 0
  const progressPercent = showAmortization ? getProgressPercent(item, now) : 0
  const weeksLeft = daysLeft != null ? Math.ceil(daysLeft / 7) : 0
  const isOveruse = urgency === 'overuse'
  const isEmpty = urgency === 'empty'
  const overuseWeeks = isOveruse && daysLeft != null ? Math.abs(Math.ceil(daysLeft / 7)) : 0
  const overuseAmount = overuseWeeks * (item.weeklyCostRub || 0)

  // SVG ring offset: 0 = empty, CIRCUMFERENCE = full
  const dashOffset = CIRCUMFERENCE * (1 - ringProgress)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto auto',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--surface)',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '8px',
        borderLeft: isPending
          ? '1px dashed var(--border)'
          : `3px solid ${borderColor}`,
        border: isPending ? '1px dashed var(--border)' : undefined,
        opacity: isPending ? 0.72 : 1,
      }}
    >
      {/* Emoji */}
      <div style={{ fontSize: '1.5rem', textAlign: 'center', lineHeight: 1 }}>
        {item.emoji}
      </div>

      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '0.25rem',
        }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.name}</span>

          {isPending && (
            <span style={{
              fontSize: '0.62rem',
              background: 'var(--surface-light)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
            }}>
              Ожидает покупки
            </span>
          )}
          {isOveruse && (
            <span style={{
              fontSize: '0.62rem',
              background: 'rgba(156,39,176,0.12)',
              color: '#ce93d8',
              border: '1px solid rgba(206,147,216,0.3)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
            }}>
              Переэксплуатация
            </span>
          )}
          {isEmpty && (
            <span style={{
              fontSize: '0.62rem',
              background: 'rgba(255,112,67,0.12)',
              color: '#ff7043',
              border: '1px solid rgba(255,112,67,0.3)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
            }}>
              Закончилось
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
          {isPending ? (
            <span>Не активировано</span>
          ) : isEmpty ? (
            <span style={{ color: '#ff7043' }}>Нужна покупка</span>
          ) : item.amortizationType === 'consumable' ? (
            <span>Остаток: {item.currentAmount} {item.unit}</span>
          ) : (
            <span>
              Куплена:{' '}
              {new Date(item.lastPurchasedAt).toLocaleDateString('ru-RU')}
            </span>
          )}
        </div>
      </div>

      {/* Timer ring */}
      <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
        <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx="30" cy="30" r={RING_R}
            fill="none"
            stroke="var(--surface-light)"
            strokeWidth="3"
          />
          {/* Fill */}
          <circle
            cx="30" cy="30" r={RING_R}
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          color: isPending ? 'var(--text-muted)' : ringColor,
        }}>
          {timerDisplay}
        </span>
      </div>

      {/* Action button */}
      <div style={{ flexShrink: 0 }}>
        {isPending ? (
          <button
            onClick={() => onActivate(item.id)}
            style={{
              padding: '0.45rem 0.75rem',
              background: 'var(--accent)',
              color: '#0f0f0f',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Активировать
          </button>
        ) : isEmpty ? (
          <button
            onClick={() => onActivate(item.id)}
            style={{
              padding: '0.45rem 0.75rem',
              background: 'rgba(255,112,67,0.15)',
              color: '#ff7043',
              border: '1px solid rgba(255,112,67,0.4)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Пополнить
          </button>
        ) : (
          <button
            onClick={() => onEdit(item)}
            style={{
              padding: '0.45rem 0.75rem',
              background: 'transparent',
              color: isOveruse ? '#ce93d8' : 'var(--text-muted)',
              border: `1px solid ${isOveruse ? 'rgba(206,147,216,0.35)' : 'var(--border)'}`,
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✎ Изменить
          </button>
        )}
      </div>

      {/* Amortization block — spans all 4 columns */}
      {showAmortization && (
        <div style={{
          gridColumn: '1 / -1',
          marginTop: '4px',
          padding: '10px 12px',
          background: 'var(--surface-light)',
          borderRadius: '8px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '0.78rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Конверт амортизации</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {item.weeklyCostRub} ₽/нед
            </span>
          </div>

          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 6 }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: isOveruse ? '#ce93d8' : 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.73rem',
            color: 'var(--text-muted)',
          }}>
            <span>
              Накоплено:{' '}
              {savedAmount.toLocaleString('ru-RU')} ₽
              {' из '}
              {(item.replacementPrice || item.priceRub || 0).toLocaleString('ru-RU')} ₽
            </span>
            <span>
              {isOveruse
                ? `+${overuseAmount.toLocaleString('ru-RU')} ₽ сверх нормы`
                : `~${weeksLeft} нед. до замены`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryItemCard
