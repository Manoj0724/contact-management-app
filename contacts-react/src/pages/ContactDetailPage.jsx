import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, MapPin, Star, Edit2, Trash2,
  MessageCircle, Video, Briefcase, Users, Mic,
  Copy, Check, AlertTriangle, X, ZoomIn
} from 'lucide-react'
import { getContact, toggleFavorite, deleteContact } from '@/services/api'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { toast } from 'sonner'

function Avatar({ contact, onView }) {
  if (contact.photo) {
    return (
      <div className="relative group cursor-pointer" onClick={onView}>
        <img src={contact.photo} alt={contact.firstName}
          className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white transition-transform group-hover:scale-105" />
        <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn size={22} className="text-white" />
        </div>
      </div>
    )
  }
  return (
    <div className={`w-24 h-24 rounded-full ${getAvatarColor(contact.firstName)} flex items-center justify-center text-white font-bold text-3xl shadow-lg`}>
      {getInitials(contact)}
    </div>
  )
}

// ─── Action Button (same style as before) ────────────────────────────────────
function ActionBtn({ icon, label, color = 'blue', href }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600   hover:bg-blue-100',
    green:  'bg-green-50  text-green-600  hover:bg-green-100',
    rose:   'bg-rose-50   text-rose-500   hover:bg-rose-100',
    violet: 'bg-violet-50 text-violet-600 hover:bg-violet-100',
  }
  return (
    <a href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 cursor-pointer ${colors[color]}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </a>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, iconBg, label, value, href }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null

  const handleCopy = (e) => {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors group">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
      </div>
      <button onClick={handleCopy}
        className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all">
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
    </div>
  )

  if (href) return (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
      className="block border-b border-slate-100 last:border-0">
      {content}
    </a>
  )
  return <div className="border-b border-slate-100 last:border-0">{content}</div>
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1">{title}</p>
      {children}
    </div>
  )
}

