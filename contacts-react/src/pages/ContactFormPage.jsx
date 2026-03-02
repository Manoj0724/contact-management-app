import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, User, Phone, MapPin } from 'lucide-react'
import { getContact, createContact, updateContact, getGroups } from '@/services/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const TITLES = ['Mr', 'Mrs', 'Ms', 'Dr']

const INIT = { title: '', firstName: '', lastName: '', mobile1: '', mobile2: '', city: '', state: '', pincode: '', groups: [] }

const VALIDATE = {
  title:     v => !v                   ? 'Required' : '',
  firstName: v => !v.trim()            ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  lastName:  v => !v.trim()            ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  mobile1:   v => !v                   ? 'Required' : !/^\d{10}$/.test(v) ? 'Must be 10 digits' : '',
  mobile2:   v => v && !/^\d{10}$/.test(v) ? 'Must be 10 digits' : '',
  city:      v => !v.trim()            ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  state:     v => !v.trim()            ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  pincode:   v => !v                   ? 'Required' : !/^\d{6}$/.test(v) ? 'Must be 6 digits' : '',
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Card({ icon, iconBg, iconColor, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

export default function ContactFormPage() {
  const navigate    = useNavigate()
  const { id }      = useParams()
  const isEdit      = !!id

  const [form, setForm]         = useState(INIT)
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [groups, setGroups]     = useState([])

  useEffect(() => {
    if (!isEdit) return
    setFetching(true)
    getContact(id)
      .then(r => {
        const c = r.data
        setForm({
          title:     c.title || '',
          firstName: c.firstName || '',
          lastName:  c.lastName || '',
          mobile1:   c.mobile1 || '',
          mobile2:   c.mobile2 || '',
          city:      c.address?.city || '',
          state:     c.address?.state || '',
          pincode:   c.address?.pincode || '',
          groups:    (c.groups || []).map(g => typeof g === 'object' ? g._id : g),
        })
      })
      .catch(() => { toast.error('Contact not found'); navigate('/contacts') })
      .finally(() => setFetching(false))
  }, [id, isEdit, navigate])

  useEffect(() => {
    getGroups().then(r => setGroups(r.data.groups || [])).catch(() => {})
  }, [])

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    Object.entries(VALIDATE).forEach(([f, fn]) => { const e = fn(form[f] || ''); if (e) errs[f] = e })
    setErrors(errs)
    return !Object.keys(errs).length
  }

  const toggleGroup = gid =>
    setForm(f => ({ ...f, groups: f.groups.includes(gid) ? f.groups.filter(x => x !== gid) : [...f.groups, gid] }))

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix the errors below'); return }
    setLoading(true)
    const payload = {
      title:     form.title,
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      mobile1:   form.mobile1,
      mobile2:   form.mobile2 || undefined,
      address: { city: form.city.trim(), state: form.state.trim(), pincode: form.pincode },
      groups:    form.groups,
    }
    try {
      if (isEdit) { await updateContact(id, payload); toast.success('Contact updated!') }
      else { await createContact(payload); toast.success('Contact created!') }
      navigate('/contacts')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save')
    } finally { setLoading(false) }
  }

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 p-4 sm:p-0">
        <div className="flex items-center gap-3">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="skeleton h-7 w-40 rounded" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const err = f => errors[f] ? 'border-red-300 focus-visible:ring-red-400' : ''

  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <button onClick={() => navigate('/contacts')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-700 cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">{isEdit ? 'Edit Contact' : 'New Contact'}</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {isEdit ? 'Update contact details below' : 'Fill in the details to create a new contact'}
          </p>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── Personal Info ── */}
        <Card icon={<User size={14} />} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Title buttons */}
            <div className="sm:col-span-2">
              <Field label="Title" required error={errors.title}>
                <div className="flex gap-2 flex-wrap">
                  {TITLES.map(t => (
                    <button key={t} type="button" onClick={() => set('title', form.title === t ? '' : t)}
                      title={`Select ${t}`}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        form.title === t
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* First Name */}
            <Field label="First Name" required error={errors.firstName}>
              <Input
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="First Name"
                className={`cursor-text ${err('firstName')}`}
              />
            </Field>

            {/* Last Name */}
            <Field label="Last Name" required error={errors.lastName}>
              <Input
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="Last Name"
                className={`cursor-text ${err('lastName')}`}
              />
            </Field>
          </div>
        </Card>

        {/* ── Phone ── */}
        <Card icon={<Phone size={14} />} iconBg="bg-emerald-100" iconColor="text-emerald-600" title="Phone Numbers">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primary Mobile" required error={errors.mobile1}>
              <Input
                value={form.mobile1}
                onChange={e => set('mobile1', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Phone 1"
                maxLength={10}
                inputMode="numeric"
                className={`cursor-text ${err('mobile1')}`}
              />
            </Field>
            <Field label="Alternate Mobile" error={errors.mobile2}>
              <Input
                value={form.mobile2}
                onChange={e => set('mobile2', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Phone 2"
                maxLength={10}
                inputMode="numeric"
                className={`cursor-text ${err('mobile2')}`}
              />
            </Field>
          </div>
        </Card>

        {/* ── Address ── */}
        <Card icon={<MapPin size={14} />} iconBg="bg-violet-100" iconColor="text-violet-600" title="Address">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" required error={errors.city}>
              <Input
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="City"
                className={`cursor-text ${err('city')}`}
              />
            </Field>
            <Field label="State" required error={errors.state}>
              <Input
                value={form.state}
                onChange={e => set('state', e.target.value)}
                placeholder="State"
                className={`cursor-text ${err('state')}`}
              />
            </Field>
            <Field label="Pincode" required error={errors.pincode}>
              <Input
                value={form.pincode}
                onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Pincode"
                maxLength={6}
                inputMode="numeric"
                className={`cursor-text ${err('pincode')}`}
              />
            </Field>
          </div>
        </Card>

        {/* ── Groups ── */}
        {groups.length > 0 && (
          <Card
            icon={<span className="text-amber-600 font-bold text-xs">G</span>}
            iconBg="bg-amber-100" iconColor="" title="Assign to Groups">
            <div className="flex flex-wrap gap-2">
              {groups.map(g => {
                const active = form.groups.includes(g._id)
                return (
                  <button key={g._id} type="button" onClick={() => toggleGroup(g._id)}
                    title={active ? `Remove from ${g.name}` : `Add to ${g.name}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                      active ? 'text-white shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    style={active ? { background: g.color, borderColor: g.color } : {}}>
                    <span className="w-2 h-2 rounded-full" style={{ background: active ? 'rgba(255,255,255,0.5)' : g.color }} />
                    {g.name}
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-4">
          <Button variant="outline" onClick={() => navigate('/contacts')} disabled={loading}
            className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-36 cursor-pointer">
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Save size={14} /> {isEdit ? 'Save Changes' : 'Create Contact'}</>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}