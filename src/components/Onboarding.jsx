import { useState, useEffect } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'
import determineStrategy from '../utils/determineStrategy'

const QUESTIONS_URL =
  'https://raw.githubusercontent.com/NikitaShlyapnikov/smartspend-demo-data/0d64a694c3d1271194e0307438efca7050a9b51f/questions.json'

function Onboarding({ onComplete }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useLocalStorage('tempOnboarding', {})
  const [currentValue, setCurrentValue] = useState('')

  useEffect(() => {
    fetch(QUESTIONS_URL)
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((data) => {
        setQuestions(data.questions)
        setLoading(false)

        // Restore step from saved answers
        const saved = JSON.parse(localStorage.getItem('tempOnboarding') || '{}')
        const savedCount = Object.keys(saved).length
        if (savedCount > 0) {
          const resumeStep = Math.min(savedCount, data.questions.length - 1)
          setStep(resumeStep)
          setCurrentValue(saved[data.questions[resumeStep]?.id] ?? '')
        }
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  // Sync input when step changes
  useEffect(() => {
    if (questions.length > 0) {
      const saved = JSON.parse(localStorage.getItem('tempOnboarding') || '{}')
      setCurrentValue(saved[questions[step]?.id] ?? '')
    }
  }, [step, questions])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Ошибка загрузки, попробуйте позже</p>
      </div>
    )
  }

  if (!questions.length) return null

  const q = questions[step]
  const isLast = step === questions.length - 1
  const canProceed = q.optional || currentValue.trim() !== ''

  const saveCurrentAndAdvance = (nextStep) => {
    const updated = { ...answers, [q.id]: currentValue }
    setAnswers(updated)

    if (nextStep === null) {
      const income = Number(updated.income) || 0
      const housing = Number(updated.housing) || 0
      const other = Number(updated.other) || 0
      const capital = Number(updated.capital) || 0

      const profileData = {
        name: updated.name || '',
        monthlyIncome: income,
        monthlyHousing: housing,
        monthlyOther: other,
        capitalAmount: capital,
        strategy: determineStrategy(income, housing, other, capital),
        onboardingCompleted: true,
      }
      localStorage.removeItem('tempOnboarding')
      onComplete(profileData)
    } else {
      setStep(nextStep)
    }
  }

  const handleNext = () => {
    if (!canProceed) return
    saveCurrentAndAdvance(isLast ? null : step + 1)
  }

  const handleBack = () => {
    saveCurrentAndAdvance(step - 1)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
    }}>
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '420px', marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          marginBottom: '0.5rem',
        }}>
          <span>Шаг {step + 1} из {questions.length}</span>
        </div>
        <div style={{ height: '3px', background: 'var(--surface-light)', borderRadius: '2px' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / questions.length) * 100}%`,
            background: 'var(--accent)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '2rem',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.35rem',
          fontWeight: 600,
          marginBottom: q.subtext ? '0.4rem' : '1.5rem',
          lineHeight: 1.3,
        }}>
          {q.question}
        </h2>

        {q.subtext && (
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.83rem',
            marginBottom: '1.5rem',
            lineHeight: 1.4,
          }}>
            {q.subtext}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            autoFocus
            type={q.type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder={q.placeholder}
            onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
            style={{
              flex: 1,
              background: 'var(--surface-light)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: 'var(--text)',
              fontSize: '1rem',
            }}
          />
          {q.suffix && (
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', userSelect: 'none' }}>
              {q.suffix}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          {step > 0 && (
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Назад
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="btn-accent"
            style={{ flex: 1, opacity: canProceed ? 1 : 0.35, cursor: canProceed ? 'pointer' : 'default' }}
          >
            {isLast ? 'Завершить' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
