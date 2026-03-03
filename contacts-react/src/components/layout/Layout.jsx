import { useState, useCallback, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, Upload, Star, Download,
  Menu, FolderOpen, Plus, MoreVertical,
  Edit2, Trash2, Contact
} from 'lucide-react'
import { getGroups, deleteGroup, getAllContactsForExport } from '@/services/api'
import { exportToCSV } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import GroupDialog from '@/components/groups/GroupDialog'
import ThemeToggle from '@/components/ThemeToggle'

// ─── Sidebar Nav Content ──────────────────────────────────────────────────────
function SidebarContent({ groups, activeGroupId, onGroupFilter, onClose, onCreateGroup, onEditGroup, onDeleteGroup, onExport }) {
  const navigate = useNavigate()
  const go = (fn) => { fn(); onClose() }

  return (
    <div className="flex flex-col h-full"
      style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #1a2f4e 40%, #162640 100%)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          <Contact size={17} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-white tracking-tight text-base">ContactsHub</span>
          <p className="text-blue-300/60 text-[10px] leading-none mt-0.5">Contact Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        {/* Main nav */}
        <div className="mb-2">
          <p className="text-[10px] font-semibold text-blue-300/40 uppercase tracking-widest px-3 mb-2">Main</p>

          {/* All Contacts */}
          <NavLink to="/contacts" end
            onClick={() => go(() => onGroupFilter(null, null))}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive && !activeGroupId
                  ? 'bg-blue-500/30 text-white shadow-sm border border-blue-400/20'
                  : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
              }`}>
            <span className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users size={15} className="text-blue-300" />
            </span>
            <span className="flex-1">All Contacts</span>
          </NavLink>

          {/* Add Contact */}
          <NavLink to="/contacts/new" onClick={() => go(() => {})}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-500/30 text-white shadow-sm border border-blue-400/20'
                  : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
              }`}>
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <UserPlus size={15} className="text-emerald-300" />
            </span>
            <span>Add Contact</span>
          </NavLink>

          {/* Bulk Upload */}
          <NavLink to="/bulk-upload" onClick={() => go(() => {})}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-500/30 text-white shadow-sm border border-blue-400/20'
                  : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
              }`}>
            <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Upload size={15} className="text-violet-300" />
            </span>
            <span>Bulk Upload</span>
          </NavLink>

          {/* Favorites */}
          <button
            onClick={() => go(() => { onGroupFilter('favorites', 'Favorites'); navigate('/contacts') })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              activeGroupId === 'favorites'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/20'
                : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
            }`}>
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Star size={15} className={activeGroupId === 'favorites' ? 'fill-amber-300 text-amber-300' : 'text-amber-300'} />
            </span>
            <span>Favorites</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mx-2 my-3" />

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-semibold text-blue-300/40 uppercase tracking-widest">Groups</p>
            <button onClick={onCreateGroup}
              className="w-5 h-5 flex items-center justify-center rounded-md bg-white/10 hover:bg-blue-400/30 text-blue-200 transition-colors">
              <Plus size={11} />
            </button>
          </div>

          {groups.length === 0 && (
            <div className="mx-3 py-3 flex items-center gap-2 text-blue-300/40 text-xs">
              <FolderOpen size={13} /> No groups yet
            </div>
          )}

          {groups.map(g => (
            <div key={g._id} className="flex items-center group/g rounded-xl overflow-hidden">
              <button
                onClick={() => go(() => { onGroupFilter(g._id, g.name); navigate('/contacts') })}
                className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 min-w-0 rounded-xl ${
                  activeGroupId === g._id
                    ? 'bg-white/15 text-white border border-white/10'
                    : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
                }`}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${g.color || '#6366f1'}30`, border: `1px solid ${g.color || '#6366f1'}40` }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color || '#6366f1' }} />
                </span>
                <span className="truncate flex-1 text-left">{g.name}</span>
                <span className="text-xs text-blue-300/40 ml-auto bg-white/8 px-1.5 py-0.5 rounded-full">
                  {g.contactCount || 0}
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 opacity-0 group-hover/g:opacity-100 text-blue-300/50 hover:text-white transition-all mr-1 rounded-lg hover:bg-white/10">
                    <MoreVertical size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onEditGroup(g)}>
                    <Edit2 size={13} className="mr-2" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => onDeleteGroup(g)}>
                    <Trash2 size={13} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </nav>

      {/* Export CSV — sidebar only */}
      <div className="px-3 pb-2 border-t border-white/10 pt-3">
        <button onClick={onExport}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100/70 hover:bg-white/10 hover:text-white transition-all">
          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Download size={15} className="text-emerald-300" />
          </span>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            CP
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold leading-tight">ContactsPro</p>
            <p className="text-blue-300/50 text-[10px]">Version 2.0.0</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function Layout({ children, onGroupFilter, activeGroupId, totalContacts }) {
  const [groups, setGroups]             = useState([])
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [groupDialog, setGroupDialog]   = useState({ open: false, group: null })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchGroups = useCallback(async () => {
    try { const r = await getGroups(); setGroups(r.data.groups || []) } catch {}
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return
    try {
      await deleteGroup(deleteTarget._id)
      toast.success(`"${deleteTarget.name}" deleted`)
      fetchGroups()
      if (activeGroupId === deleteTarget._id) onGroupFilter(null, null)
    } catch { toast.error('Failed to delete group') }
    finally { setDeleteTarget(null) }
  }

  const handleExport = async () => {
    try {
      const r = await getAllContactsForExport()
      const list = r.data.contacts || []
      if (!list.length) return toast.error('No contacts to export')
      exportToCSV(list, `contacts-${new Date().toISOString().split('T')[0]}.csv`)
      toast.success(`${list.length} contacts exported!`)
    } catch { toast.error('Export failed') }
  }

  const sidebarProps = {
    groups, activeGroupId, onGroupFilter,
    onClose: () => setSidebarOpen(false),
    onCreateGroup: () => setGroupDialog({ open: true, group: null }),
    onEditGroup: (g) => setGroupDialog({ open: true, group: g }),
    onDeleteGroup: (g) => setDeleteTarget(g),
    onExport: handleExport,
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col shadow-xl">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-0 dark:bg-[#0d1117]">
          <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 h-14 bg-white dark:bg-[#0d1117] border-b border-slate-200 dark:border-slate-800 flex-shrink-0 shadow-sm dark:shadow-slate-900 transition-colors">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500">
            <Menu size={20} />
          </Button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <Contact size={13} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">ContactsHub</span>
          </div>

          <div className="flex-1" />
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 fade-in bg-slate-50 dark:bg-[#0a0f1e] transition-colors">
          {children}
        </main>
      </div>

      {/* Group dialogs */}
      <GroupDialog
        open={groupDialog.open}
        group={groupDialog.group}
        onClose={() => setGroupDialog({ open: false, group: null })}
        onSave={() => { fetchGroups(); setGroupDialog({ open: false, group: null }) }}
      />

      {/* Delete group confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Group</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Delete <strong>"{deleteTarget?.name}"</strong>? Contacts won't be deleted, just unassigned.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={handleDeleteGroup} className="bg-red-500 hover:bg-red-600 text-white">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}