const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, optionalToken } = require('../middleware/auth');
const { healthLabel, CATEGORY_META, generateBusinessAnalytics } = require('../scoring');

const CONSULTANT_PROFILE = {
  name: 'Dr. Aris Thorne',
  title: 'Senior Director of SME Growth & Digital Transformation',
  firm: 'SYNEX Advisory & Growth Partners',
  credentials: 'Ex-McKinsey SME Practice · 15+ Yrs Advisory · 240+ Businesses Transformed',
  phone: '+91 22 6120 4400',
  whatsapp: '+91 98201 99887',
  email: 'aris.thorne@synex.com',
  availability: '🟢 Active & Available for Priority Reviews',
  nextReviewDate: 'Tuesday, Oct 14, 2026 at 3:30 PM',
  reviewAgenda: 'Phase 1 Foundation Audit & Paid Lead Pipeline Verification',
};

/**
 * GET /api/businesses
 * List businesses (all for consultant, own for client)
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'consultant') {
      const businesses = db.prepare(`
        SELECT 
          b.*,
          u.email as owner_email,
          u.phone as owner_phone
        FROM businesses b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.id ASC
      `).all();

      const enriched = businesses.map((b) => {
        const latestAssessment = db.prepare(`
          SELECT overall_score, category_scores, created_at
          FROM assessments 
          WHERE business_id = ? 
          ORDER BY created_at DESC LIMIT 1
        `).get(b.id);

        const blueprint = db.prepare(`
          SELECT priorities, roadmap_phase
          FROM blueprints
          WHERE business_id = ?
        `).get(b.id);

        const taskStats = db.prepare(`
          SELECT 
            COUNT(*) as total_tasks,
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_tasks
          FROM onboarding_tasks
          WHERE business_id = ?
        `).get(b.id);

        const cycle = db.prepare(`
          SELECT cycle_stage, stage_name
          FROM growth_cycles
          WHERE business_id = ?
        `).get(b.id);

        let topPriority = 'Assessment Pending';
        let overallScore = latestAssessment ? latestAssessment.overall_score : null;
        let health = overallScore != null ? healthLabel(overallScore) : { label: 'Pending', cls: 'health-pending' };

        if (blueprint && blueprint.priorities) {
          try {
            const parsed = JSON.parse(blueprint.priorities);
            if (parsed.length > 0) {
              const pKey = parsed[0].key;
              topPriority = CATEGORY_META[pKey] ? CATEGORY_META[pKey].label : pKey;
            }
          } catch (e) {}
        }

        let analytics = null;
        if (latestAssessment && latestAssessment.category_scores) {
          try {
            const scores = JSON.parse(latestAssessment.category_scores);
            analytics = generateBusinessAnalytics(scores, b.business_type, b.name);
          } catch (e) {}
        }

        return {
          id: b.id,
          name: b.name,
          owner: b.owner_name,
          email: b.owner_email,
          phone: b.owner_phone,
          type: b.business_type,
          years: b.years_operating,
          plan: b.membership_plan,
          consultant: CONSULTANT_PROFILE,
          score: overallScore,
          health: health.label,
          healthCls: health.cls,
          topPriority,
          onboardingProgress: taskStats && taskStats.total_tasks > 0 
            ? Math.round((taskStats.completed_tasks / taskStats.total_tasks) * 100) 
            : 0,
          cycleStage: cycle ? cycle.cycle_stage : 0,
          cycleName: cycle ? cycle.stage_name : 'Collect Data',
          analytics,
        };
      });

      return res.json({ success: true, count: enriched.length, data: enriched });
    }

    // Client: return their business
    const clientBiz = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(req.user.id);
    if (!clientBiz) {
      return res.json({ success: true, count: 0, data: [] });
    }

    res.json({ success: true, count: 1, data: [clientBiz] });
  } catch (err) {
    console.error('List businesses error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving businesses.' });
  }
});

/**
 * GET /api/businesses/:id
 * Retrieve comprehensive details for a specific business, including analytics & consultant info
 */
