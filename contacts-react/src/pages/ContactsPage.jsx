import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Star, Trash2, Edit2, Users,
  ChevronLeft, ChevronRight, SortAsc, SortDesc,
  CheckSquare, Square, UserCheck, X, Phone, MapPin
} from 'lucide-react'
import {
  getContacts, deleteContact, bulkDeleteContacts,
  toggleFavorite, bulkAssignGroup, getGroups
} from '@/services/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog'

// ─── Avatar initials helper ───────────────────────────────────────────────────
function Avatar({ contact }) {
  const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase()
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
  ]
  const color = colors[(contact.firstName?.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials || '?'}
    </div>
  )
}

// ─── Contact Row ──────────────────────────────────────────────────────────────
function ContactRow({ contact, selected, onSelect, onEdit, onDelete, onToggleFavorite }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors group ${selected ? 'bg-blue-50 border-blue-100' : ''}`}>
      {/* Checkbox */}
      <button onClick={() => onSelect(contact._id)} className="flex-shrink-0 text-slate-300 hover:text-blue-500 transition-colors">
        {selected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
      </button>

      <Avatar contact={contact} />

      {/* Name & details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm truncate">
            {contact.title ? `${contact.title} ` : ''}{contact.firstName} {contact.lastName}
          </span>
          {contact.isFavorite && <Star size={13} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Phone size={11} /> {contact.mobile1}
          </span>
          {contact.address?.city && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={11} /> {contact.address.city}
              {contact.address.state ? `, ${contact.address.state}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggleFavorite(contact)}
          title={contact.isFavorite ? 'Remove favorite' : 'Add favorite'}
          className={`p-1.5 rounded-lg transition-colors ${contact.isFavorite ? 'text-amber-400 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'}`}>
          <Star size={15} className={contact.isFavorite ? 'fill-amber-400' : ''} />
        </button>
        <button onClick={() => onEdit(contact._id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <Edit2 size={15} />
        </button>
        <button onClick={() => onDelete(contact)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ContactsPage({ groupFilter, groupName, onGroupFilter, onTotalChange }) {
  const navigate = useNavigate()

  // Data state
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState([])

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 10

  // Filters & sort
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('firstName')
  const [sortOrder, setSortOrder] = useState('asc')

  // Selection
  const [selected, setSelected] = useState([])

  // Delete confirm dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, contact: null })

  // Assign group dialog
  const [assignDialog, setAssignDialog] = useState(false)

  // ── Fetch contacts ──────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setSelected([])
    try {
      // Build params matching your backend API
      const params = {
        page,
        limit: LIMIT,
        search,
        sortBy,
        sortOrder,
      }

      // Your backend supports ?favorites=true and ?group=<id>
      if (groupFilter === 'favorites') {
        params.favorites = 'true'
      } else if (groupFilter) {
        params.group = groupFilter
      }

      const res = await getContacts(params)
      const data = res.data

      // Backend returns: { contacts, currentPage, totalPages, totalContacts }
      // OR the paginate endpoint returns: { contacts, page, total, totalPages }
      const list = data.contacts || []
      const pages = data.totalPages || 1
      const count = data.totalContacts ?? data.total ?? 0

      setContacts(list)
      setTotalPages(pages)
      setTotal(count)
      onTotalChange?.(count)
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [page, search, sortBy, sortOrder, groupFilter])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, sortBy, sortOrder, groupFilter])

  // Fetch groups for assign dialog
  useEffect(() => {
    getGroups().then(r => setGroups(r.data.groups || r.data || [])).catch(() => {})
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleSelectAll = () =>
    setSelected(selected.length === contacts.length ? [] : contacts.map(c => c._id))

  const handleToggleFavorite = async (contact) => {
    try {
      await toggleFavorite(contact._id, !contact.isFavorite)
      toast.success(contact.isFavorite ? 'Removed from favorites' : 'Added to favorites')
      fetchContacts()
    } catch {
      toast.error('Failed to update favorite')
    }
  }

  const handleDelete = async () => {
    const contact = deleteDialog.contact
    if (!contact) return
    try {
      await deleteContact(contact._id)
      toast.success('Contact deleted')
      setDeleteDialog({ open: false, contact: null })
      fetchContacts()
    } catch {
      toast.error('Failed to delete contact')
    }
  }

  const handleBulkDelete = async () => {
    if (!selected.length) return
    if (!confirm(`Delete ${selected.length} selected contact(s)?`)) return
    try {
      await bulkDeleteContacts(selected)
      toast.success(`${selected.length} contact(s) deleted`)
      setSelected([])
      fetchContacts()
    } catch {
      toast.error('Bulk delete failed')
    }
  }

  const handleBulkAssignGroup = async (groupId) => {
    try {
      await bulkAssignGroup(selected, groupId)
      toast.success('Group assigned!')
      setAssignDialog(false)
      setSelected([])
      fetchContacts()
    } catch {
      toast.error('Failed to assign group')
    }
  }

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc'
      ? <SortAsc size={13} className="text-blue-500" />
      : <SortDesc size={13} className="text-blue-500" />
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {groupFilter === 'favorites' ? '⭐ Favorites'
              : groupName ? `📁 ${groupName}`
              : 'All Contacts'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total} contact{total !== 1 ? 's' : ''}
            {groupFilter && groupFilter !== 'favorites' && (
              <button onClick={() => onGroupFilter?.(null, null)}
                className="ml-2 text-blue-500 hover:underline text-xs">
                Clear filter
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/contacts/new')} size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus size={15} /> Add Contact
          </Button>
        </div>
      </div>

      {/* ── Search & Sort bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm border-slate-200"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 mr-1">Sort:</span>
          {[['firstName', 'Name'], ['createdAt', 'Date']].map(([field, label]) => (
            <button key={field} onClick={() => toggleSort(field)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${sortBy === field ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {label} <SortIcon field={field} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {selected.length > 0 && (
        <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap shadow-md">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="secondary" onClick={() => setAssignDialog(true)}
              className="h-8 text-xs gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0">
              <UserCheck size={14} /> Assign Group
            </Button>
            <Button size="sm" variant="secondary" onClick={handleBulkDelete}
              className="h-8 text-xs gap-1.5 bg-red-500 hover:bg-red-600 text-white border-0">
              <Trash2 size={14} /> Delete
            </Button>
            <button onClick={() => setSelected([])} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Contacts list ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          <button onClick={toggleSelectAll} className="flex-shrink-0 text-slate-400 hover:text-blue-500 transition-colors">
            {selected.length === contacts.length && contacts.length > 0
              ? <CheckSquare size={18} className="text-blue-500" />
              : <Square size={18} />}
          </button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-1">Contact</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-28 hidden sm:block">Phone</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-32 hidden md:block">Location</span>
          <span className="w-24" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Users size={28} className="text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-semibold mb-1">
              {search ? 'No results found' : 'No contacts yet'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {search ? `No contacts match "${search}"` : 'Add your first contact to get started'}
            </p>
            {!search && (
              <Button size="sm" onClick={() => navigate('/contacts/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus size={14} /> Add Contact
              </Button>
            )}
          </div>
        )}

        {/* Contact rows */}
        {!loading && contacts.map(contact => (
          <ContactRow
            key={contact._id}
            contact={contact}
            selected={selected.includes(contact._id)}
            onSelect={toggleSelect}
            onEdit={(id) => navigate(`/contacts/edit/${id}`)}
            onDelete={(c) => setDeleteDialog({ open: true, contact: c })}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} contacts
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}
              className="h-8 w-8 p-0">
              <ChevronLeft size={16} />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1
              if (totalPages > 5) {
                if (page <= 3) p = i + 1
                else if (page >= totalPages - 2) p = totalPages - 4 + i
                else p = page - 2 + i
              }
              return (
                <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 p-0 text-xs ${page === p ? 'bg-blue-600 text-white border-blue-600' : ''}`}>
                  {p}
                </Button>
              )
            })}

            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
              className="h-8 w-8 p-0">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={deleteDialog.open} onOpenChange={o => !o && setDeleteDialog({ open: false, contact: null })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Are you sure you want to delete{' '}
            <strong>{deleteDialog.contact?.firstName} {deleteDialog.contact?.lastName}</strong>?
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, contact: null })}>Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Group Dialog ── */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Group to {selected.length} Contact(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {groups.length === 0 && (
              <p className="text-sm text-slate-500">No groups yet. Create one from the sidebar.</p>
            )}
            {groups.map(g => (
              <button key={g._id} onClick={() => handleBulkAssignGroup(g._id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color || '#3b82f6' }} />
                <span className="text-sm font-medium text-slate-700">{g.name}</span>
                <span className="ml-auto text-xs text-slate-400">{g.contactCount || 0} contacts</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
