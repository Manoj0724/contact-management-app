import axios from 'axios'

const BASE_URL = ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export const getContacts = (params) => api.get('/api/contacts', { params })
export const getContact = (id) => api.get(`/api/contacts/${id}`)
export const createContact = (data) => api.post('/api/contacts', data)
export const updateContact = (id, data) => api.put(`/api/contacts/${id}`, data)
export const deleteContact = (id) => api.delete(`/api/contacts/${id}`)
export const bulkDeleteContacts = (ids) => api.post('/api/contacts/bulk-delete', { ids })
export const bulkAssignGroup = (ids, groupId) => api.post('/api/contacts/bulk-assign-group', { ids, groupId })
export const toggleFavorite = (id, isFavorite) => api.patch(`/api/contacts/${id}/favorite`, { isFavorite })
export const bulkUpload = (formData) => api.post('/api/contacts/bulk-upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const exportCSV = () => api.get('/api/contacts/export/csv', { responseType: 'blob' })

export const getGroups = () => api.get('/api/groups')
export const createGroup = (data) => api.post('/api/groups', data)
export const updateGroup = (id, data) => api.put(`/api/groups/${id}`, data)
export const deleteGroup = (id) => api.delete(`/api/groups/${id}`)

export default api