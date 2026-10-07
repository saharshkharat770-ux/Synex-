const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Default tasks for new businesses
const DEFAULT_ONBOARD_TASKS = [
  { key: 'f1', day: 'Day 1–5 · Foundation Setup', text: 'Complete Google Business Profile' },
  { key: 'f2', day: 'Day 1–5 · Foundation Setup', text: 'Define target customer' },
  { key: 'f3', day: 'Day 6–15 · Analysis & Strategy', text: 'Review current marketing' },
  { key: 'f4', day: 'Day 6–15 · Analysis & Strategy', text: 'Set up lead tracking' },
  { key: 'f5', day: 'Day 16–30 · Implementation', text: 'Create first growth campaign' },
];

/**
 * POST /api/auth/register
 * Register a new user and (optionally) their business
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role = 'client', phone, businessName, businessType, yearsOperating } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const emailNorm = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    const userRes = insertUser.run(name.trim(), emailNorm, passwordHash, role === 'consultant' ? 'consultant' : 'client', phone || null);
    const userId = userRes.lastInsertRowid;

    let business = null;
    if (role !== 'consultant') {
      const bName = businessName ? businessName.trim() : `${name}'s Business`;
      const bType = businessType || 'Other';
      const bYears = yearsOperating || '1–3 years';

      const insertBiz = db.prepare(`
        INSERT INTO businesses (user_id, name, owner_name, business_type, years_operating, membership_plan, assigned_consultant)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const bizRes = insertBiz.run(userId, bName, name.trim(), bType, bYears, 'Basic', 'Dr. Aris Thorne (SYNEX)');
      const bizId = bizRes.lastInsertRowid;

      // Seed onboarding tasks
      const insertTask = db.prepare(`
        INSERT INTO onboarding_tasks (business_id, task_key, phase_group, text, is_completed)
        VALUES (?, ?, ?, ?, 0)
      `);
      DEFAULT_ONBOARD_TASKS.forEach(t => {
        insertTask.run(bizId, t.key, t.day, t.text);
      });

      // Seed growth cycle
      db.prepare(`
        INSERT INTO growth_cycles (business_id, cycle_stage, stage_name, notes)
        VALUES (?, 0, 'Collect Data', 'Welcome to SYNEX! Beginning Stage 1 of monthly growth cycle.')
      `).run(bizId);

      business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(bizId);
    }

    const token = jwt.sign({ id: userId, email: emailNorm, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: { id: userId, name: name.trim(), email: emailNorm, role, phone },
      business,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email & password
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const emailNorm = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailNorm);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let business = null;
    if (user.role !== 'consultant') {
      business = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(user.id);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      business,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Get currently authenticated user and business info
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    let business = null;
    let latestAssessment = null;

    if (req.user.role !== 'consultant') {
      business = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(req.user.id);
      if (business) {
        latestAssessment = db.prepare(`
          SELECT * FROM assessments WHERE business_id = ? ORDER BY created_at DESC LIMIT 1
        `).get(business.id);
        if (latestAssessment) {
          latestAssessment.category_scores = JSON.parse(latestAssessment.category_scores);
          latestAssessment.answers = JSON.parse(latestAssessment.answers);
        }
      }
    }

    res.json({
      success: true,
      user: req.user,
      business,
      latestAssessment,
    });
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving session information.' });
  }
});

module.exports = router;
