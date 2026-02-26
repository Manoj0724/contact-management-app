/**
 * 🚀 FASTIFY BACKEND SERVER
 * Modern, fast alternative to Express
 * 
 * Why Fastify?
 * - 2-3x faster than Express
 * - Built-in schema validation
 * - Better TypeScript support
 * - Modern async/await patterns
 */

const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');

// ==========================================
// DATABASE CONNECTION
// ==========================================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/contactsdb');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS - Allow frontend to access API
fastify.register(cors, {
  origin: ['http://localhost:4200', 'http://frontend:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

// JSON Body Parser (built-in with Fastify)
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    done(err);
  }
});

// ==========================================
// ROUTES
// ==========================================

const contactRoutes = require('./contacts-routes'); 
fastify.register(contactRoutes, { prefix: '/api/contacts' });

const bulkUploadRoutes = require('./bulk-upload-routes');
fastify.register(bulkUploadRoutes, { prefix: '/api/contacts' });

const groupRoutes = require('./groups-routes');
fastify.register(groupRoutes, { prefix: '/api/groups' });

// ==========================================
// HEALTH CHECK
// ==========================================

fastify.get('/', async (request, reply) => {
  return { 
    status: 'ok',
    message: 'ContactsPro API is running',
    version: '1.3.0 (Fastify)'
  };
});

fastify.get('/health', async (request, reply) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return {
    status: 'ok',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
});

// ==========================================
// ERROR HANDLING
// ==========================================

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  reply.status(error.statusCode || 500).send({
    success: false,
    message: error.message || 'Internal Server Error',
    statusCode: error.statusCode || 500
  });
});

// ==========================================
// START SERVER
// ==========================================

const start = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    await fastify.listen({ port: 5000, host: '0.0.0.0' });
    
    console.log('');
    console.log('🚀 ========================================');
    console.log('   ContactsPro API Server (Fastify)');
    console.log('   ========================================');
    console.log('   📡 Server: http://localhost:5000');
    console.log('   🗄️  Database: MongoDB Connected');
    console.log('   ⚡ Framework: Fastify (Fast!)');
    console.log('   📝 Version: 1.3.0');
    console.log('========================================== 🚀');
    console.log('');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle shutdown gracefully
const closeGracefully = async (signal) => {
  console.log(`\n🛑 Received signal ${signal}, closing server...`);
  await fastify.close();
  await mongoose.connection.close();
  console.log('✅ Server closed successfully');
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start the server
start();