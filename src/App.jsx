import { useState, useEffect } from 'react'
import Landing from './components/Landing'
import Onboarding from './components/Onboarding'
import Profile from './components/Profile'
import Layout from './components/Layout'

function App() {
  const [screen, setScreen] = useState(null)
  const [profileData, setProfileData] = useState(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('userProfile'))
      if (saved?.onboardingCompleted) {
        setProfileData(saved)
        setScreen('profile')
        return
      }
    } catch {}
    setScreen('landing')
  }, [])

  const handleOnboardingComplete = (data) => {
    localStorage.setItem('userProfile', JSON.stringify(data))
    setProfileData(data)
    setScreen('profile')
  }

  const handleReset = () => {
    localStorage.removeItem('userProfile')
    localStorage.removeItem('tempOnboarding')
    setProfileData(null)
    setScreen('landing')
  }

  if (screen === null) return null

  return (
    <Layout>
      {screen === 'landing' && <Landing onStart={() => setScreen('onboarding')} />}
      {screen === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      {screen === 'profile' && <Profile profileData={profileData} onReset={handleReset} />}
    </Layout>
  )
}

export default App
