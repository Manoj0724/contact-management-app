const Contact = require('./Contact');

async function routes(fastify, options) {

  // ==========================================
  // BULK ROUTES â€” must be BEFORE /:id
  // ==========================================

  // BULK DELETE
  fastify.delete('/bulk', async (request, reply) => {
    try {
      const { ids } = request.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0)
        return reply.code(400).send({ success: false, message: 'Please provide an array of contact IDs' });
      const result = await Contact.deleteMany({ _id: { $in: ids } });
      return { success: true, deleted: result.deletedCount, message: `${result.deletedCount} contact(s) deleted` };
    } catch (error) {
      reply.code(500).send({ success: false, message: 'Error deleting contacts', error: error.message });
    }
  });

  // BULK ASSIGN GROUP
  fastify.patch('/bulk/group', async (request, reply) => {
    try {
      const { ids, groupId } = request.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0)
        return reply.code(400).send({ success: false, message: 'No contact IDs provided' });
      if (!groupId)
        return reply.code(400).send({ success: false, message: 'No group ID provided' });
      const result = await Contact.updateMany(
        { _id: { $in: ids } },
        { $addToSet: { groups: groupId } }
      );
      return { success: true, updated: result.modifiedCount, message: `${result.modifiedCount} contact(s) assigned to group` };
    } catch (error) {
      reply.code(500).send({ success: false, message: 'Error assigning group', error: error.message });
    }
  });

  // BULK FAVORITE
  fastify.patch('/bulk/favorite', async (request, reply) => {
    try {
      const { ids, isFavorite } = request.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0)
        return reply.code(400).send({ success: false, message: 'Please provide an array of contact IDs' });
      const result = await Contact.updateMany(
        { _id: { $in: ids } },
        { $set: { isFavorite, favoritedAt: isFavorite ? new Date() : null } }
      );
      return { success: true, updated: result.modifiedCount, message: `${result.modifiedCount} contact(s) updated` };
    } catch (error) {
      reply.code(500).send({ success: false, message: 'Error updating favorites', error: error.message });
    }
  });

  // BULK UPLOAD
  fastify.post('/bulk-upload', async (request, reply) => {
    try {
      let contacts = Array.isArray(request.body) ? request.body : request.body?.contacts;
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0)
        return reply.code(400).send({ success: false, message: 'No contacts provided' });
      if (contacts.length > 500)
        return reply.code(400).send({ success: false, message: 'Maximum 500 contacts per upload' });

      const results = { success: [], errors: [] };

      for (let i = 0; i < contacts.length; i++) {
        const row = contacts[i];
        const rowNum = i + 1;
        const name = `${row.firstName || ''} ${row.lastName || ''}`.trim() || `Row ${rowNum}`;

        try {
          const title = (row.title || '').trim();
          if (!title || !['Mr','Mrs','Ms','Dr'].includes(title)) {
            results.errors.push({ row: rowNum, name, error: 'Title must be Mr, Mrs, Ms, or Dr' }); continue;
          }
          const firstName = (row.firstName || '').trim();
          if (!firstName || !/^[a-zA-Z\s]+$/.test(firstName)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid first name' }); continue;
          }
          const lastName = (row.lastName || '').trim();
          if (!lastName || !/^[a-zA-Z\s]+$/.test(lastName)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid last name' }); continue;
          }
          const mobile1 = String(row.mobile1 || '').trim();
          if (!mobile1 || !/^\d{10}$/.test(mobile1)) {
            results.errors.push({ row: rowNum, name, error: 'Mobile1 must be 10 digits' }); continue;
          }
          const mobile2 = row.mobile2 ? String(row.mobile2).trim() : undefined;
          if (mobile2 && !/^\d{10}$/.test(mobile2)) {
            results.errors.push({ row: rowNum, name, error: 'Mobile2 must be 10 digits' }); continue;
          }
          const city = (row.city || '').trim();
          if (!city || !/^[a-zA-Z\s]+$/.test(city)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid city' }); continue;
          }
          const state = (row.state || '').trim();
          if (!state || !/^[a-zA-Z\s]+$/.test(state)) {
            results.errors.push({ row: rowNum, name, error: 'Invalid state' }); continue;
          }
          const pincode = String(row.pincode || '').trim();
          if (!pincode || !/^\d{6}$/.test(pincode)) {
            results.errors.push({ row: rowNum, name, error: 'Pincode must be 6 digits' }); continue;
          }

          const contact = new Contact({
            title, firstName, lastName, mobile1,
            mobile2: mobile2 || undefined,
            address: { city, state, pincode },
            isFavorite: false
          });
          await contact.save();
          results.success.push({ row: rowNum, name });

        } catch (err) {
          results.errors.push({
            row: rowNum, name,
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
      reply.code(500).send({ success: false, message: 'Server error', error: error.message });
    }
  });

  // ==========================================
  // GET ALL CONTACTS
  // ==========================================
  fastify.get('/', async (request, reply) => {
    try {
      const {
        page = 1, limit = 10, search = '',
        sortBy = 'firstName', sortOrder = 'asc',
        favorites, group
      } = request.query;

      const { city, state, hasEmail, hasMobile2, hasPhoto, title } = request.query;

      const query = {};
      if (group)                 query.groups = group;
      if (favorites === 'true')  query.isFavorite = true;
      if (title)                 query.title = title;
      if (city)                  query['address.city']  = new RegExp(city, 'i');
      if (state)                 query['address.state'] = new RegExp(state, 'i');
      if (hasMobile2 === 'true') query.mobile2 = { $exists: true, $ne: '' };
      if (hasPhoto === 'true')   query.photo   = { $exists: true, $ne: '' };
      if (hasEmail === 'true')   query.$or = [
        { 'email.personal': { $exists: true, $ne: '' } },
        { 'email.work':     { $exists: true, $ne: '' } }
      ];
      if (search) {
        query.$or = [
          { firstName: new RegExp(search, 'i') },
          { lastName:  new RegExp(search, 'i') },
          { mobile1:   new RegExp(search, 'i') },
          { 'address.city': new RegExp(search, 'i') }
        ];
      }

      const skip = (page - 1) * limit;
const total = await Contact.countDocuments(query);

// Fetch ALL matching contacts, sort in JS, then paginate
const allContacts = await Contact.find(query).lean();

allContacts.sort((a, b) => {
  // Favorites always first
  if (b.isFavorite !== a.isFavorite) return b.isFavorite ? 1 : -1;
  // Then alphabetical by firstName (case-insensitive)
  const fa = (a.firstName || '').toLowerCase();
  const fb = (b.firstName || '').toLowerCase();
  if (fa !== fb) return fa < fb ? -1 : 1;
  // Then by lastName
  const la = (a.lastName || '').toLowerCase();
  const lb = (b.lastName || '').toLowerCase();
  return la < lb ? -1 : 1;
});

const contacts = allContacts.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
      return {
        contacts,
        currentPage:   parseInt(page),
        totalPages:    Math.ceil(total / limit),
        totalContacts: total
      };
    } catch (error) {
      reply.code(500).send({ success: false, message: 'Error fetching contacts', error: error.message });
    }
  });

  // ==========================================
  // GET SINGLE CONTACT
  // ==========================================
  fastify.get('/:id', async (request, reply) => {
    try {
      const contact = await Contact.findById(request.params.id);
      if (!contact) return reply.code(404).send({ success: false, message: 'Contact not found' });
      return contact;
    } catch (error) {
      reply.code(500).send({ success: false, message: 'Error fetching contact', error: error.message });
    }
  });

  // ==========================================
  // CREATE CONTACT
  // ==========================================
  fastify.post('/', async (request, reply) => {
    try {
      const contact = new Contact(request.body);
      await contact.save();
      reply.code(201).send(contact);
    } catch (error) {
      reply.code(400).send({ success: false, message: 'Error creating contact', error: error.message });
    }
  });

  // ==========================================
  // UPDATE CONTACT
  // ==========================================
  fastify.put('/:id', async (request, reply) => {
    try {
      const contact = await Contact.findByIdAndUpdate(
        request.params.id, request.body,
        { new: true, runValidators: true }
      );
      if (!contact) return reply.code(404).send({ success: false, message: 'Contact not found' });
      return contact;
    } catch (error) {
      reply.code(400).send({ success: false, message: 'Error updating contact', error: error.message });
    }
  });

  // ==========================================
  // DELETE SINGLE CONTACT
  // ==========================================
  fastify.delete('/:id', async (request, reply) => {
    try {
      const contact = await Contact.findByIdAndDelete(request.params.id);
      if (!contact) return reply.code(404).send({ success: false, message: 'Contact not found' });
      return { success: true, message: 'Contact deleted successfully' };
    } catch (error) {
      reply.code(500).send({ success: false, message: 'Error deleting contact', error: error.message });
    }
  });

  // ==========================================
  // TOGGLE FAVORITE
  // ==========================================
  fastify.patch('/:id/favorite', async (request, reply) => {
    try {
      const { isFavorite } = request.body;
      const contact = await Contact.findByIdAndUpdate(
        request.params.id,
        { isFavorite, favoritedAt: isFavorite ? new Date() : null },
        { new: true }
      );
      if (!contact) return reply.code(404).send({ success: false, message: 'Contact not found' });
      return { success: true, contact, message: isFavorite ? 'Added to favorites' : 'Removed from favorites' };
    } catch (error) {
      reply.code(500).send({ success: false, message: 'Error updating favorite', error: error.message });
    }
  });

}

module.exports = routes;

