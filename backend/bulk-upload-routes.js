const Contact = require('./Contact');

async function bulkUploadRoutes(fastify, options) {

  // Accepts JSON body: { contacts: [...] } OR just an array [...]
  fastify.post('/bulk-upload', async (request, reply) => {
    try {
      // Support both { contacts: [...] } and plain array
      let contacts = Array.isArray(request.body)
        ? request.body
        : request.body?.contacts

      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return reply.code(400).send({ success: false, message: 'No contacts provided' })
      }

      if (contacts.length > 500) {
        return reply.code(400).send({ success: false, message: 'Maximum 500 contacts per upload' })
      }

      const results = { success: [], errors: [] }

      for (let i = 0; i < contacts.length; i++) {
        const row    = contacts[i]
        const rowNum = i + 1
        const name   = `${row.firstName || ''} ${row.lastName || ''}`.trim() || `Row ${rowNum}`

        try {
          // ── Validate ────────────────────────────────────────────────────
          const title = (row.title || '').trim()
          if (!title || !['Mr','Mrs','Ms','Dr'].includes(title)) {
            results.errors.push({ row: rowNum, name, error: 'Title must be Mr, Mrs, Ms, or Dr' }); continue
          }

          const firstName = (row.firstName || '').trim()
          if (!firstName || !/^[a-zA-Z\s]+$/.test(firstName)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid first name (letters only)' }); continue
          }

          const lastName = (row.lastName || '').trim()
          if (!lastName || !/^[a-zA-Z\s]+$/.test(lastName)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid last name (letters only)' }); continue
          }

          const mobile1 = String(row.mobile1 || '').trim()
          if (!mobile1 || !/^\d{10}$/.test(mobile1)) {
            results.errors.push({ row: rowNum, name, error: 'Mobile1 must be exactly 10 digits' }); continue
          }

          const mobile2 = row.mobile2 ? String(row.mobile2).trim() : undefined
          if (mobile2 && !/^\d{10}$/.test(mobile2)) {
            results.errors.push({ row: rowNum, name, error: 'Mobile2 must be exactly 10 digits' }); continue
          }

          const city = (row.city || '').trim()
          if (!city || !/^[a-zA-Z\s]+$/.test(city)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid city (letters only)' }); continue
          }

          const state = (row.state || '').trim()
          if (!state || !/^[a-zA-Z\s]+$/.test(state)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid state (letters only)' }); continue
          }

          const pincode = String(row.pincode || '').trim()
          if (!pincode || !/^\d{6}$/.test(pincode)) {
            results.errors.push({ row: rowNum, name, error: 'Pincode must be exactly 6 digits' }); continue
          }

          // ── Save ────────────────────────────────────────────────────────
          const contact = new Contact({
            title, firstName, lastName, mobile1,
            mobile2: mobile2 || undefined,
            address: { city, state, pincode },
            isFavorite: false
          })

          await contact.save()
          results.success.push({ row: rowNum, name })

        } catch (err) {
          results.errors.push({
            row: rowNum, name,
            error: err.code === 11000 ? 'Duplicate mobile number' : err.message
          })
        }
      }

      return reply.code(200).send({
        success:   true,
        uploaded:  results.success.length,
        failed:    results.errors.length,
        total:     contacts.length,
        successList: results.success,
        errorList:   results.errors
      })

    } catch (error) {
      return reply.code(500).send({ success: false, message: 'Server error', error: error.message })
    }
  })
}

module.exports = bulkUploadRoutes