// ─── Delete Dialog (same style as ContactsPage) ───────────────────────────────
function DeleteDialog({ open, contactName, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-red-500 px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Trash2 size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Delete Contact</h3>
            <p className="text-red-100 text-xs">This action cannot be undone</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl mb-5">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              You are about to permanently delete <strong>{contactName}</strong>. This cannot be reversed.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</>
                : <><Trash2 size={14} />Delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactDetailPage() {
  const navigate = useNavigate()
  const { id }   = useParams()

  const [contact, setContact]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [favLoading, setFavLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, loading: false })
  const [photoViewer, setPhotoViewer]   = useState(false)

  useEffect(() => {
    getContact(id)
      .then(r => setContact(r.data))
      .catch(() => { toast.error('Contact not found'); navigate('/contacts') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleToggleFavorite = async () => {
    setFavLoading(true)
    try {
      await toggleFavorite(id, !contact.isFavorite)
      setContact(c => ({ ...c, isFavorite: !c.isFavorite }))
      toast.success(contact.isFavorite ? 'Removed from favorites' : '⭐ Added to favorites!')
    } catch { toast.error('Failed to update') }
    finally { setFavLoading(false) }
  }

  const handleDelete = async () => {
    setDeleteDialog(d => ({ ...d, loading: true }))
    try {
      await deleteContact(id)
      toast.success('Contact deleted')
      navigate('/contacts')
    } catch {
      toast.error('Failed to delete')
      setDeleteDialog({ open: false, loading: false })
    }
  }

  if (loading) return (
    <div className="max-w-lg mx-auto space-y-4 animate-pulse">
      <div className="h-10 w-10 bg-slate-200 rounded-xl" />
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-slate-200" />
        <div className="h-6 w-36 bg-slate-200 rounded" />
        <div className="h-4 w-24 bg-slate-100 rounded" />
      </div>
    </div>
  )

  if (!contact) return null

  const fullName      = `${contact.title ? contact.title + ' ' : ''}${contact.firstName} ${contact.lastName}`
  const whatsappUrl   = `https://wa.me/91${contact.mobile1}`
  const gmailPersonal = contact.email?.personal
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email.personal)}`
    : null
  const gmailWork = contact.email?.work
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email.work)}`
    : null

  return (
    <div className="max-w-lg mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/contacts')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleFavorite} disabled={favLoading}
            className={`p-2 rounded-xl transition-all ${contact.isFavorite ? 'text-amber-400 bg-amber-50' : 'text-slate-400 hover:bg-slate-100'}`}>
            <Star size={18} className={contact.isFavorite ? 'fill-amber-400' : ''} />
          </button>
          <button onClick={() => navigate(`/contacts/edit/${id}`)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
            <Edit2 size={18} />
          </button>
          <button onClick={() => setDeleteDialog({ open: true, loading: false })}
            className="p-2 hover:bg-red-50 rounded-xl transition-colors text-slate-400 hover:text-red-500">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* ── Profile Hero ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-6 py-8 mb-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar contact={contact} onView={() => setPhotoViewer(true)} />
            {contact.isFavorite && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                <Star size={13} className="text-white fill-white" />
              </div>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{fullName}</h1>
        {contact.groups?.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Users size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">{contact.groups.length} group(s)</span>
          </div>
        )}
        {contact.address?.city && (
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <MapPin size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">
              {contact.address.city}{contact.address.state ? `, ${contact.address.state}` : ''}
            </span>
          </div>
        )}

        {/* ── Action Buttons — ALL screens ── */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <ActionBtn href={`tel:+91${contact.mobile1}`}
            icon={<Phone size={18} />} label="Call" color="blue" />
          <ActionBtn href={whatsappUrl}
            icon={<MessageCircle size={18} />} label="WhatsApp" color="green" />
          <ActionBtn href={gmailPersonal || gmailWork || `mailto:`}
            icon={<Mail size={18} />} label="Email" color="rose" />
          <ActionBtn href={`sms:+91${contact.mobile1}`}
            icon={<MessageCircle size={18} />} label="SMS" color="violet" />
        </div>
      </div>

      {/* ── Phone Numbers ── */}
      <Section title="Phone">
        <InfoRow
          icon={<Phone size={15} className="text-blue-500" />}
          iconBg="bg-blue-50" label="Primary"
          value={`+91 ${contact.mobile1}`}
          href={`tel:+91${contact.mobile1}`} />
        {contact.mobile2 && (
          <InfoRow
            icon={<Phone size={15} className="text-slate-400" />}
            iconBg="bg-slate-50" label="Alternate"
            value={`+91 ${contact.mobile2}`}
            href={`tel:+91${contact.mobile2}`} />
        )}
      </Section>

      {/* ── Email ── */}
      {(contact.email?.personal || contact.email?.work) && (
        <div className="mt-4">
          <Section title="Email">
            {contact.email?.personal && (
              <InfoRow
                icon={<Mail size={15} className="text-rose-500" />}
                iconBg="bg-rose-50" label="Personal"
                value={contact.email.personal} href={gmailPersonal} />
            )}
            {contact.email?.work && (
              <InfoRow
                icon={<Briefcase size={15} className="text-blue-500" />}
                iconBg="bg-blue-50" label="Work"
                value={contact.email.work} href={gmailWork} />
            )}
          </Section>
        </div>
      )}

      {/* ── Address ── */}
      {(contact.address?.city || contact.address?.pincode) && (
        <div className="mt-4">
          <Section title="Address">
            <InfoRow
              icon={<MapPin size={15} className="text-violet-500" />}
              iconBg="bg-violet-50" label="City & State"
              value={`${contact.address.city}${contact.address.state ? `, ${contact.address.state}` : ''}`} />
            {contact.address?.pincode && (
              <InfoRow
                icon={<MapPin size={15} className="text-violet-300" />}
                iconBg="bg-violet-50" label="Pincode"
                value={contact.address.pincode} />
            )}
          </Section>
        </div>
      )}

      {/* ── WhatsApp ── */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1">WhatsApp</p>

        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <MessageCircle size={15} className="text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Chat</p>
            <p className="text-sm font-semibold text-slate-700">Open WhatsApp Chat</p>
          </div>
          <ArrowLeft size={14} className="text-slate-300 rotate-180" />
        </a>

        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border-t border-blue-100">
          <Mic size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Voice Call:</strong> Open chat above → tap 📞 inside WhatsApp.
          </p>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-t border-amber-100">
          <Video size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Video Call:</strong> Open chat above → tap 📹 inside WhatsApp.
          </p>
        </div>
      </div>

      {/* ── Photo Viewer Modal ── */}
      {photoViewer && contact.photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setPhotoViewer(false)}>
          <button
            className="absolute top-4 right-4 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setPhotoViewer(false)}>
            <X size={22} />
          </button>
          <div className="flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
            <img
              src={contact.photo}
              alt={fullName}
              className="max-w-[92vw] max-h-[82vh] rounded-2xl object-contain shadow-2xl" />
            <p className="text-white/50 text-sm">{fullName}</p>
          </div>
        </div>
      )}

      {/* ── Delete Dialog ── */}
      <DeleteDialog
        open={deleteDialog.open}
        contactName={fullName}
        loading={deleteDialog.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, loading: false })}
      />

    </div>
  )
}