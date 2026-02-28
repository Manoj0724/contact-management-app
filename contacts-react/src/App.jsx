import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from '@/components/layout/Layout'
import ContactsPage from '@/pages/ContactsPage'
import ContactFormPage from '@/pages/ContactFormPage'
import BulkUploadPage from '@/pages/BulkUploadPage'

export default function App() {
  const [groupFilter, setGroupFilter] = useState(null)
  const [groupName, setGroupName] = useState(null)
  const [totalContacts, setTotalContacts] = useState(0)

  const handleGroupFilter = (id, name) => {
    setGroupFilter(id)
    setGroupName(name)
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Layout onGroupFilter={handleGroupFilter} activeGroupId={groupFilter} totalContacts={totalContacts}>
        <Routes>
          <Route path="/" element={<Navigate to="/contacts" replace />} />
          <Route path="/contacts" element={
            <ContactsPage
              groupFilter={groupFilter}
              groupName={groupName}
              onGroupFilter={handleGroupFilter}
              onTotalChange={setTotalContacts}
            />
          } />
          <Route path="/contacts/new" element={<ContactFormPage />} />
          <Route path="/contacts/edit/:id" element={<ContactFormPage />} />
          <Route path="/bulk-upload" element={<BulkUploadPage />} />
          <Route path="*" element={<Navigate to="/contacts" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}