const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { optionalToken } = require('../middleware/auth');

const CYCLE_STAGES = [
  'Collect Data',
  'Analyze Performance',
  'Growth Report',
  'Strategy Meeting',
  'Execute Improvements',
];

/**
 * PATCH /api/businesses/:id/onboarding
 * Toggle or update an onboarding task's completion
 */
router.patch('/:id/onboarding', optionalToken, (req, res) => {
  try {
    const bizId = req.params.id;
    const { taskKey, isCompleted } = req.body;

    if (!taskKey) {
      return res.status(400).json({ success: false, message: 'taskKey is required.' });
    }

    const completedVal = isCompleted ? 1 : 0;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    const update = db.prepare(`
      UPDATE onboarding_tasks
      SET is_completed = ?, completed_at = ?
      WHERE business_id = ? AND task_key = ?
    `).run(completedVal, completedAt, bizId, taskKey);

    if (update.changes === 0) {
      // If task didn't exist yet, insert it
      db.prepare(`
        INSERT INTO onboarding_tasks (business_id, task_key, phase_group, text, is_completed, completed_at)
        VALUES (?, ?, 'Custom Task', 'Onboarding Task', ?, ?)
      `).run(bizId, taskKey, completedVal, completedAt);
    }

    const tasks = db.prepare('SELECT * FROM onboarding_tasks WHERE business_id = ? ORDER BY id ASC').all(bizId);
    const total = tasks.length;
    const done = tasks.filter(t => t.is_completed === 1).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    res.json({
      success: true,
      tasks,
      completedCount: done,
      totalCount: total,
      progress,
    });
  } catch (err) {
    console.error('Update onboarding task error:', err);
    res.status(500).json({ success: false, message: 'Server error updating task.' });
  }
});

/**
 * PATCH /api/businesses/:id/cycle
 * Advance or set the monthly growth cycle stage
 */
router.patch('/:id/cycle', optionalToken, (req, res) => {
  try {
    const bizId = req.params.id;
    let { cycleStage } = req.body;

    const current = db.prepare('SELECT * FROM growth_cycles WHERE business_id = ?').get(bizId);

    if (cycleStage === undefined || cycleStage === null) {
      const currentStage = current ? current.cycle_stage : 0;
      cycleStage = (currentStage + 1) % 5;
    } else {
      cycleStage = Math.max(0, Math.min(4, parseInt(cycleStage, 10)));
    }

    const stageName = CYCLE_STAGES[cycleStage];

    if (current) {
      db.prepare(`
        UPDATE growth_cycles
        SET cycle_stage = ?, stage_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE business_id = ?
      `).run(cycleStage, stageName, bizId);
    } else {
      db.prepare(`
        INSERT INTO growth_cycles (business_id, cycle_stage, stage_name, notes)
        VALUES (?, ?, ?, 'Monthly growth cycle initiated')
      `).run(bizId, cycleStage, stageName);
    }

    const updated = db.prepare('SELECT * FROM growth_cycles WHERE business_id = ?').get(bizId);

    res.json({
      success: true,
      cycle: updated,
    });
  } catch (err) {
    console.error('Update cycle error:', err);
    res.status(500).json({ success: false, message: 'Server error updating cycle stage.' });
  }
});

/**
 * PATCH /api/businesses/:id/roadmap-phase
 * Set active 90-day roadmap phase (1, 2, or 3)
 */
router.patch('/:id/roadmap-phase', optionalToken, (req, res) => {
  try {
    const bizId = req.params.id;
    const { phase } = req.body;
    const validPhase = Math.max(1, Math.min(3, parseInt(phase, 10) || 1));

    db.prepare(`
      UPDATE blueprints
      SET roadmap_phase = ?, updated_at = CURRENT_TIMESTAMP
      WHERE business_id = ?
    `).run(validPhase, bizId);

    const blueprint = db.prepare('SELECT * FROM blueprints WHERE business_id = ?').get(bizId);

    res.json({
      success: true,
      phase: validPhase,
      blueprint: blueprint ? { ...blueprint, priorities: JSON.parse(blueprint.priorities) } : null,
    });
  } catch (err) {
    console.error('Update roadmap phase error:', err);
    res.status(500).json({ success: false, message: 'Server error updating roadmap phase.' });
  }
});

module.exports = router;