router.get('/:id', optionalToken, (req, res) => {
  try {
    const bizId = req.params.id;
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(bizId);

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Authorization check if user is logged in and not consultant
    if (req.user && req.user.role !== 'consultant' && business.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Get latest assessment
    const latestAssessment = db.prepare(`
      SELECT * FROM assessments WHERE business_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(bizId);

    let analytics = null;
    if (latestAssessment) {
      latestAssessment.category_scores = JSON.parse(latestAssessment.category_scores);
      latestAssessment.answers = JSON.parse(latestAssessment.answers);
      analytics = generateBusinessAnalytics(latestAssessment.category_scores, business.business_type, business.name);
    }

    // Get blueprint
    const blueprint = db.prepare('SELECT * FROM blueprints WHERE business_id = ?').get(bizId);
    if (blueprint) {
      blueprint.priorities = JSON.parse(blueprint.priorities);
    }

    // Get onboarding tasks
    const tasks = db.prepare('SELECT * FROM onboarding_tasks WHERE business_id = ? ORDER BY id ASC').all(bizId);

    // Get growth cycle
    const cycle = db.prepare('SELECT * FROM growth_cycles WHERE business_id = ?').get(bizId);

    res.json({
      success: true,
      business,
      consultant: CONSULTANT_PROFILE,
      assessment: latestAssessment,
      blueprint,
      tasks,
      cycle,
      analytics,
    });
  } catch (err) {
    console.error('Get business error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving business details.' });
  }
});

/**
 * POST /api/businesses
 * Create or update discovery info
 */
router.post('/', optionalToken, (req, res) => {
  try {
    const { name, owner, type, years, plan = 'Basic' } = req.body;

    if (!name || !owner || !type || !years) {
      return res.status(400).json({ success: false, message: 'Name, owner, type, and years are required.' });
    }

    let userId = req.user ? req.user.id : null;

    const insertBiz = db.prepare(`
      INSERT INTO businesses (user_id, name, owner_name, business_type, years_operating, membership_plan, assigned_consultant)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertBiz.run(userId, name.trim(), owner.trim(), type, years, plan, 'Dr. Aris Thorne (SYNEX)');
    const bizId = result.lastInsertRowid;

    // Default tasks
    const DEFAULT_ONBOARD_TASKS = [
      { key: 'f1', day: 'Day 1–5 · Foundation Setup', text: 'Complete Google Business Profile' },
      { key: 'f2', day: 'Day 1–5 · Foundation Setup', text: 'Define target customer' },
      { key: 'f3', day: 'Day 6–15 · Analysis & Strategy', text: 'Review current marketing' },
      { key: 'f4', day: 'Day 6–15 · Analysis & Strategy', text: 'Set up lead tracking' },
      { key: 'f5', day: 'Day 16–30 · Implementation', text: 'Create first growth campaign' },
    ];

    const insertTask = db.prepare(`
      INSERT INTO onboarding_tasks (business_id, task_key, phase_group, text, is_completed)
      VALUES (?, ?, ?, ?, 0)
    `);
    DEFAULT_ONBOARD_TASKS.forEach(t => insertTask.run(bizId, t.key, t.day, t.text));

    db.prepare(`
      INSERT INTO growth_cycles (business_id, cycle_stage, stage_name, notes)
      VALUES (?, 0, 'Collect Data', 'Initial business discovery completed.')
    `).run(bizId);

    const created = db.prepare('SELECT * FROM businesses WHERE id = ?').get(bizId);
    res.status(201).json({ success: true, business: created, consultant: CONSULTANT_PROFILE });
  } catch (err) {
    console.error('Create business error:', err);
    res.status(500).json({ success: false, message: 'Server error saving business profile.' });
  }
});

/**
 * PATCH /api/businesses/:id/plan
 * Update membership plan
 */
router.patch('/:id/plan', authenticateToken, (req, res) => {
  try {
    const { plan } = req.body;
    const bizId = req.params.id;

    if (!['Basic', 'Professional', 'Premium'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan. Choose Basic, Professional, or Premium.' });
    }

    db.prepare('UPDATE businesses SET membership_plan = ? WHERE id = ?').run(plan, bizId);
    const updated = db.prepare('SELECT * FROM businesses WHERE id = ?').get(bizId);

    res.json({ success: true, message: `Membership plan updated to ${plan}`, business: updated });
  } catch (err) {
    console.error('Update plan error:', err);
    res.status(500).json({ success: false, message: 'Error updating plan.' });
  }
});

module.exports = router;
