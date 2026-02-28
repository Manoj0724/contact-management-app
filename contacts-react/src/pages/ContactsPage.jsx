import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Download, Users, Star, StarOff, Edit2, ChevronLeft, ChevronRight, SlidersHorizontal, X, Phone, MapPin } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getContacts, deleteContact, bulkDeleteContacts, toggleFavorite, bulkAssignGroup, exportCSV, getGroups } from '@/services/api'
import { toast } from 'sonner'

export default function ContactsPage({ groupFilter, groupName, onGroupFilter, onTotalChange }) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState([])
  const [groups, setGroups] = useState([])
  const [advSearch, setAdvSearch] = useState({ firstName: '', lastName: '', mobile: '', city: '' })
  const [showAdv, setShowAdv] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchContacts() }, [page, limit, groupFilter])
  useEffect(() => { getGroups().then(r => setGroups(r.data.groups || r.data || [])) }, [])

  const fetchContacts = async (searchParams = {}) => {
    setLoading(true)
    try {
      const params = { page, limit, ...searchParams }
      if (groupFilter === 'favorites') params.favorites = true
      else if (groupFilter) params.groupId = groupFilter
      const res = await getContacts(params)
      setContacts(res.data.contacts || [])
      setTotal(res.data.total || 0)
      setTotalPages(res.data.totalPages || 1)
      if (onTotalChange) onTotalChange(res.data.total || 0)
      setSelected([])
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => { setPage(1); setIsSearchActive(true); fetchContacts({ search }) }
  const handleClearSearch = () => { setSearch(''); setIsSearchActive(false); setPage(1); fetchContacts({}) }
  const handleAdvSearch = () => { setPage(1); setIsSearchActive(true); setShowAdv(false); fetchContacts(advSearch) }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return
    try { await deleteContact(id); toast.success('Contact deleted'); fetchContacts() }
    catch { toast.error('Failed to delete') }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} contacts?`)) return
    try { await bulkDeleteContacts(selected); toast.success(`${selected.length} contacts deleted`); fetchContacts() }
    catch { toast.error('Failed to delete') }
  }

  const handleToggleFavorite = async (id, isFav) => {
    try { await toggleFavorite(id, !isFav); fetchContacts() }
    catch { toast.error('Failed to update') }
  }

  const handleBulkAssign = async (groupId) => {
    if (!groupId) return
    setGroupDropdownOpen(false)
    try { await bulkAssignGroup(selected, groupId); toast.success('Assigned to group'); fetchContacts() }
    catch { toast.error('Failed to assign') }
  }

  const handleExportCSV = async () => {
    try {
      const res = await exportCSV()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click()
      toast.success('CSV exported successfully!')
    } catch { toast.error('Export failed') }
  }

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleSelectAll = () => setSelected(selected.length === contacts.length ? [] : contacts.map(c => c._id))

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 3
    let start = Math.max(1, page - 1)
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          {groupFilter === 'favorites' ? <Star size={28} className="text-yellow-400 fill-yellow-400" /> : null}
          {groupName || 'All Contacts'}
          {groupFilter && (
            <button onClick={() => onGroupFilter(null, null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          )}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {groupFilter === 'favorites' ? 'Your starred favorite contacts' : 'Manage and organize your contacts'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative bg-white rounded-lg border border-slate-200 shadow-sm flex items-center">
          <input
            className="flex-1 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none rounded-lg"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Search size={18} className="absolute right-4 text-slate-400" />
        </div>
        <button
          onClick={isSearchActive ? handleClearSearch : handleSearch}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 shadow-sm transition-colors">
          <Search size={16} />
          {isSearchActive ? 'Clear' : 'Search'}
        </button>
        <button
          onClick={() => setShowAdv(true)}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 shadow-sm transition-colors">
          <SlidersHorizontal size={16} />
          Advanced
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
            <span className="text-yellow-300">✓</span>
            <span className="font-bold text-lg">{selected.length}</span>
            <span className="text-sm font-medium">SELECTED</span>
          </div>
          <div className="flex-1" />
          <button onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Trash2 size={15} /> Delete
          </button>
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Download size={15} /> Export
          </button>
          <div className="relative">
            <button onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
              Add to Group <ChevronRight size={14} className={`transition-transform ${groupDropdownOpen ? 'rotate-90' : ''}`} />
            </button>
            {groupDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-40">
                {groups.map(g => (
                  <button key={g._id} onClick={() => handleBulkAssign(g._id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg">
                    <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setSelected([])} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Contact List</h2>
          <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs font-semibold px-3 py-1 rounded-full">
            {total} contacts
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={48} className="mx-auto text-slate-200 mb-3" />
            <h3 className="font-semibold text-slate-500 mb-1">No contacts found</h3>
            <p className="text-slate-400 text-sm mb-4">Start by adding your first contact</p>
            <button onClick={() => navigate('/contacts/new')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Add Contact
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-12 px-4 py-3 text-left">
                    <Checkbox checked={selected.length === contacts.length && contacts.length > 0} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    NAME <span className="ml-1">↑</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">MOBILE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">LOCATION</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact._id}
                    className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected.includes(contact._id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4">
                      <Checkbox checked={selected.includes(contact._id)} onCheckedChange={() => toggleSelect(contact._id)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-bold">
                            {contact.firstName?.charAt(0)?.toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {contact.title} {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {contact.mobile2 || 'No alternate'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Phone size={14} className="text-blue-400" />
                        {contact.mobile1}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <MapPin size={14} className="text-teal-400" />
                        {contact.address?.city && contact.address?.state
                          ? `${contact.address.city}, ${contact.address.state}`
                          : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleFavorite(contact._id, contact.isFavorite)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors">
                          {contact.isFavorite
                            ? <Star size={17} className="text-yellow-400 fill-yellow-400" />
                            : <StarOff size={17} className="text-slate-300" />}
                        </button>
                        <button onClick={() => navigate(`/contacts/edit/${contact._id}`)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-500 hover:text-slate-700">
                          <Edit2 size={17} />
                        </button>
                        <button onClick={() => handleDelete(contact._id, `${contact.firstName} ${contact.lastName}`)}
                          className="p-1 hover:bg-red-50 rounded transition-colors text-slate-400 hover:text-red-500">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && contacts.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Rows:</span>
              <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1) }}>
                <SelectTrigger className="h-9 w-20 text-sm border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 20].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <span className="text-sm text-slate-500 hidden sm:block">
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              {getPageNumbers().map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Search Dialog */}
      <Dialog open={showAdv} onOpenChange={setShowAdv}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="bg-blue-700 px-6 py-5">
            <DialogTitle className="text-white text-xl font-bold">Advanced Search</DialogTitle>
          </DialogHeader>
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              ['firstName', 'First Name', '👤'],
              ['lastName', 'Last Name', '👤'],
              ['mobile', 'Mobile', '📞'],
              ['city', 'City', '🏢'],
            ].map(([key, label, icon]) => (
              <div key={key}
                className="border border-slate-200 rounded-lg flex items-center gap-3 px-4 py-3 focus-within:border-blue-400 transition-colors">
                <span className="text-slate-400">{icon === '👤' ? <Users size={16} /> : icon === '📞' ? <Phone size={16} /> : <MapPin size={16} />}</span>
                <input
                  className="flex-1 text-sm text-slate-700 outline-none placeholder-slate-400"
                  placeholder={label}
                  value={advSearch[key]}
                  onChange={e => setAdvSearch(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 flex justify-end gap-3">
            <button onClick={() => setShowAdv(false)}
              className="px-5 py-2.5 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleAdvSearch}
              className="px-5 py-2.5 border border-slate-300 rounded-full text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors">
              <Search size={15} /> Search
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
