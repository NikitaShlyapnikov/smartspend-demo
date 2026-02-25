import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from './Navbar'
import { STRATEGIES } from '../utils/determineStrategy'

const ARTICLES_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/refs/heads/main/articles.json'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

function ArticlePage() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(ARTICLES_URL)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => {
        const found = data.articles.find((a) => a.id === articleId)
        setArticle(found || null)
        if (found) {
          const rel = data.articles
            .filter((a) => a.id !== found.id && a.strategyTags?.some((t) => found.strategyTags?.includes(t)))
            .slice(0, 3)
          setRelated(rel)
        }
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [articleId])

  const user = getUser()
  const userStrategy = user?.profile?.strategy

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      </div>
    )
  }
  if (error || !article) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>{error ? 'Ошибка загрузки' : 'Статья не найдена'}</p>
        <button
          onClick={() => navigate('/feed')}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ← Вернуться в ленту
        </button>
      </div>
    )
  }

  const isLong = (article.readTime || 0) >= 7
  const isRecommended = userStrategy && article.strategyTags?.includes(userStrategy)

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <Navbar />

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Breadcrumbs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link to="/feed" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Лента</Link>
          <span style={{ opacity: 0.5 }}>›</span>
          <span>{article.category}</span>
          <span style={{ opacity: 0.5 }}>›</span>
          <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
            {article.title}
          </span>
        </nav>

        {/* Article meta */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
          }}>
            {article.category}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            📖 {article.readTime} мин
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            👁 {(article.views || 0).toLocaleString('ru-RU')}
          </span>
          {article.featured && (
            <span style={{
              background: 'rgba(100,181,246,0.12)',
              color: '#64b5f6',
              border: '1px solid rgba(100,181,246,0.3)',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
            }}>
              Рекомендуем
            </span>
          )}
          {isRecommended && (
            <span style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
            }}>
              Для вашей стратегии
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isLong ? '2.4rem' : '2rem',
          fontWeight: 900,
          lineHeight: 1.15,
          marginBottom: '1rem',
          letterSpacing: '-0.01em',
        }}>
          {article.title}
        </h1>

        {/* Description / lead */}
        {article.description && (
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            borderLeft: '3px solid var(--accent)',
            paddingLeft: '1.25rem',
            marginBottom: '2.5rem',
          }}>
            {article.description}
          </p>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '2.5rem' }} />

        {/* Article content */}
        {article.content ? (
          <div
            className="article-body"
            style={contentStyle}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <div className="article-body" style={contentStyle}>
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Полный текст статьи скоро появится. Пока доступно краткое описание выше.
            </p>
          </div>
        )}

        {/* Strategy tags */}
        {article.strategyTags && article.strategyTags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Стратегии:</span>
            {article.strategyTags.map((tag) => {
              const s = STRATEGIES[tag]
              return s ? (
                <span key={tag} style={{
                  fontSize: '0.72rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '0.15rem 0.5rem',
                  color: 'var(--text-muted)',
                }}>
                  {s.name}
                </span>
              ) : null
            })}
          </div>
        )}

        {/* Related articles */}
        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
            }}>
              Читайте также
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {related.map((a, i) => (
                <Link
                  key={a.id}
                  to={`/article/${a.id}`}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    padding: '0.85rem 0',
                    borderBottom: i < related.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    color: 'var(--text)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.querySelector('.rel-title').style.color = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.querySelector('.rel-title').style.color = 'var(--text)'}
                >
                  <div style={{ flex: 1 }}>
                    <div className="rel-title" style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4, marginBottom: '0.25rem', transition: 'color 0.15s' }}>
                      {a.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{a.category}</span>
                      <span>·</span>
                      <span>{a.readTime} мин</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <div style={{ marginTop: '3rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            ← Вернуться в ленту
          </button>
        </div>
      </div>
    </div>
  )
}


// Injected via <style> tag once so article HTML content gets proper styling
const contentStyle = {
  fontSize: '1rem',
  lineHeight: 1.8,
  color: 'rgba(240, 237, 230, 0.85)',
}

export default ArticlePage
