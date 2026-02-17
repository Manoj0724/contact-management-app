const Contact = require('./Contact');

async function routes(fastify, options) {

  // ==========================================
  // GET ALL CONTACTS
  // ==========================================
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          search: { type: 'string' },
          sortBy: { type: 'string', default: 'firstName' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          favorites: { type: 'string' },
          group: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        sortBy = 'firstName', 
        sortOrder = 'asc', 
        favorites,
        group 
      } = request.query;
      
      const favoritesOnly = favorites === 'true';
      const query = {};
      
      // Group filter
      if (group) {
        query.groups = group;
      }
      
      // Search filter
      if (search) {
        query.$or = [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { mobile1: new RegExp(search, 'i') },
          { 'address.city': new RegExp(search, 'i') }
        ];
      }
      
      // Favorites filter
      if (favoritesOnly) {
        query.isFavorite = true;
      }
      
      const skip = (page - 1) * limit;
      const sortOrderNum = sortOrder === 'desc' ? -1 : 1;
      
      // Sort: Favorites first, then by sortBy field
      const sortCriteria = favoritesOnly 
        ? { [sortBy]: sortOrderNum }
        : { isFavorite: -1, [sortBy]: sortOrderNum };
      
      const contacts = await Contact.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Contact.countDocuments(query);
      
      return {
        contacts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContacts: total
      };
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false,
        message: 'Error fetching contacts', 
        error: error.message 
      });
    }
  });

  // ==========================================
  // GET SINGLE CONTACT
  // ==========================================
  fastify.get('/:id', async (request, reply) => {
    try {
      const contact = await Contact.findById(request.params.id);
      
      if (!contact) {
        return reply.code(404).send({ 
          success: false,
          message: 'Contact not found' 
        });
      }
      
      return contact;
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false,
        message: 'Error fetching contact', 
        error: error.message 
      });
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
      fastify.log.error(error);
      reply.code(400).send({ 
        success: false,
        message: 'Error creating contact', 
        error: error.message 
      });
    }
  });

  // ==========================================
  // UPDATE CONTACT
  // ==========================================
  fastify.put('/:id', async (request, reply) => {
    try {
      const contact = await Contact.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true, runValidators: true }
      );
      
      if (!contact) {
        return reply.code(404).send({ 
          success: false,
          message: 'Contact not found' 
        });
      }
      
      return contact;
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ 
        success: false,
        message: 'Error updating contact', 
        error: error.message 
      });
    }
  });

  // ==========================================
  // DELETE SINGLE CONTACT
  // ==========================================
  fastify.delete('/:id', async (request, reply) => {
    try {
      const contact = await Contact.findByIdAndDelete(request.params.id);
      
      if (!contact) {
        return reply.code(404).send({ 
          success: false,
          message: 'Contact not found' 
        });
      }
      
      return { 
        success: true,
        message: 'Contact deleted successfully' 
      };
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false,
        message: 'Error deleting contact', 
        error: error.message 
      });
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
        { 
          isFavorite,
          favoritedAt: isFavorite ? new Date() : null
        },
        { new: true }
      );
      
      if (!contact) {
        return reply.code(404).send({ 
          success: false,
          message: 'Contact not found' 
        });
      }
      
      return {
        success: true,
        contact,
        message: isFavorite ? 'Added to favorites' : 'Removed from favorites'
      };
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false,
        message: 'Error updating favorite', 
        error: error.message 
      });
    }
  });

  // ==========================================
  // BULK DELETE
  // ==========================================
  fastify.delete('/bulk', async (request, reply) => {
    try {
      const { ids } = request.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({ 
          success: false,
          message: 'Please provide an array of contact IDs' 
        });
      }
      
      const result = await Contact.deleteMany({ 
        _id: { $in: ids }
      });
      
      return {
        success: true,
        deleted: result.deletedCount,
        message: `${result.deletedCount} contact(s) deleted`
      };
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false,
        message: 'Error deleting contacts', 
        error: error.message 
      });
    }
  });

  // ==========================================
  // BULK UPDATE FAVORITE
  // ==========================================
  fastify.patch('/bulk/favorite', async (request, reply) => {
    try {
      const { ids, isFavorite } = request.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.code(400).send({ 
          success: false,
          message: 'Please provide an array of contact IDs' 
        });
      }
      
      const result = await Contact.updateMany(
        { _id: { $in: ids } },
        { 
          $set: { 
            isFavorite,
            favoritedAt: isFavorite ? new Date() : null
          }
        }
      );
      
      return {
        success: true,
        updated: result.modifiedCount,
        message: `${result.modifiedCount} contact(s) updated`
      };
      
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false,
        message: 'Error updating favorites', 
        error: error.message 
      });
    }
  });

}

module.exports = routes;