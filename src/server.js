const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./db/database');
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const assessmentRoutes = require('./routes/assessments');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware: Helmet with contentSecurityPolicy: false for full interactive SPA functionality
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Enable CORS
app.use(cors());

// Body Parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

// Mount API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/businesses', apiLimiter, businessRoutes);
app.use('/api/assessments', apiLimiter, assessmentRoutes);
app.use('/api/sync', apiLimiter, syncRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const bizCount = db.prepare('SELECT COUNT(*) as count FROM businesses').get().count;
    const assessCount = db.prepare('SELECT COUNT(*) as count FROM assessments').get().count;

    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected (SQLite WAL)',
      records: {
        users: userCount,
        businesses: bizCount,
        assessments: assessCount,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Database summary stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT b.id, b.name, b.business_type, b.membership_plan, a.overall_score
      FROM businesses b
      LEFT JOIN assessments a ON a.business_id = b.id
    `).all();

    res.json({
      success: true,
      totalClients: clients.length,
      clients,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route to serve the frontend for SPA navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 SYNEX Fast & Secure Backend running on port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`💼 Seeded with 5 SME clients & Consultant account`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
