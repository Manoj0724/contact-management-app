import axios from 'axios'

// Empty baseURL = Vite proxy handles /api → http://localhost:5000
const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' }
})

// ─── CONTACTS ─────────────────────────────────────────────────────────────────
// Your backend has TWO endpoints:
//   GET /api/contacts/paginate  → { contacts, page, total, totalPages }  (Express server copy.js)
//   GET /api/contacts           → { contacts, totalContacts, totalPages } (Fastify contacts-routes.js)
// We use the Fastify one (contacts-routes.js) as it supports all filters.
// If you run "server copy.js" swap the URL to /api/contacts/paginate and adjust params.

export const getContacts = (params) => api.get('/api/contacts', { params })
export const getContact  = (id)     => api.get(`/api/contacts/${id}`)
export const createContact = (data) => api.post('/api/contacts', data)
export const updateContact = (id, data) => api.put(`/api/contacts/${id}`, data)
export const deleteContact = (id)   => api.delete(`/api/contacts/${id}`)

// Bulk operations
export const bulkDeleteContacts = (ids) =>
  api.delete('/api/contacts/bulk', { data: { ids } })   // DELETE with body

export const bulkAssignGroup = (ids, groupId) =>
  api.post('/api/contacts/bulk-assign-group', { ids, groupId })

export const toggleFavorite = (id, isFavorite) =>
  api.patch(`/api/contacts/${id}/favorite`, { isFavorite })

// CSV
export const bulkUpload = (formData) =>
  api.post('/api/contacts/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const exportCSV = () =>
  api.get('/api/contacts/export/csv', { responseType: 'blob' })

// ─── GROUPS ───────────────────────────────────────────────────────────────────
export const getGroups    = ()          => api.get('/api/groups')
export const createGroup  = (data)      => api.post('/api/groups', data)
export const updateGroup  = (id, data)  => api.put(`/api/groups/${id}`, data)
export const deleteGroup  = (id)        => api.delete(`/api/groups/${id}`)

export default api