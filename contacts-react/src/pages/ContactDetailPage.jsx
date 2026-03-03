import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, MapPin, Star, Edit2,
  MessageCircle, Video, Briefcase, Users,
  Copy, Check, Heart
} from 'lucide-react'
import { getContact, toggleFavorite } from '@/services/api'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { toast } from 'sonner'

function Avatar({ contact }) {
  return (
    <div className={`w-24 h-24 rounded-full ${getAvatarColor(contact.firstName)} flex items-center justify-center text-white font-bold text-3xl shadow-lg`}>
      {getInitials(contact)}
    </div>
  )
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, color = 'blue', href }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600   hover:bg-blue-100',
    green:  'bg-green-50  text-green-600  hover:bg-green-100',
    rose:   'bg-rose-50   text-rose-500   hover:bg-rose-100',
    violet: 'bg-violet-50 text-violet-600 hover:bg-violet-100',
    amber:  'bg-amber-50  text-amber-500  hover:bg-amber-100',
  }
  const cls = `flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 cursor-pointer ${colors[color]}`
  if (href) return (
    <a href={href} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </a>
  )
  return (
    <button onClick={onClick} className={cls}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, iconBg, label, value, href, onCopy }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null

  const handleCopy = () => {
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
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); handleCopy() }}
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

export default function ContactDetailPage() {
  const navigate    = useNavigate()
  const { id }      = useParams()
  const [contact, setContact]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [favLoading, setFavLoading] = useState(false)

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

  const fullName = `${contact.title ? contact.title + ' ' : ''}${contact.firstName} ${contact.lastName}`
  const whatsappUrl = `https://wa.me/91${contact.mobile1}`
  const gmailPersonal = contact.email?.personal
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email.personal)}`
    : null
  const gmailWork = contact.email?.work
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email.work)}`
    : null

  return (
    <div className="max-w-lg mx-auto pb-10">

      {/* Header */}
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
        </div>
      </div>

      {/* Profile Hero */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-6 py-8 mb-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Avatar contact={contact} />
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

        {/* ── Quick Action Buttons ── */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <ActionBtn
            href={`tel:+91${contact.mobile1}`}
            icon={<Phone size={18} />}
            label="Call" color="blue" />
          <ActionBtn
            href={whatsappUrl}
            icon={<MessageCircle size={18} />}
            label="WhatsApp" color="green" />
          {(gmailPersonal || gmailWork) && (
            <ActionBtn
              href={gmailPersonal || gmailWork}
              icon={<Mail size={18} />}
              label="Email" color="rose" />
          )}
          <ActionBtn
            href={`sms:+91${contact.mobile1}`}
            icon={<MessageCircle size={18} />}
            label="SMS" color="violet" />
        </div>
      </div>

      {/* Phone Numbers */}
      <Section title="Phone">
        <InfoRow
          icon={<Phone size={15} className="text-blue-500" />}
          iconBg="bg-blue-50"
          label="Primary"
          value={`+91 ${contact.mobile1}`}
          href={`tel:+91${contact.mobile1}`}
        />
        {contact.mobile2 && (
          <InfoRow
            icon={<Phone size={15} className="text-slate-400" />}
            iconBg="bg-slate-50"
            label="Alternate"
            value={`+91 ${contact.mobile2}`}
            href={`tel:+91${contact.mobile2}`}
          />
        )}
      </Section>

      {/* Email */}
      {(contact.email?.personal || contact.email?.work) && (
        <div className="mt-4">
          <Section title="Email">
            {contact.email?.personal && (
              <InfoRow
                icon={<Mail size={15} className="text-rose-500" />}
                iconBg="bg-rose-50"
                label="Personal"
                value={contact.email.personal}
                href={gmailPersonal}
              />
            )}
            {contact.email?.work && (
              <InfoRow
                icon={<Briefcase size={15} className="text-blue-500" />}
                iconBg="bg-blue-50"
                label="Work"
                value={contact.email.work}
                href={gmailWork}
              />
            )}
          </Section>
        </div>
      )}

      {/* Address */}
      {(contact.address?.city || contact.address?.pincode) && (
        <div className="mt-4">
          <Section title="Address">
            <InfoRow
              icon={<MapPin size={15} className="text-violet-500" />}
              iconBg="bg-violet-50"
              label="City & State"
              value={`${contact.address.city}${contact.address.state ? `, ${contact.address.state}` : ''}`}
            />
            {contact.address?.pincode && (
              <InfoRow
                icon={<MapPin size={15} className="text-violet-300" />}
                iconBg="bg-violet-50"
                label="Pincode"
                value={contact.address.pincode}
              />
            )}
          </Section>
        </div>
      )}

      {/* WhatsApp actions */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1">WhatsApp</p>
        <a href={`https://wa.me/91${contact.mobile1}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <MessageCircle size={15} className="text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Voice / Chat</p>
            <p className="text-sm font-semibold text-slate-700">Message on WhatsApp</p>
          </div>
          <ArrowLeft size={14} className="text-slate-300 rotate-180" />
        </a>
        <a href={`https://wa.me/91${contact.mobile1}?text=Hello`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Video size={15} className="text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Video</p>
            <p className="text-sm font-semibold text-slate-700">Video Call on WhatsApp</p>
          </div>
          <ArrowLeft size={14} className="text-slate-300 rotate-180" />
        </a>
      </div>

    </div>
  )
}