import { useNavigate, useLocation } from 'react-router-dom'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}

const TABS = [
  { path: '/feed',      label: 'Лента' },
  { path: '/inventory', label: 'Инвентарь' },
  { path: '/catalog',   label: 'Каталог' },
]

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()
  const initial = user?.profile?.name?.[0]?.toUpperCase() || 'А'

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/login')
  }

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 2rem',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      background: 'var(--bg)',
      zIndex: 10,
      gap: '1rem',
    }}>
      {/* Logo */}
      <span
        onClick={() => navigate('/feed')}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.1rem',
          color: 'var(--accent)',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        SmartSpend
      </span>

      {/* Tab navigation */}
      <nav style={{
        display: 'flex',
        gap: '2px',
        background: 'var(--surface)',
        borderRadius: '8px',
        padding: '3px',
      }}>
        {TABS.map(({ path, label }) => {
          const isActive = location.pathname === path ||
            (path !== '/feed' && location.pathname.startsWith(path))
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                padding: '0.38rem 0.9rem',
                borderRadius: '6px',
                border: 'none',
                background: isActive ? 'var(--surface-light)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {/* Right side: avatar + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/profile')}
          title="Профиль"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initial}
        </button>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Выйти
        </button>
      </div>
    </header>
  )
}

export default Navbar
