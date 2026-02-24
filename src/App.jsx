import { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Onboarding from './components/Onboarding'
import Layout from './components/Layout'

function ProfileStub() {
  const profile = (() => {
    try {
      return JSON.parse(localStorage.getItem('userProfile'))
    } catch {
      return null
    }
  })()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        color: 'var(--accent)',
        fontSize: '1.8rem',
        marginBottom: '0.75rem',
      }}>
        {profile?.profile?.name ? `Привет, ${profile.profile.name}!` : 'Профиль'}
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        В разработке
      </p>
      <button
        onClick={() => {
          localStorage.removeItem('userProfile')
          localStorage.removeItem('tempOnboarding')
          window.location.reload()
        }}
        style={{
          padding: '0.5rem 1.5rem',
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          borderRadius: '6px',
          fontSize: '0.85rem',
        }}
      >
        Сбросить данные
      </button>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState(null)

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('userProfile'))
      if (profile?.onboardingCompleted) {
        setScreen('profile')
        return
      }
    } catch {}
    setScreen('landing')
  }, [])

  if (screen === null) return null

  return (
    <Layout>
      {screen === 'landing' && <Landing onStart={() => setScreen('onboarding')} />}
      {screen === 'onboarding' && <Onboarding onComplete={() => setScreen('profile')} />}
      {screen === 'profile' && <ProfileStub />}
    </Layout>
  )
}

export default App
