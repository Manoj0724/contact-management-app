import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, User, Phone, MapPin, Mail, Camera, X, Upload } from 'lucide-react'
import { getContact, createContact, updateContact, getGroups } from '@/services/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getInitials, getAvatarColor } from '@/lib/utils'

const TITLES    = ['Mr', 'Mrs', 'Ms', 'Dr']
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CLOUD_NAME = 'root'
const UPLOAD_PRESET = 'contacts_photos'

const INIT = {
  title: '', firstName: '', lastName: '',
  mobile1: '', mobile2: '',
  personalEmail: '', workEmail: '',
  city: '', state: '', pincode: '',
  groups: [], photo: ''
}

const VALIDATE = {
  title:         v => !v ? 'Required' : '',
  firstName:     v => !v.trim() ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  lastName:      v => !v.trim() ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  mobile1:       v => !v ? 'Required' : !/^\d{10}$/.test(v) ? 'Must be 10 digits' : '',
  mobile2:       v => v && !/^\d{10}$/.test(v) ? 'Must be 10 digits' : '',
  personalEmail: v => v && !EMAIL_RE.test(v) ? 'Invalid email address' : '',
  workEmail:     v => v && !EMAIL_RE.test(v) ? 'Invalid email address' : '',
  city:          v => !v.trim() ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  state:         v => !v.trim() ? 'Required' : !/^[a-zA-Z\s]+$/.test(v) ? 'Letters only' : '',
  pincode:       v => !v ? 'Required' : !/^\d{6}$/.test(v) ? 'Must be 6 digits' : '',
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

function Card({ icon, iconBg, iconColor, title, badge, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <h2 className="text-sm font-semibold text-slate-700 flex-1">{title}</h2>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold">{badge}</span>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

// ─── Photo Upload Component ───────────────────────────────────────────────────
function PhotoUpload({ value, firstName, onChange }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image too large — max 5MB')

    setUploading(true)
    try {
      // Preview immediately
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', 'contacts')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.secure_url) {
        setPreview(data.secure_url)
        onChange(data.secure_url)
        toast.success('Photo uploaded!')
      } else {
        console.error('Cloudinary error:', JSON.stringify(data))
        toast.error(data.error?.message || 'Upload failed — check Cloudinary preset is set to Unsigned')
        setPreview(value || '')
      }
    } catch {
      toast.error('Upload failed')
      setPreview(value || '')
    } finally { setUploading(false) }
  }

  const removePhoto = () => { setPreview(''); onChange('') }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {/* Avatar / Photo */}
        <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-md ${!preview ? getAvatarColor(firstName || 'A') : ''}`}>
          {preview
            ? <img src={preview} alt="Contact" className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-2xl">{firstName ? firstName[0].toUpperCase() : '?'}</span>
          }
        </div>

        {/* Upload overlay */}
        <button type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          {uploading
            ? <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Camera size={20} className="text-white" />}
        </button>

        {/* Remove button */}
        {preview && !uploading && (
          <button type="button" onClick={removePhoto}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
            <X size={12} className="text-white" />
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />

      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors">
        {uploading
          ? <><span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Uploading...</>
          : <><Upload size={14} /> {preview ? 'Change Photo' : 'Upload Photo'}</>}
      </button>
      <p className="text-xs text-slate-400">JPG, PNG, WebP — max 5MB</p>
    </div>
  )
}

export default function ContactFormPage() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = !!id

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
          title:         c.title || '',
          firstName:     c.firstName || '',
          lastName:      c.lastName || '',
          mobile1:       c.mobile1 || '',
          mobile2:       c.mobile2 || '',
          personalEmail: c.email?.personal || '',
          workEmail:     c.email?.work || '',
          photo:         c.photo || '',
          city:          c.address?.city || '',
          state:         c.address?.state || '',
          pincode:       c.address?.pincode || '',
          groups:        (c.groups || []).map(g => typeof g === 'object' ? g._id : g),
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
      email: { personal: form.personalEmail.trim() || '', work: form.workEmail.trim() || '' },
      photo:     form.photo || '',
      address:   { city: form.city.trim(), state: form.state.trim(), pincode: form.pincode },
      groups:    form.groups,
    }
    try {
      if (isEdit) { await updateContact(id, payload); toast.success('Contact updated!') }
      else        { await createContact(payload);     toast.success('Contact created!') }
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

        {/* ── Photo ── */}
        <Card icon={<Camera size={14} />} iconBg="bg-pink-100" iconColor="text-pink-600" title="Profile Photo" badge="optional">
          <PhotoUpload
            value={form.photo}
            firstName={form.firstName}
            onChange={url => set('photo', url)}
          />
        </Card>

        {/* ── Personal Info ── */}
        <Card icon={<User size={14} />} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Title" required error={errors.title}>
                <div className="flex gap-2 flex-wrap">
                  {TITLES.map(t => (
                    <button key={t} type="button" onClick={() => set('title', form.title === t ? '' : t)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        form.title === t
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}>{t}</button>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="First Name" required error={errors.firstName}>
              <Input value={form.firstName} onChange={e => set('firstName', e.target.value)}
                placeholder="First Name" className={`cursor-text ${err('firstName')}`} />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <Input value={form.lastName} onChange={e => set('lastName', e.target.value)}
                placeholder="Last Name" className={`cursor-text ${err('lastName')}`} />
            </Field>
          </div>
        </Card>

        {/* ── Phone ── */}
        <Card icon={<Phone size={14} />} iconBg="bg-emerald-100" iconColor="text-emerald-600" title="Phone Numbers">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primary Mobile" required error={errors.mobile1}>
              <Input value={form.mobile1}
                onChange={e => set('mobile1', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210" maxLength={10} inputMode="numeric"
                className={`cursor-text ${err('mobile1')}`} />
            </Field>
            <Field label="Alternate Mobile" error={errors.mobile2}>
              <Input value={form.mobile2}
                onChange={e => set('mobile2', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Optional" maxLength={10} inputMode="numeric"
                className={`cursor-text ${err('mobile2')}`} />
            </Field>
          </div>
        </Card>

        {/* ── Email ── */}
        <Card icon={<Mail size={14} />} iconBg="bg-sky-100" iconColor="text-sky-600" title="Email Addresses" badge="optional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Personal Email" error={errors.personalEmail} hint="e.g. john@gmail.com">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center">
                    <Mail size={11} className="text-rose-500" />
                  </div>
                </div>
                <Input value={form.personalEmail} onChange={e => set('personalEmail', e.target.value)}
                  placeholder="personal@gmail.com" type="email" inputMode="email"
                  className={`pl-10 cursor-text ${err('personalEmail')}`} />
              </div>
            </Field>
            <Field label="Work Email" error={errors.workEmail} hint="e.g. john@company.com">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center">
                    <Mail size={11} className="text-blue-500" />
                  </div>
                </div>
                <Input value={form.workEmail} onChange={e => set('workEmail', e.target.value)}
                  placeholder="work@company.com" type="email" inputMode="email"
                  className={`pl-10 cursor-text ${err('workEmail')}`} />
              </div>
            </Field>
          </div>
        </Card>

        {/* ── Address ── */}
        <Card icon={<MapPin size={14} />} iconBg="bg-violet-100" iconColor="text-violet-600" title="Address">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" required error={errors.city}>
              <Input value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="City" className={`cursor-text ${err('city')}`} />
            </Field>
            <Field label="State" required error={errors.state}>
              <Input value={form.state} onChange={e => set('state', e.target.value)}
                placeholder="State" className={`cursor-text ${err('state')}`} />
            </Field>
            <Field label="Pincode" required error={errors.pincode}>
              <Input value={form.pincode}
                onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="524001" maxLength={6} inputMode="numeric"
                className={`cursor-text ${err('pincode')}`} />
            </Field>
          </div>
        </Card>

        {/* ── Groups ── */}
        {groups.length > 0 && (
          <Card icon={<span className="text-amber-600 font-bold text-xs">G</span>}
            iconBg="bg-amber-100" iconColor="" title="Assign to Groups">
            <div className="flex flex-wrap gap-2">
              {groups.map(g => {
                const active = form.groups.includes(g._id)
                return (
                  <button key={g._id} type="button" onClick={() => toggleGroup(g._id)}
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
          <Button variant="outline" onClick={() => navigate('/contacts')} disabled={loading} className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-36 cursor-pointer">
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : <><Save size={14} /> {isEdit ? 'Save Changes' : 'Create Contact'}</>}
          </Button>
        </div>
      </div>
    </div>
  )
}