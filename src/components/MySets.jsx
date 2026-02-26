import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import SetCreatorModal from './SetCreatorModal'

function getUser() {
  try { return JSON.parse(localStorage.getItem('currentUser')) } catch { return null }
}
function saveUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user))
}
function getSharedSets() {
  try { return JSON.parse(localStorage.getItem('sharedSets')) || {} } catch { return {} }
}
function saveSharedSets(shared) {
  localStorage.setItem('sharedSets', JSON.stringify(shared))
}

function MySets() {
  const navigate = useNavigate()
  const [mySets, setMySets] = useState(() => getUser()?.mySets || [])
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [editingSet, setEditingSet] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const persistSets = (updated) => {
    const user = getUser()
    if (!user) return
    user.mySets = updated
    saveUser(user)
    setMySets([...updated])
  }

  const handleSave = (setData) => {
    if (editingSet) {
      const merged = { ...editingSet, ...setData }
      persistSets(mySets.map((s) => (s.id === editingSet.id ? merged : s)))
      if (editingSet.isPublic) {
        const shared = getSharedSets()
        shared[editingSet.shareId] = merged
        saveSharedSets(shared)
      }
    } else {
      const newSet = {
        ...setData,
        id: `my-set-${Date.now()}`,
        shareId: Math.random().toString(36).substring(2, 10),
        isPublic: false,
        createdAt: new Date().toISOString(),
        authorName: getUser()?.profile?.name || 'Пользователь',
        copiesCount: 0,
      }
      persistSets([...mySets, newSet])
    }
    setCreatorOpen(false)
    setEditingSet(null)
  }

  const handleTogglePublic = (setId, isPublic) => {
    const set = mySets.find((s) => s.id === setId)
    if (!set) return
    const merged = { ...set, isPublic }
    persistSets(mySets.map((s) => (s.id === setId ? merged : s)))
    const shared = getSharedSets()
    if (isPublic) {
      shared[set.shareId] = merged
    } else {
      delete shared[set.shareId]
    }
    saveSharedSets(shared)
  }

  const handleDelete = (setId) => {
    const set = mySets.find((s) => s.id === setId)
    if (set?.isPublic) {
      const shared = getSharedSets()
      delete shared[set.shareId]
      saveSharedSets(shared)
    }
    persistSets(mySets.filter((s) => s.id !== setId))
  }

  const handleCopyLink = (set) => {
    const url = `${window.location.origin}/shared/${set.shareId}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiedId(set.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openCreate = () => { setEditingSet(null); setCreatorOpen(true) }
  const openEdit = (set) => { setEditingSet(set); setCreatorOpen(true) }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700 }}>
            Мои наборы
            {mySets.length > 0 && (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'sans-serif', fontWeight: 400, marginLeft: '0.75rem' }}>
                {mySets.length}
              </span>
            )}
          </h1>
          <button
            onClick={openCreate}
            style={{
              padding: '0.55rem 1.1rem',
              background: 'var(--accent)',
              color: '#0f0f0f',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Создать набор
          </button>
        </div>

        {mySets.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              У вас пока нет своих наборов
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.82rem', opacity: 0.7 }}>
              Создайте набор из своих позиций или скопируйте публичный по ссылке
            </p>
            <button
              onClick={openCreate}
              style={{
                padding: '0.65rem 1.5rem',
                background: 'var(--accent)',
                color: '#0f0f0f',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Создать первый набор
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {mySets.map((set) => (
              <MySetCard
                key={set.id}
                set={set}
                isCopied={copiedId === set.id}
                onNavigate={() => navigate(`/my-sets/${set.id}`)}
                onEdit={() => openEdit(set)}
                onDelete={() => handleDelete(set.id)}
                onTogglePublic={(v) => handleTogglePublic(set.id, v)}
                onCopyLink={() => handleCopyLink(set)}
              />
            ))}
          </div>
        )}
      </div>

      {creatorOpen && (
        <SetCreatorModal
          initialSet={editingSet}
          onClose={() => { setCreatorOpen(false); setEditingSet(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function MySetCard({ set, isCopied, onNavigate, onEdit, onDelete, onTogglePublic, onCopyLink }) {
  return (
    <div
      onClick={onNavigate}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>{set.name}</h3>
        {set.isPublic && (
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 600,
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            padding: '0.15rem 0.45rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Публичный
          </span>
        )}
      </div>

      {set.description && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.4 }}>
          {set.description}
        </p>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{set.items.length} позиций</span>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
          {set.monthlyBudget.toLocaleString('ru-RU')} ₽/мес
        </span>
      </div>

      {/* Items preview */}
      <div style={{
        background: 'var(--surface-light)',
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}>
        {set.items.slice(0, 3).map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>{item.emoji} {item.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>{item.weeklyCostRub || 0} ₽/нед</span>
          </div>
        ))}
        {set.items.length > 3 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7 }}>
            + ещё {set.items.length - 3}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          style={outlineBtn()}
        >
          ✎ Изменить
        </button>
        <button
          onClick={() => onTogglePublic(!set.isPublic)}
          style={outlineBtn(set.isPublic ? 'var(--accent)' : undefined)}
        >
          {set.isPublic ? '🔒 Закрыть' : '🔗 Опубликовать'}
        </button>
        <button
          onClick={onDelete}
          style={{ ...outlineBtn(), color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
        >
          🗑
        </button>
      </div>

      {/* Share link */}
      {set.isPublic && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <span style={{
            flex: 1,
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            background: 'var(--surface-light)',
            padding: '0.4rem 0.6rem',
            borderRadius: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            /shared/{set.shareId}
          </span>
          <button
            onClick={onCopyLink}
            style={{
              padding: '0.4rem 0.75rem',
              background: isCopied ? 'var(--accent)' : 'transparent',
              color: isCopied ? '#0f0f0f' : 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {isCopied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>
      )}

      {set.copiesCount > 0 && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7, textAlign: 'right', margin: '-0.25rem 0 0' }}>
          Скопирован {set.copiesCount} {pluralTimes(set.copiesCount)}
        </p>
      )}
    </div>
  )
}

function outlineBtn(color) {
  return {
    padding: '0.38rem 0.7rem',
    background: 'transparent',
    border: `1px solid ${color || 'var(--border)'}`,
    borderRadius: '6px',
    color: color || 'var(--text-muted)',
    fontSize: '0.78rem',
    cursor: 'pointer',
  }
}

function pluralTimes(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'раз'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'раза'
  return 'раз'
}

export default MySets
