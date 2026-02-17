const Group = require('./Group');
const Contact = require('./Contact');

async function groupRoutes(fastify, options) {

  // ==========================================
  // GET ALL GROUPS WITH CONTACT COUNTS
  // ==========================================
  fastify.get('/', async (request, reply) => {
    try {
      const groups = await Group.find().sort({ name: 1 });
      
      const groupsWithCounts = await Promise.all(
        groups.map(async (group) => {
          const count = await Contact.countDocuments({ 
            groups: group._id 
          });
          return {
            _id: group._id,
            name: group.name,
            color: group.color,
            icon: group.icon,
            contactCount: count
          };
        })
      );
      
      return { groups: groupsWithCounts };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false, 
        message: 'Error fetching groups', 
        error: error.message 
      });
    }
  });

  // ==========================================
  // CREATE GROUP
  // ==========================================
  fastify.post('/', async (request, reply) => {
    try {
      const { name, color, icon } = request.body;
      
      const group = new Group({ name, color, icon });
      await group.save();
      
      reply.code(201).send({ 
        success: true, 
        group,
        message: 'Group created successfully' 
      });
    } catch (error) {
      if (error.code === 11000) {
        reply.code(409).send({ 
          success: false, 
          message: 'Group name already exists' 
        });
      } else {
        fastify.log.error(error);
        reply.code(400).send({ 
          success: false, 
          message: 'Error creating group', 
          error: error.message 
        });
      }
    }
  });

  // ==========================================
  // UPDATE GROUP (Edit name, color, icon)
  // ==========================================
  fastify.put('/:id', async (request, reply) => {
    try {
      const { name, color, icon } = request.body;
      
      const group = await Group.findByIdAndUpdate(
        request.params.id,
        { name, color, icon },
        { new: true, runValidators: true }
      );
      
      if (!group) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Group not found' 
        });
      }
      
      return { 
        success: true, 
        group,
        message: 'Group updated successfully' 
      };
    } catch (error) {
      if (error.code === 11000) {
        reply.code(409).send({ 
          success: false, 
          message: 'Group name already exists' 
        });
      } else {
        fastify.log.error(error);
        reply.code(400).send({ 
          success: false, 
          message: 'Error updating group', 
          error: error.message 
        });
      }
    }
  });

  // ==========================================
  // DELETE GROUP
  // ==========================================
  fastify.delete('/:id', async (request, reply) => {
    try {
      const group = await Group.findByIdAndDelete(request.params.id);
      
      if (!group) {
        return reply.code(404).send({ 
          success: false, 
          message: 'Group not found' 
        });
      }
      
      // Remove group from ALL contacts
      await Contact.updateMany(
        { groups: group._id },
        { $pull: { groups: group._id } }
      );
      
      return { 
        success: true, 
        message: 'Group deleted successfully' 
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ 
        success: false, 
        message: 'Error deleting group', 
        error: error.message 
      });
    }
  });

}

module.exports = groupRoutes;