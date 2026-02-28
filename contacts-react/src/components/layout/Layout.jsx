import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Users, UserPlus, Upload, Star, Download, Menu, FolderOpen, Plus, MoreVertical, Edit2, Trash2, Contact } from 'lucide-react'
import { getGroups, deleteGroup, exportCSV } from '@/services/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import GroupDialog from '@/components/groups/GroupDialog'

// ✅ SidebarContent moved OUTSIDE Layout to avoid "component created during render" error
function SidebarContent({ groups, activeGroupId, onGroupFilter, onCloseSidebar, onCreateGroup, onEditGroup, onDeleteGroup, onExportCSV, navigate, totalContacts }) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Contact size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-sm">ContactsPro</h2>
          <p className="text-white/50 text-xs">Contact Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        <NavLink to="/contacts" end
          onClick={() => { onGroupFilter(null, null); onCloseSidebar() }}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive && !activeGroupId ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
          }>
          <Users size={18} />
          <span>All Contacts</span>
          <span className="ml-auto bg-white/15 text-white/90 text-xs px-2 py-0.5 rounded-full">{totalContacts}</span>
        </NavLink>

        <NavLink to="/contacts/new"
          onClick={onCloseSidebar}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
          }>
          <UserPlus size={18} />
          <span>Add Contact</span>
        </NavLink>

        <NavLink to="/bulk-upload"
          onClick={onCloseSidebar}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
          }>
          <Upload size={18} />
          <span>Bulk Upload</span>
        </NavLink>

        <button
          onClick={() => { onGroupFilter('favorites', 'Favorites'); onCloseSidebar(); navigate('/contacts') }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeGroupId === 'favorites' ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
          <Star size={18} />
          <span>Favorites</span>
        </button>

        {/* Groups */}
        <div className="pt-3 pb-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">Groups</span>
            <button onClick={onCreateGroup}
              className="w-5 h-5 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 transition-colors">
              <Plus size={12} className="text-white/70" />
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="mx-3 p-3 rounded-lg border border-dashed border-white/15 flex items-center gap-2 text-white/30 text-xs">
              <FolderOpen size={14} />
              <span>No groups yet</span>
            </div>
          ) : (
            groups.map(group => (
              <div key={group._id} className="flex items-center group/item">
                <button
                  onClick={() => { onGroupFilter(group._id, group.name); onCloseSidebar(); navigate('/contacts') }}
                  className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-0 ${activeGroupId === group._id ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color || '#3b82f6' }} />
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-xs opacity-60">{group.contactCount || 0}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 opacity-0 group-hover/item:opacity-100 text-white/50 hover:text-white transition-all mr-1">
                      <MoreVertical size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => onEditGroup(group)}>
                      <Edit2 size={14} className="mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={() => onDeleteGroup(group)}>
                      <Trash2 size={14} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>

        <div className="h-px bg-white/10 mx-2 my-2" />

        <button onClick={onExportCSV}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </nav>

      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-white/25 text-xs text-center">Version 2.0.0</p>
      </div>
    </div>
  )
}

export default function Layout({ children, onGroupFilter, activeGroupId, totalContacts }) {
  const [groups, setGroups] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [groupDialog, setGroupDialog] = useState({ open: false, group: null })
  const navigate = useNavigate()

  // ✅ fetchGroups declared before useEffect using useCallback
  const fetchGroups = useCallback(async () => {
    try {
      const res = await getGroups()
      setGroups(res.data.groups || res.data || [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
  fetchGroups()
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  const handleDeleteGroup = async (group) => {
    if (!confirm(`Delete group "${group.name}"?`)) return
    try {
      await deleteGroup(group._id)
      toast.success('Group deleted')
      fetchGroups()
      if (activeGroupId === group._id) onGroupFilter(null, null)
    } catch {
      toast.error('Failed to delete group')
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await exportCSV()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'contacts.csv'
      a.click()
      toast.success('CSV exported!')
    } catch {
      toast.error('Export failed')
    }
  }

  const sidebarProps = {
    groups,
    activeGroupId,
    onGroupFilter,
    onCloseSidebar: () => setSidebarOpen(false),
    onCreateGroup: () => setGroupDialog({ open: true, group: null }),
    onEditGroup: (group) => setGroupDialog({ open: true, group }),
    onDeleteGroup: handleDeleteGroup,
    onExportCSV: handleExportCSV,
    navigate,
    totalContacts,
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <span className="font-bold text-slate-800">ContactsPro</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Group Dialog */}
      <GroupDialog
        open={groupDialog.open}
        group={groupDialog.group}
        onClose={() => setGroupDialog({ open: false, group: null })}
        onSave={() => { fetchGroups(); setGroupDialog({ open: false, group: null }) }}
      />
    </div>
  )
}
