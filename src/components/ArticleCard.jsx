import { useNavigate } from 'react-router-dom'

function ArticleCard({ article }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/article/${article.id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'inline-block',
        background: 'var(--accent-dim)',
        color: 'var(--accent)',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '0.2rem 0.55rem',
        borderRadius: '4px',
        marginBottom: '0.75rem',
        alignSelf: 'flex-start',
      }}>
        {article.category}
      </div>

      <h3 style={{
        fontSize: '0.95rem',
        fontWeight: 600,
        lineHeight: 1.4,
        marginBottom: '0.5rem',
        flex: 1,
      }}>
        {article.title}
      </h3>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        lineHeight: 1.5,
        marginBottom: '1rem',
      }}>
        {article.description}
      </p>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
      }}>
        <span>{article.readTime} мин</span>
        <span>·</span>
        <span>{article.views.toLocaleString('ru-RU')} просм.</span>
      </div>
    </div>
  )
}

export default ArticleCard
