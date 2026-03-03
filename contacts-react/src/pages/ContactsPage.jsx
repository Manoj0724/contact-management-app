import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Star, Trash2, Edit2, Users,
  ChevronLeft, ChevronRight, SortAsc, SortDesc,
  CheckSquare, Square, UserCheck, X, Phone, MapPin, Mail,
  RefreshCw, LayoutGrid, List, Download, AlertTriangle, Briefcase
} from 'lucide-react'
import {
  getContacts, deleteContact, bulkDeleteContacts,
  toggleFavorite, bulkAssignGroup, getGroups,
  getAllContactsForExport
} from '@/services/api'
import { exportToCSV, getInitials, getAvatarColor } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function Avatar({ contact, size = 'md' }) {
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full ${getAvatarColor(contact.firstName)} flex items-center justify-center text-white font-bold shrink-0`}>
      {getInitials(contact)}
    </div>
  )
}

function DeleteDialog({ open, title, contactName, count, onConfirm, onCancel, loading }) {
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
            <h3 className="text-white font-bold text-base">{title}</h3>
            <p className="text-red-100 text-xs">This action cannot be undone</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl mb-5">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              {count
                ? <>Permanently delete <strong>{count} contact(s)</strong>. Cannot be reversed.</>
                : <>Permanently delete <strong>{contactName}</strong>. Cannot be reversed.</>}
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

function AssignGroupModal({ open, groups, selectedCount, onAssign, onClose }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Assign to Group</h2>
            <p className="text-xs text-slate-400 mt-0.5">{selectedCount} contact(s) selected</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No groups yet.</p>
              <p className="text-xs text-slate-300 mt-1">Create one from the sidebar.</p>
            </div>
          ) : groups.map(g => (
            <button key={g._id} onClick={() => onAssign(g._id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: (g.color || '#3b82f6') + '22' }}>
                <span className="w-3 h-3 rounded-full" style={{ background: g.color || '#3b82f6' }} />
              </span>
              <span className="text-sm font-medium text-slate-700 flex-1">{g.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: g.color || '#3b82f6' }}>
                {g.contactCount || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose}
            className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Email Badge ──────────────────────────────────────────────────────────────
function EmailBadge({ email, type }) {
  if (!email) return null
  return (
    <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`}
      target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="flex items-center gap-1.5 text-xs group/email"
      title={`${type}: ${email} — Click to compose`}>
      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
        type === 'Work' ? 'bg-blue-100' : 'bg-rose-100'
      }`}>
        {type === 'Work'
          ? <Briefcase size={9} className="text-blue-500" />
          : <Mail size={9} className="text-rose-500" />}
      </div>
      <span className="text-slate-500 group-hover/email:text-blue-600 transition-colors truncate max-w-[140px]">{email}</span>
    </a>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ContactListRow({ contact, selected, onSelect, onEdit, onDelete, onToggleFavorite }) {
  const hasEmail = contact.email?.personal || contact.email?.work
  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors group ${selected ? 'bg-blue-50' : ''}`}>
      <td className="pl-4 pr-2 py-3 w-10 align-top pt-4">
        <button onClick={() => onSelect(contact._id)}
          className={`transition-all ${selected ? 'text-blue-500 opacity-100' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-500'}`}>
          {selected ? <CheckSquare size={17} className="text-blue-500" /> : <Square size={17} />}
        </button>
      </td>
      <td className="px-3 py-3 min-w-0">
        <div className="flex items-center gap-3">
          <Avatar contact={contact} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800 text-sm">
                {contact.title ? `${contact.title} ` : ''}{contact.firstName} {contact.lastName}
              </span>
              {contact.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
            </div>
            <span className="text-xs text-slate-400">
              {contact.groups?.length > 0 ? `${contact.groups.length} group(s)` : 'No group'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Phone size={12} className="text-slate-400 shrink-0" />+91 {contact.mobile1}
        </div>
        {contact.mobile2 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <Phone size={11} className="shrink-0" />+91 {contact.mobile2}
          </div>
        )}
      </td>
      {/* Email column */}
      <td className="px-3 py-3 hidden lg:table-cell">
        <div className="space-y-1">
          <EmailBadge email={contact.email?.personal} type="Personal" />
          <EmailBadge email={contact.email?.work} type="Work" />
          {!hasEmail && <span className="text-xs text-slate-300">—</span>}
        </div>
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin size={12} className="text-slate-400 shrink-0" />
          {contact.address?.city}{contact.address?.state ? `, ${contact.address.state}` : ''}
        </div>
        {contact.address?.pincode && (
          <div className="text-xs text-slate-400 mt-0.5 ml-5">{contact.address.pincode}</div>
        )}
      </td>
      <td className="px-3 py-3 w-28">
        <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onToggleFavorite(contact)}
            className={`p-1.5 rounded-lg transition-colors ${contact.isFavorite ? 'text-amber-400 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'}`}>
            <Star size={14} className={contact.isFavorite ? 'fill-amber-400' : ''} />
          </button>
          <button onClick={() => onEdit(contact._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(contact)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function ContactGridCard({ contact, selected, onSelect, onEdit, onDelete, onToggleFavorite }) {
  return (
    <div className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-all group relative ${selected ? 'border-blue-300 shadow-blue-100 shadow-sm' : 'border-slate-200'}`}>
      <div className={`absolute top-3 left-3 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button onClick={() => onSelect(contact._id)}
          className={`transition-colors ${selected ? 'text-blue-500' : 'text-slate-300 hover:text-blue-500'}`}>
          {selected ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
        </button>
      </div>
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(contact._id)}
          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(contact)}
          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex items-center gap-3 mb-3 mt-1">
        <Avatar contact={contact} size="lg" />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-slate-800 text-sm block truncate">
            {contact.title ? `${contact.title} ` : ''}{contact.firstName} {contact.lastName}
          </span>
          <span className="text-xs text-slate-400">
            {contact.groups?.length > 0 ? `${contact.groups.length} group(s)` : 'No group'}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Phone size={11} className="text-slate-400 shrink-0" />+91 {contact.mobile1}
        </div>
        {contact.mobile2 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone size={11} className="shrink-0" />+91 {contact.mobile2}
          </div>
        )}
        {/* Emails in grid card */}
        {contact.email?.personal && (
          <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email.personal)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title="Open Gmail compose"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 transition-colors group/em">
            <div className="w-4 h-4 rounded bg-rose-100 flex items-center justify-center shrink-0">
              <Mail size={9} className="text-rose-500" />
            </div>
            <span className="truncate">{contact.email.personal}</span>
          </a>
        )}
        {contact.email?.work && (
          <a href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email.work)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title="Open Gmail compose"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-500 transition-colors">
            <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center shrink-0">
              <Briefcase size={9} className="text-blue-500" />
            </div>
            <span className="truncate">{contact.email.work}</span>
          </a>
        )}
        {contact.address?.city && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{contact.address.city}{contact.address.state ? `, ${contact.address.state}` : ''}</span>
          </div>
        )}
      </div>
      <button onClick={() => onToggleFavorite(contact)}
        className={`absolute bottom-3 right-3 p-1 rounded-lg transition-colors ${contact.isFavorite ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}>
        <Star size={14} className={contact.isFavorite ? 'fill-amber-400' : ''} />
      </button>
    </div>
  )
}

function ListSkeleton() {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b border-slate-100">
      <td className="pl-4 pr-2 py-3"><div className="skeleton w-4 h-4" /></td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="space-y-1.5"><div className="skeleton h-3.5 w-28" /><div className="skeleton h-3 w-16" /></div>
        </div>
      </td>
      <td className="px-3 py-3 hidden sm:table-cell"><div className="skeleton h-3.5 w-28" /></td>
      <td className="px-3 py-3 hidden lg:table-cell"><div className="skeleton h-3.5 w-32" /></td>
      <td className="px-3 py-3 hidden md:table-cell"><div className="skeleton h-3.5 w-24" /></td>
      <td className="px-3 py-3"><div className="skeleton h-3.5 w-16 ml-auto" /></td>
    </tr>
  ))
}

function GridSkeleton() {
  return Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-12 h-12 rounded-full" />
        <div className="space-y-1.5 flex-1"><div className="skeleton h-3.5 w-24" /><div className="skeleton h-3 w-16" /></div>
      </div>
      <div className="space-y-2"><div className="skeleton h-3 w-full" /><div className="skeleton h-3 w-3/4" /></div>
    </div>
  ))
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

export default function ContactsPage({ groupFilter, groupName, onGroupFilter, onTotalChange }) {
  const navigate = useNavigate()

  const [contacts, setContacts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [groups, setGroups]         = useState([])
  const [total, setTotal]           = useState(0)
  const [withPhone, setWithPhone]   = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [limit, setLimit]           = useState(10)
  const [search, setSearch]         = useState('')
  const [sortBy, setSortBy]         = useState('firstName')
  const [sortOrder, setSortOrder]   = useState('asc')
  const [selected, setSelected]     = useState([])
  const [viewMode, setViewMode]     = useState('list')

  const [deleteDialog, setDeleteDialog]         = useState({ open: false, contact: null, loading: false })
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({ open: false, loading: false })
  const [assignDialog, setAssignDialog]         = useState(false)
  const searchTimer = useRef(null)

  const fetchContacts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const params = { page, limit, sortBy, sortOrder }
      if (search.trim())               params.search    = search.trim()
      if (groupFilter === 'favorites') params.favorites = 'true'
      else if (groupFilter)            params.group     = groupFilter
      const res  = await getContacts(params)
      const data = res.data
      const list = data.contacts || []
      setContacts(list)
      setTotalPages(data.totalPages || 1)
      const count = data.totalContacts ?? 0
      setTotal(count)
      setWithPhone(list.filter(c => c.mobile1).length)
      onTotalChange?.(count)
    } catch { toast.error('Failed to load contacts') }
    finally { setLoading(false); setRefreshing(false) }
  }, [page, limit, search, sortBy, sortOrder, groupFilter, onTotalChange])

  useEffect(() => { fetchContacts() }, [fetchContacts])
  useEffect(() => { setPage(1) }, [search, sortBy, sortOrder, groupFilter, limit])
  useEffect(() => { setSelected([]) }, [page, groupFilter])
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setPage(1), 350)
    return () => clearTimeout(searchTimer.current)
  }, [search])
  useEffect(() => { getGroups().then(r => setGroups(r.data.groups || [])).catch(() => {}) }, [])

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleSelectAll = () => setSelected(selected.length === contacts.length ? [] : contacts.map(c => c._id))

  const handleToggleFavorite = async (contact) => {
    try {
      await toggleFavorite(contact._id, !contact.isFavorite)
      toast.success(contact.isFavorite ? 'Removed from favorites' : '⭐ Added to favorites!')
      fetchContacts()
    } catch { toast.error('Failed to update') }
  }

  const handleDelete = async () => {
    setDeleteDialog(d => ({ ...d, loading: true }))
    try {
      await deleteContact(deleteDialog.contact._id)
      toast.success('Contact deleted')
      setDeleteDialog({ open: false, contact: null, loading: false })
      fetchContacts()
    } catch { toast.error('Failed to delete'); setDeleteDialog(d => ({ ...d, loading: false })) }
  }

  const handleBulkDelete = async () => {
    setBulkDeleteDialog(d => ({ ...d, loading: true }))
    try {
      await bulkDeleteContacts(selected)
      toast.success(`${selected.length} contacts deleted`)
      setSelected([])
      setBulkDeleteDialog({ open: false, loading: false })
      fetchContacts()
    } catch { toast.error('Bulk delete failed'); setBulkDeleteDialog(d => ({ ...d, loading: false })) }
  }

  const handleBulkAssignGroup = async (groupId) => {
    try {
      await bulkAssignGroup(selected, groupId)
      toast.success(`${selected.length} contacts assigned!`)
      setAssignDialog(false); setSelected([]); fetchContacts()
    } catch { toast.error('Failed to assign group') }
  }

  const handleExportCSV = async () => {
    toast.loading('Preparing CSV...')
    try {
      const res = await getAllContactsForExport()
      const contacts = res.data.contacts || []
      if (!contacts.length) { toast.dismiss(); return toast.error('No contacts to export') }
      exportToCSV(contacts, `contacts-${new Date().toISOString().split('T')[0]}.csv`)
      toast.dismiss(); toast.success(`Exported ${contacts.length} contacts!`)
    } catch { toast.dismiss(); toast.error('Export failed') }
  }

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('asc') }
    setPage(1)
  }

  return (
    <div className="space-y-4 page-enter">

      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">ContactsHub</h1>
            {groupFilter && (
              <p className="text-xs text-slate-400">
                {groupFilter === 'favorites' ? '⭐ Favorites' : `📁 ${groupName}`}
                <button onClick={() => onGroupFilter?.(null, null)} className="ml-2 text-blue-500 hover:underline">× clear</button>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 text-slate-600 h-9 hidden sm:flex">
            <Download size={14} /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchContacts(true)} className="gap-1.5 text-slate-600 h-9">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={() => navigate('/contacts/new')} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9">
            <Plus size={15} /> Add Contact
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Contacts', value: total,      color: 'text-blue-600' },
          { label: 'With Phone',     value: withPhone,  color: 'text-amber-500' },
          { label: 'Total Pages',    value: totalPages, color: 'text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white border-slate-200 text-sm" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <span className="text-sm text-slate-500 shrink-0 hidden sm:block">{total} contacts</span>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white shrink-0">
          <button onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-md">
          <span className="text-sm font-semibold">{selected.length} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setAssignDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors">
              <UserCheck size={14} /> Assign Group
            </button>
            <button onClick={() => setBulkDeleteDialog({ open: true, loading: false })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium transition-colors">
              <Trash2 size={14} /> Delete
            </button>
            <button onClick={() => setSelected([])} className="p-1 hover:bg-white/20 rounded-lg"><X size={15} /></button>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="pl-4 pr-2 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-500 transition-colors">
                    {selected.length > 0 && selected.length === contacts.length
                      ? <CheckSquare size={16} className="text-blue-500" />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort('firstName')}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-blue-600">
                    NAME
                    {sortBy === 'firstName' && (sortOrder === 'asc'
                      ? <SortAsc size={12} className="text-blue-500" />
                      : <SortDesc size={12} className="text-blue-500" />)}
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">PHONE</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">EMAIL</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">ADDRESS</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && <ListSkeleton />}
              {!loading && contacts.length === 0 && (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <Users size={24} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold text-sm mb-1">{search ? 'No results found' : 'No contacts yet'}</p>
                    <p className="text-slate-400 text-xs mb-4">{search ? `No match for "${search}"` : 'Add your first contact to get started'}</p>
                    {!search && (
                      <Button size="sm" onClick={() => navigate('/contacts/new')} className="bg-blue-600 text-white gap-2">
                        <Plus size={13} /> Add Contact
                      </Button>
                    )}
                  </div>
                </td></tr>
              )}
              {!loading && contacts.map(contact => (
                <ContactListRow key={contact._id} contact={contact}
                  selected={selected.includes(contact._id)}
                  onSelect={toggleSelect}
                  onEdit={id => navigate(`/contacts/edit/${id}`)}
                  onDelete={c => setDeleteDialog({ open: true, contact: c, loading: false })}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div>
          {loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"><GridSkeleton /></div>}
          {!loading && contacts.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-semibold text-sm mb-4">{search ? `No match for "${search}"` : 'No contacts yet'}</p>
              {!search && <Button size="sm" onClick={() => navigate('/contacts/new')} className="bg-blue-600 text-white gap-2"><Plus size={13} /> Add Contact</Button>}
            </div>
          )}
          {!loading && contacts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map(contact => (
                <ContactGridCard key={contact._id} contact={contact}
                  selected={selected.includes(contact._id)}
                  onSelect={toggleSelect}
                  onEdit={id => navigate(`/contacts/edit/${id}`)}
                  onDelete={c => setDeleteDialog({ open: true, contact: c, loading: false })}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Rows:</span>
            <div className="relative">
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-700 font-medium cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
            </div>
            <span className="hidden sm:inline text-slate-400">· Page {page} of {totalPages} · {total} total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="h-8 w-8 p-0"><ChevronLeft size={15} /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1
              if (totalPages > 5) {
                if (page <= 3) p = i + 1
                else if (page >= totalPages - 2) p = totalPages - 4 + i
                else p = page - 2 + i
              }
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {p}
                </button>
              )
            })}
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="h-8 w-8 p-0"><ChevronRight size={15} /></Button>
          </div>
        </div>
      )}

      <DeleteDialog open={deleteDialog.open} title="Delete Contact"
        contactName={`${deleteDialog.contact?.firstName || ''} ${deleteDialog.contact?.lastName || ''}`}
        loading={deleteDialog.loading} onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, contact: null, loading: false })} />

      <DeleteDialog open={bulkDeleteDialog.open} title="Delete Selected Contacts"
        count={selected.length} loading={bulkDeleteDialog.loading}
        onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteDialog({ open: false, loading: false })} />

      <AssignGroupModal open={assignDialog} groups={groups} selectedCount={selected.length}
        onAssign={handleBulkAssignGroup} onClose={() => setAssignDialog(false)} />
    </div>
  )
}