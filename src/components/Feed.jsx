import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import ArticleCard from './ArticleCard'
import ArticleListItem from './ArticleListItem'
import { STRATEGIES } from '../utils/determineStrategy'
import { getDaysLeft, getUrgencyStatus } from '../utils/inventoryUtils'

const ARTICLES_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/articles.json'

function Feed() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
  })()

  useEffect(() => {
    fetch(ARTICLES_URL)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => { setArticles(data.articles); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const userStrategy = currentUser?.profile?.strategy
  const userName = currentUser?.profile?.name || 'Пользователь'
  const strategyObj = userStrategy ? STRATEGIES[userStrategy] : null

  const recommended = userStrategy
    ? articles.filter((a) => a.strategyTags.includes(userStrategy))
    : []

  // Inventory notifications
  const inventory = currentUser?.inventory || []
  const notifications = inventory
    .filter((item) => item.status === 'active')
    .map((item) => {
      const daysLeft = getDaysLeft(item)
      const urgency = getUrgencyStatus(item)
      return { item, daysLeft, urgency }
    })
    .filter(({ urgency }) => ['danger', 'warn', 'empty', 'overuse'].includes(urgency))
    .sort((a, b) => {
      const order = { empty: 0, danger: 1, overuse: 2, warn: 3 }
      return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9)
    })

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Feed header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}>
            Привет, {userName}!
          </h1>
          {strategyObj && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              padding: '0.35rem 0.8rem',
              fontSize: '0.85rem',
              color: 'var(--accent)',
              fontWeight: 600,
            }}>
              {strategyObj.name}
            </div>
          )}
        </div>

        {/* Zone 1: Inventory notifications */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionLabel>Ваши события</SectionLabel>
          {notifications.length === 0 ? (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '1.5rem',
              textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {inventory.length === 0
                  ? '✨ Добавьте наборы из каталога — события появятся здесь'
                  : '✅ Всё в порядке — срочных событий нет'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notifications.map(({ item, daysLeft, urgency }) => {
                const cfg = NOTIF_CONFIG[urgency]
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate('/inventory')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: cfg.color, marginTop: '0.15rem' }}>
                        {cfg.message(daysLeft)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: cfg.color,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: '4px',
                      padding: '0.15rem 0.45rem',
                      whiteSpace: 'nowrap',
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {loading && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Загрузка...
          </p>
        )}
        {error && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Ошибка загрузки статей, попробуйте позже
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Zone 2: Recommended */}
            {recommended.length > 0 && (
              <section style={{ marginBottom: '3rem' }}>
                <SectionLabel>Рекомендовано для вас</SectionLabel>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
                  gap: '1rem',
                }}>
                  {recommended.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {/* Zone 3: All articles */}
            <section>
              <SectionLabel>Все статьи</SectionLabel>
              <div>
                {articles.map((article, i) => (
                  <ArticleListItem key={article.id} article={article} index={i + 1} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

const NOTIF_CONFIG = {
  empty: {
    label: 'Закончилось',
    color: '#ff7043',
    bg: 'rgba(255,112,67,0.08)',
    border: 'rgba(255,112,67,0.25)',
    message: () => 'Нужна покупка — запасы исчерпаны',
  },
  danger: {
    label: 'Срочно',
    color: '#ff6b6b',
    bg: 'rgba(255,107,107,0.08)',
    border: 'rgba(255,107,107,0.25)',
    message: (d) => d <= 0 ? 'Срок истекает сегодня' : `Осталось ${d} ${pluralDays(d)}`,
  },
  overuse: {
    label: 'Переэксплуатация',
    color: '#ce93d8',
    bg: 'rgba(156,39,176,0.08)',
    border: 'rgba(206,147,216,0.25)',
    message: (d) => `Срок истёк ${Math.abs(d)} ${pluralDays(Math.abs(d))} назад`,
  },
  warn: {
    label: 'Скоро',
    color: '#ffb347',
    bg: 'rgba(255,179,71,0.08)',
    border: 'rgba(255,179,71,0.25)',
    message: (d) => `Осталось ${d} ${pluralDays(d)}`,
  },
}

function pluralDays(n) {
  const abs = Math.abs(n)
  if (abs % 10 === 1 && abs % 100 !== 11) return 'день'
  if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20)) return 'дня'
  return 'дней'
}

function SectionLabel({ children }) {
  return (
    <h2 style={{
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: '1rem',
    }}>
      {children}
    </h2>
  )
}

export default Feed
