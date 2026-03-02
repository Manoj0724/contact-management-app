import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getInitials(contact) {
  return `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

export function getAvatarColor(firstName) {
  const palette = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
    'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
  ]
  return palette[(firstName?.charCodeAt(0) ?? 0) % palette.length]
}

export function exportToCSV(contacts, filename = 'contacts.csv') {
  const headers = ['Title', 'First Name', 'Last Name', 'Mobile 1', 'Mobile 2', 'City', 'State', 'Pincode']
  const rows = contacts.map(c => [
    c.title || '', c.firstName || '', c.lastName || '',
    c.mobile1 || '', c.mobile2 || '',
    c.address?.city || '', c.address?.state || '', c.address?.pincode || ''
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 100)
}
