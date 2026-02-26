// ============================================================
// FILE: C:\js_projects\contact_js\backend\bulk-upload-routes.js
// ============================================================
const Contact = require('./Contact');

async function bulkUploadRoutes(fastify, options) {

  fastify.post('/bulk-upload', async (request, reply) => {
    try {
      const { contacts } = request.body;

      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return reply.code(400).send({ success: false, message: 'No contacts provided' });
      }

      if (contacts.length > 500) {
        return reply.code(400).send({ success: false, message: 'Maximum 500 contacts per upload' });
      }

      const results = { success: [], errors: [] };

      for (let i = 0; i < contacts.length; i++) {
        const row = contacts[i];
        const rowNum = i + 1;
        const name = `${row.firstName || ''} ${row.lastName || ''}`.trim() || `Row ${rowNum}`;

        try {
          // Validate
          if (!row.title || !['Mr', 'Mrs', 'Ms', 'Dr'].includes(row.title.trim())) {
            results.errors.push({ row: rowNum, name, error: 'Title must be Mr, Mrs, Ms, or Dr' });
            continue;
          }
          if (!row.firstName || !/^[a-zA-Z\s]+$/.test(row.firstName)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid first name (letters only)' });
            continue;
          }
          if (!row.lastName || !/^[a-zA-Z\s]+$/.test(row.lastName)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid last name (letters only)' });
            continue;
          }
          if (!row.mobile1 || !/^[0-9]{10}$/.test(String(row.mobile1).trim())) {
            results.errors.push({ row: rowNum, name, error: 'Mobile must be exactly 10 digits' });
            continue;
          }
          if (!row.city || !/^[a-zA-Z\s]+$/.test(row.city)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid city (letters only)' });
            continue;
          }
          if (!row.state || !/^[a-zA-Z\s]+$/.test(row.state)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid state (letters only)' });
            continue;
          }
          if (!row.pincode || !/^[0-9]{6}$/.test(String(row.pincode).trim())) {
            results.errors.push({ row: rowNum, name, error: 'Pincode must be exactly 6 digits' });
            continue;
          }

          // Save
          const contact = new Contact({
            title: row.title.trim(),
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            mobile1: String(row.mobile1).trim(),
            mobile2: row.mobile2 ? String(row.mobile2).trim() : undefined,
            address: {
              city: row.city.trim(),
              state: row.state.trim(),
              pincode: String(row.pincode).trim()
            },
            isFavorite: false
          });

          await contact.save();
          results.success.push({ row: rowNum, name });

        } catch (err) {
          results.errors.push({
            row: rowNum,
            name,
            error: err.code === 11000 ? 'Duplicate mobile number' : err.message
          });
        }
      }

      return reply.code(200).send({
        success: true,
        uploaded: results.success.length,
        failed: results.errors.length,
        total: contacts.length,
        successList: results.success,
        errorList: results.errors
      });

    } catch (error) {
      return reply.code(500).send({ success: false, message: 'Server error', error: error.message });
    }
  });
}

module.exports = bulkUploadRoutes;