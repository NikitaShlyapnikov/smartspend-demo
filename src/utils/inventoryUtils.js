export const RING_R = 26
export const CIRCUMFERENCE = 2 * Math.PI * RING_R

// --- Time helpers ---

export function getDaysLeft(item, now = Date.now()) {
  if (!item.lastPurchasedAt) return null
  const msPerDay = 24 * 60 * 60 * 1000
  const daysSincePurchase = (now - new Date(item.lastPurchasedAt)) / msPerDay
  const totalDays = item.totalDays || item.serviceLifeDays || 1
  return Math.ceil(totalDays - daysSincePurchase)
}

export function getUrgencyStatus(item, now = Date.now()) {
  if (item.status === 'pending') return 'pending'
  const daysLeft = getDaysLeft(item, now)
  if (daysLeft === null) return 'pending'
  if (daysLeft < 0) return item.amortizationType === 'consumable' ? 'empty' : 'overuse'
  if (daysLeft <= 3) return 'danger'
  if (daysLeft <= 14) return 'warn'
  if (daysLeft > 60) return 'idle'
  return 'ok'
}

export function getTimerDisplay(item, now = Date.now()) {
  if (item.status === 'pending') return '—'
  const daysLeft = getDaysLeft(item, now)
  if (daysLeft === null) return '—'
  if (daysLeft < 0) {
    if (item.amortizationType === 'consumable') return 'Пусто'
    return `-${Math.abs(daysLeft)}д`
  }
  if (daysLeft > 30) return `${Math.round(daysLeft / 30)}м`
  return `${daysLeft}д`
}

export function getRingProgress(item, now = Date.now()) {
  if (item.status === 'pending') return 0
  const daysLeft = getDaysLeft(item, now)
  if (daysLeft === null) return 0
  if (daysLeft < 0 && item.amortizationType === 'consumable') return 0
  const totalDays = item.totalDays || item.serviceLifeDays || 1
  return Math.max(0, Math.min(1, daysLeft / totalDays))
}

export const RING_COLORS = {
  danger:  '#ff6b6b',
  warn:    '#ffb347',
  ok:      '#c8f047',
  idle:    '#78909c',
  overuse: '#ce93d8',
  empty:   '#ff7043',
  pending: 'rgba(255,255,255,0.15)',
}

export function getRingColor(urgencyStatus) {
  return RING_COLORS[urgencyStatus] ?? RING_COLORS.pending
}

// --- Amortization helpers ---

export function getSavedAmount(item, now = Date.now()) {
  if (!item.lastPurchasedAt) return 0
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeks = (now - new Date(item.lastPurchasedAt)) / msPerWeek
  return Math.floor(weeks * (item.weeklyCostRub || 0))
}

export function getProgressPercent(item, now = Date.now()) {
  const saved = getSavedAmount(item, now)
  const target = item.replacementPrice || item.priceRub || 1
  return Math.min(100, Math.floor((saved / target) * 100))
}

// --- Inventory item factory ---

export function createInventoryItems(set) {
  return set.items.map((item) => {
    const base = {
      id: `inv-${item.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      setItemId: item.id,
      setId: set.id,
      categorySlug: set.categorySlug,
      name: item.name,
      emoji: item.emoji,
      amortizationType: item.amortizationType,
      status: 'pending',
      activatedAt: null,
      lastPurchasedAt: null,
      priceRub: item.priceRub,
      weeklyCostRub: item.weeklyCostRub,
    }

    if (item.amortizationType === 'consumable') {
      const daysPerPackage = Math.ceil(
        item.packageSize /
          (item.consumptionRate / (item.consumptionPeriod === 'daily' ? 1 : 7))
      )
      return {
        ...base,
        consumptionDays: daysPerPackage,
        totalDays: daysPerPackage,
        packageSize: item.packageSize,
        currentAmount: item.packageSize,
        unit: item.consumptionUnit,
      }
    } else {
      const serviceLifeDays = item.serviceLifeMonths
        ? item.serviceLifeMonths * 30
        : (item.serviceLifeYears || 1) * 365
      const serviceLifeWeeks = item.serviceLifeMonths
        ? item.serviceLifeMonths * 4
        : (item.serviceLifeYears || 1) * 52
      return {
        ...base,
        serviceLifeDays,
        totalDays: serviceLifeDays,
        serviceLifeWeeks,
        replacementPrice: item.priceRub,
      }
    }
  })
}
