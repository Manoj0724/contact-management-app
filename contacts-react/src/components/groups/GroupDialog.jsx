import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { createGroup, updateGroup } from '@/services/api'
import { toast } from 'sonner'

const COLORS = [
  '#3b82f6','#10b981','#f59e0b','#8b5cf6',
  '#ef4444','#f97316','#64748b','#ec4899',
]

const ICONS = [
  { id: 'briefcase', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { id: 'family',    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'friends',   svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  { id: 'office',    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 3v18M2 9h6M2 15h6"/></svg> },
  { id: 'school',    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
  { id: 'sports',    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M9.17 14.83l-4.24 4.24"/></svg> },
  { id: 'food',      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { id: 'medical',   svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M12 8v8M8 12h8"/></svg> },
  { id: 'star',      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { id: 'heart',     svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { id: 'home',      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: 'phone',     svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.77-1.77a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
]

export default function GroupDialog({ open, group, onClose, onSave }) {
  const [name, setName]       = useState('')
  const [color, setColor]     = useState(COLORS[0])
  const [icon, setIcon]       = useState(ICONS[0].id)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(group?.name ?? '')
      setColor(group?.color ?? COLORS[0])
      setIcon(group?.icon ?? ICONS[0].id)
    }
  }, [open, group])

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Group name is required')
    setLoading(true)
    try {
      const payload = { name: name.trim(), color, icon }
      if (group) await updateGroup(group._id, payload)
      else       await createGroup(payload)
      toast.success(group ? 'Group updated!' : 'Group created!')
      onSave()   // notify parent to refresh groups list — no args needed
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group')
    } finally {
      setLoading(false)
    }
  }

  const selectedIcon = ICONS.find(i => i.id === icon) || ICONS[0]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: color + '22', color }}
          >
            {selectedIcon.svg}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">
              {group ? 'Edit Group' : 'Create New Group'}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Organize your contacts into groups</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              GROUP NAME <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <input
                value={name}
                onChange={e => setName(e.target.value.slice(0, 50))}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="e.g. Work, Family, Friends..."
                autoFocus
                className="w-full pl-8 pr-16 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-400 bg-slate-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">COLOR</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                    transform: color === c ? 'scale(1.1)' : undefined,
                  }}
                >
                  {color === c && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-4 h-4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">ICON</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic.id}
                  onClick={() => setIcon(ic.id)}
                  className="aspect-square rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{
                    background: icon === ic.id ? color : '#f1f5f9',
                    color:      icon === ic.id ? 'white' : '#64748b',
                  }}
                >
                  {ic.svg}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">PREVIEW</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: color + '22', color }}
              >
                <div className="scale-75">{selectedIcon.svg}</div>
              </div>
              <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                {name || 'Group Name'}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                style={{ background: color }}
              >
                0
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={15} />
                  {group ? 'Save Changes' : 'Create Group'}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
