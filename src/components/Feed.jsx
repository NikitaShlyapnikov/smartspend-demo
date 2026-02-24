import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ArticleCard from './ArticleCard'
import ArticleListItem from './ArticleListItem'
import { STRATEGIES } from '../utils/determineStrategy'

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

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/login')
  }

  const userStrategy = currentUser?.profile?.strategy
  const userName = currentUser?.profile?.name || 'Пользователь'
  const strategyObj = userStrategy ? STRATEGIES[userStrategy] : null

  const recommended = userStrategy
    ? articles.filter((a) => a.strategyTags.includes(userStrategy))
    : []

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Sticky header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.1rem 2rem',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10,
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.15rem',
          color: 'var(--accent)',
          fontWeight: 700,
        }}>
          SmartSpend
        </span>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link
            to="/profile"
            style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}
          >
            Профиль
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
            }}
          >
            Выйти
          </button>
        </nav>
      </header>

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

        {/* Zone 1: Events stub */}
        <section style={{ marginBottom: '3rem' }}>
          <SectionLabel>Ваши события</SectionLabel>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              ✨ Скоро здесь появятся напоминания из инвентаря
            </p>
          </div>
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
