import axios from 'axios'

// ✅ In production (Render): uses VITE_API_URL = https://contactshub-backend.onrender.com
// ✅ In local Docker: uses '' (empty) so Nginx proxy handles /api → backend
const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s timeout — Render free tier can be slow on first wake
})

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
export const getContacts        = (params)     => api.get('/api/contacts', { params })
export const getContact         = (id)         => api.get(`/api/contacts/${id}`)
export const createContact      = (data)       => api.post('/api/contacts', data)
export const updateContact      = (id, data)   => api.put(`/api/contacts/${id}`, data)
export const deleteContact      = (id)         => api.delete(`/api/contacts/${id}`)
export const toggleFavorite     = (id, isFav)  => api.patch(`/api/contacts/${id}/favorite`, { isFavorite: isFav })
export const bulkDeleteContacts = (ids)        => api.delete('/api/contacts/bulk', { data: { ids } })
export const bulkAssignGroup    = (ids, gid)   => api.patch('/api/contacts/bulk/group', { ids, groupId: gid })
export const bulkFavorite       = (ids, isFav) => api.patch('/api/contacts/bulk/favorite', { ids, isFavorite: isFav })
export const bulkUpload         = (contacts)   => api.post('/api/contacts/bulk-upload', { contacts })
export const getAllContactsForExport = ()      =>
  api.get('/api/contacts', { params: { page: 1, limit: 9999, sortBy: 'firstName', sortOrder: 'asc' } })

// ─── GROUPS ───────────────────────────────────────────────────────────────────
export const getGroups   = ()         => api.get('/api/groups')
export const createGroup = (data)     => api.post('/api/groups', data)
export const updateGroup = (id, data) => api.put(`/api/groups/${id}`, data)
export const deleteGroup = (id)       => api.delete(`/api/groups/${id}`)

// ─── CSV Export (client-side) ─────────────────────────────────────────────────
export const exportToCSV = (contacts, filename = 'contacts.csv') => {
  const headers = ['title', 'firstName', 'lastName', 'mobile1', 'mobile2', 'city', 'state', 'pincode']
  const rows = contacts.map(c => [
    c.title || '', c.firstName || '', c.lastName || '',
    c.mobile1 || '', c.mobile2 || '',
    c.address?.city || '', c.address?.state || '', c.address?.pincode || ''
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 100)
}

// Legacy aliases
export const getAllForExport = getAllContactsForExport
export const exportCSV = exportToCSV

export default api