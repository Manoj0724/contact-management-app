import { useState, useEffect } from 'react'
import { X, Filter, ChevronDown, ChevronUp, Mail, Phone, MapPin, Users, Check } from 'lucide-react'
import { getGroups } from '@/services/api'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu and Kashmir','Ladakh','Puducherry'
]

export default function AdvancedSearch({ filters, onChange, onClose }) {
  const [groups, setGroups]       = useState([])
  const [expanded, setExpanded]   = useState(true)
  const [local, setLocal]         = useState({
    city:       filters.city || '',
    state:      filters.state || '',
    groupId:    filters.groupId || '',
    hasEmail:   filters.hasEmail || false,
    hasMobile2: filters.hasMobile2 || false,
    isFavorite: filters.isFavorite || false,
    hasPhoto:   filters.hasPhoto || false,
    title:      filters.title || '',
  })

  useEffect(() => {
    getGroups().then(r => setGroups(r.data.groups || [])).catch(() => {})
  }, [])

  const set = (key, val) => setLocal(p => ({ ...p, [key]: val }))

  const activeCount = Object.entries(local).filter(([k, v]) =>
    v !== '' && v !== false
  ).length

  const handleApply = () => { onChange(local); onClose() }

  const handleReset = () => {
    const empty = { city:'', state:'', groupId:'', hasEmail:false, hasMobile2:false, isFavorite:false, hasPhoto:false, title:'' }
    setLocal(empty)
    onChange(empty)
    onClose()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <Filter size={13} className="text-blue-600" />
          </div>
          <span className="text-sm font-bold text-slate-700">Advanced Filters</span>
          {activeCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={handleReset}
              className="text-xs text-red-500 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
              Clear all
            </button>
          )}
          <button onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Title filter */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Title</p>
          <div className="flex gap-2 flex-wrap">
            {['', 'Mr', 'Mrs', 'Ms', 'Dr'].map(t => (
              <button key={t} onClick={() => set('title', t)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  local.title === t
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300'
                }`}>
                {t === '' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Group filter */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Users size={11}/> Group
          </p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => set('groupId', '')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                local.groupId === '' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-blue-300'
              }`}>
              All Groups
            </button>
            {groups.map(g => (
              <button key={g._id} onClick={() => set('groupId', local.groupId === g._id ? '' : g._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  local.groupId === g._id ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                style={local.groupId === g._id ? { background: g.color, borderColor: g.color } : {}}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }}/>
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* State filter */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <MapPin size={11}/> State
          </p>
          <select
            value={local.state}
            onChange={e => set('state', e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400">
            <option value="">All States</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* City filter */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <MapPin size={11}/> City
          </p>
          <input
            value={local.city}
            onChange={e => set('city', e.target.value)}
            placeholder="Type city name..."
            className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
          />
        </div>

        {/* Toggle filters */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Quick Filters</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key:'hasEmail',   label:'Has Email',     icon:<Mail size={12}/>,   color:'sky'    },
              { key:'hasMobile2', label:'Has Alt Mobile', icon:<Phone size={12}/>,  color:'emerald'},
              { key:'isFavorite', label:'Favorites Only', icon:'⭐',               color:'amber'  },
              { key:'hasPhoto',   label:'Has Photo',     icon:'📸',               color:'pink'   },
            ].map(f => (
              <button key={f.key} onClick={() => set(f.key, !local[f.key])}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  local[f.key]
                    ? `bg-${f.color}-50 border-${f.color}-300 text-${f.color}-700`
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                }`}>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  local[f.key] ? `bg-${f.color}-100` : 'bg-slate-100'
                }`}>
                  {typeof f.icon === 'string' ? <span className="text-[10px]">{f.icon}</span> : f.icon}
                </div>
                <span className="flex-1 text-left">{f.label}</span>
                {local[f.key] && <Check size={12} className={`text-${f.color}-600`}/>}
              </button>
            ))}
          </div>
        </div>

        {/* Apply button */}
        <button onClick={handleApply}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200">
          <Filter size={14}/> Apply Filters {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>
    </div>
  )
}