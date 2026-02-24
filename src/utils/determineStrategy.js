// Strategy data matches strategies.json from GitHub
const STRATEGIES = {
  debt: {
    id: 'debt',
    name: '🔥 Сначала долги',
    description: 'Пока есть дорогие кредиты, инвестиции подождут.',
    longDescription: 'Весь свободный поток направляем на досрочное погашение самого дорогого кредита.',
  },
  cushion: {
    id: 'cushion',
    name: '🛡️ Подушка безопасности',
    description: 'Сначала 3 месяца расходов в запасе.',
    longDescription: 'Накопим подушку, а потом запустим инвестиционное ядро.',
  },
  growth: {
    id: 'growth',
    name: '📈 Стратегия роста',
    description: 'Фокус на доходе и базовых привычках.',
    longDescription: 'Сейчас главное — увеличить доход и заложить привычку копить.',
  },
  optimization: {
    id: 'optimization',
    name: '⚙️ Стратегия оптимизации',
    description: 'Баланс между жизнью и капиталом.',
    longDescription: 'Smart-наборы систематизируют расходы, ядро копит на будущее.',
  },
  capital: {
    id: 'capital',
    name: '💎 Стратегия капитала',
    description: 'Максимизация ядра.',
    longDescription: 'Smart-расходы зафиксированы, всё сверх — в инвестиции.',
  },
}

function determineStrategy(monthlyIncome, monthlyHousing, monthlyOther, capitalAmount) {
  const freeFlow = monthlyIncome - monthlyHousing - monthlyOther
  const hasCapital = capitalAmount > 0

  if (freeFlow <= 0) {
    return STRATEGIES.debt
  }

  if (!hasCapital && freeFlow < monthlyIncome * 0.2) {
    return STRATEGIES.cushion
  }

  if (monthlyIncome < 55000) {
    return STRATEGIES.growth
  }

  if (monthlyIncome <= 75000) {
    return STRATEGIES.optimization
  }

  if (hasCapital) {
    return STRATEGIES.capital
  }

  return STRATEGIES.optimization
}

export default determineStrategy
