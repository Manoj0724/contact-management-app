import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, X, User, Phone, MapPin, Tag } from 'lucide-react'
import { createContact, updateContact, getContact, getGroups } from '@/services/api'
import { toast } from 'sonner'

const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']
const EMPTY_FORM = {
  title: '', firstName: '', lastName: '',
  mobile1: '', mobile2: '', email: '',
  address: { street: '', city: '', state: '', pincode: '', country: '' },
  groupIds: []
}

export default function ContactFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => { setForm(EMPTY_FORM); setErrors({}) }, [location.pathname])
  useEffect(() => { getGroups().then(r => setGroups(r.data.groups || r.data || [])).catch(() => {}) }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    setFetching(true)
    getContact(id).then(r => {
      const c = r.data.contact || r.data
      setForm({
        title: c.title || '', firstName: c.firstName || '', lastName: c.lastName || '',
        mobile1: c.mobile1 || '', mobile2: c.mobile2 || '', email: c.email || '',
        address: { street: c.address?.street || '', city: c.address?.city || '', state: c.address?.state || '', pincode: c.address?.pincode || '', country: c.address?.country || '' },
        groupIds: c.groupIds || []
      })
    }).catch(() => toast.error('Failed to load contact')).finally(() => setFetching(false))
  }, [id, isEdit])

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))
  const setAddr = (field, val) => setForm(p => ({ ...p, address: { ...p.address, [field]: val } }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.mobile1 || !/^\d{10}$/.test(form.mobile1)) e.mobile1 = 'Must be 10 digits'
    if (form.mobile2 && !/^\d{10}$/.test(form.mobile2)) e.mobile2 = 'Must be 10 digits'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit) { await updateContact(id, form); toast.success('Contact updated!') }
      else { await createContact(form); toast.success('Contact created!') }
      navigate('/contacts')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact')
    } finally { setLoading(false) }
  }

  const toggleGroup = (gid) => set('groupIds', form.groupIds.includes(gid) ? form.groupIds.filter(x => x !== gid) : [...form.groupIds, gid])
  const inp = (err) => `w-full px-4 py-3 text-sm border rounded-lg outline-none transition-colors placeholder-slate-400 text-slate-700 ${err ? 'border-red-300 focus:border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit Contact' : 'Add Contact'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isEdit ? 'Update the contact details below' : 'Fill in the contact details below'}</p>
        </div>
        <button onClick={() => navigate('/contacts')} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm">
          <ArrowLeft size={15} /> Back to Contacts
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-blue-800 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-bold">{isEdit ? 'Update Contact Information' : 'Contact Information'}</h2>
            <p className="text-blue-200 text-sm mt-1">All fields marked with * are required</p>
          </div>
          <div className="text-blue-300">
            {isEdit
              ? <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              : <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Personal Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Personal Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Title</label>
                <div className="relative">
                  <select value={form.title} onChange={e => set('title', e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 appearance-none bg-white text-slate-700">
                    <option value="">Select</option>
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">First Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First Name *" className={`${inp(errors.firstName)} pl-9`} />
                </div>
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Last Name *</label>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last Name *" className={inp(errors.lastName)} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Phone size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Mobile 1 *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.mobile1} onChange={e => set('mobile1', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile *" className={`${inp(errors.mobile1)} pl-9`} />
                </div>
                {errors.mobile1 && <p className="text-xs text-red-500 mt-1">{errors.mobile1}</p>}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Mobile 2 (Optional)</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={form.mobile2} onChange={e => set('mobile2', e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Alternate number" className={`${inp(errors.mobile2)} pl-9`} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">Email (Optional)</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" type="email" className={inp(errors.email)} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={15} className="text-red-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs text-slate-500 mb-1.5">Street</label>
                <input value={form.address.street} onChange={e => setAddr('street', e.target.value)} placeholder="Street address" className={inp()} />
              </div>
              {[['city','City'],['state','State'],['pincode','Pincode'],['country','Country']].map(([f,l]) => (
                <div key={f}>
                  <label className="block text-xs text-slate-500 mb-1.5">{l}</label>
                  <input value={form.address[f]} onChange={e => setAddr(f, e.target.value)} placeholder={l} className={inp()} />
                </div>
              ))}
            </div>
          </div>

          {/* Groups */}
          {groups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Tag size={15} className="text-yellow-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign to Groups</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {groups.map(g => (
                  <button key={g._id} type="button" onClick={() => toggleGroup(g._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${form.groupIds.includes(g._id) ? 'border-transparent text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}
                    style={form.groupIds.includes(g._id) ? { background: g.color || '#3b82f6' } : {}}>
                    <span className="w-2 h-2 rounded-full" style={{ background: g.color || '#3b82f6' }} />
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 md:px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={() => navigate('/contacts')} className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-colors">
            <X size={15} /> Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
            <Save size={15} />
            {loading ? 'Saving...' : isEdit ? 'Update Contact' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}
