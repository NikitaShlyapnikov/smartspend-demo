function ArticleListItem({ article, index }) {
  return (
    <div
      onClick={() => alert(`${article.title}\n\nСтатья в разработке`)}
      onMouseEnter={(e) => {
        e.currentTarget.querySelector('.list-item-title').style.color = 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.querySelector('.list-item-title').style.color = 'var(--text)'
      }}
      style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }}
    >
      <span style={{
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        minWidth: '1.6rem',
        paddingTop: '2px',
        opacity: 0.5,
      }}>
        {String(index).padStart(2, '0')}
      </span>

      <div style={{ flex: 1 }}>
        <h3
          className="list-item-title"
          style={{
            fontSize: '0.92rem',
            fontWeight: 500,
            lineHeight: 1.4,
            marginBottom: '0.35rem',
            transition: 'color 0.15s',
          }}
        >
          {article.title}
        </h3>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            color: 'var(--accent)',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}>
            {article.category}
          </span>
          <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>·</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {article.readTime} мин · {article.views.toLocaleString('ru-RU')} просм.
          </span>
        </div>
      </div>
    </div>
  )
}

export default ArticleListItem
