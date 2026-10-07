const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../synex.db');
const db = new Database(dbPath);

// Enable WAL mode for high speed and concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client', -- 'client' or 'consultant'
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      business_type TEXT NOT NULL,
      years_operating TEXT NOT NULL,
      membership_plan TEXT DEFAULT 'Basic',
      assigned_consultant TEXT DEFAULT 'Dr. Aris Thorne (SYNEX)',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      overall_score INTEGER NOT NULL,
      category_scores TEXT NOT NULL, -- JSON string
      answers TEXT NOT NULL,          -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blueprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL UNIQUE,
      assessment_id INTEGER,
      priorities TEXT NOT NULL,      -- JSON string
      roadmap_phase INTEGER DEFAULT 1,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      task_key TEXT NOT NULL,         -- 'f1', 'f2', etc.
      phase_group TEXT NOT NULL,
      text TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      completed_at DATETIME,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
      UNIQUE(business_id, task_key)
    );

    CREATE TABLE IF NOT EXISTS growth_cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL UNIQUE,
      cycle_stage INTEGER DEFAULT 0,  -- 0: Collect, 1: Analyze, 2: Report, 3: Strategy, 4: Execute
      stage_name TEXT DEFAULT 'Collect Data',
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
  `);
}

function seedDefaultData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding initial SYNEX database with 5 clients + 1 consultant...');

  const { buildBlueprint } = require('../scoring');
  const passwordHash = bcrypt.hashSync('password123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  // 1. Consultant User
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const consultantRes = insertUser.run(
    'Dr. Aris Thorne',
    'admin@synex.com',
    adminPasswordHash,
    'consultant',
    '+1 (555) 019-2834'
  );

  // Default Standard Onboarding Tasks
  const DEFAULT_ONBOARD_TASKS = [
    { key: 'f1', day: 'Day 1–5 · Foundation Setup', text: 'Complete Google Business Profile' },
    { key: 'f2', day: 'Day 1–5 · Foundation Setup', text: 'Define target customer' },
    { key: 'f3', day: 'Day 6–15 · Analysis & Strategy', text: 'Review current marketing' },
    { key: 'f4', day: 'Day 6–15 · Analysis & Strategy', text: 'Set up lead tracking' },
    { key: 'f5', day: 'Day 16–30 · Implementation', text: 'Create first growth campaign' },
  ];

  const CYCLE_STAGES = [
    'Collect Data',
    'Analyze Performance',
    'Growth Report',
    'Strategy Meeting',
    'Execute Improvements',
  ];

  // 5 Seeded Businesses (from PDF Business Model Canvas & mock profiles)
  const seedBusinesses = [
    {
      name: 'Shree Traders',
      owner: 'Rakesh Patil',
      email: 'shree@synex.com',
      type: 'Retail Store',
      years: '3–7 years',
      plan: 'Professional',
      phone: '+91 98201 12345',
      scores: {
        foundation: 72,
        marketing: 55,
        digital: 45,
        technology: 68,
        operations: 75,
        customer: 80,
        strategy: 70,
      },
      overall: 67,
      completedTasks: ['f1', 'f2'],
      cycleStage: 1,
    },
    {
      name: 'Coastal Bites Cafe',
      owner: 'Ananya Sharma',
      email: 'coastal@synex.com',
      type: 'Restaurant / Cafe',
      years: '1–3 years',
      plan: 'Basic',
      phone: '+91 98450 67890',
      scores: {
        foundation: 60,
        marketing: 38,
        digital: 52,
        technology: 40,
        operations: 50,
        customer: 55,
        strategy: 42,
      },
      overall: 48,
      completedTasks: ['f1'],
      cycleStage: 0,
    },
    {
      name: 'Patil Fabricators',
      owner: 'Suresh Patil',
      email: 'patil@synex.com',
      type: 'Manufacturer',
      years: '7+ years',
      plan: 'Premium',
      phone: '+91 98333 45678',
      scores: {
        foundation: 88,
        marketing: 78,
        digital: 82,
        technology: 62,
        operations: 85,
        customer: 88,
        strategy: 85,
      },
      overall: 81,
      completedTasks: ['f1', 'f2', 'f3', 'f4', 'f5'],
      cycleStage: 3,
    },
    {
      name: 'UrbanFit Studio',
      owner: 'Vikram Desai',
      email: 'urbanfit@synex.com',
      type: 'Service Business',
      years: '1–3 years',
      plan: 'Professional',
      phone: '+91 98111 22334',
      scores: {
        foundation: 68,
        marketing: 62,
        digital: 70,
        technology: 58,
        operations: 60,
        customer: 42,
        strategy: 55,
      },
      overall: 59,
      completedTasks: ['f1', 'f2', 'f3'],
      cycleStage: 2,
    },
    {
      name: 'Apex Logistics & Cargo',
      owner: 'Meera Nair',
      email: 'apex@synex.com',
      type: 'Service Business',
      years: '3–7 years',
      plan: 'Professional',
      phone: '+91 98765 43210',
      scores: {
        foundation: 80,
        marketing: 70,
        digital: 75,
        technology: 78,
        operations: 82,
        customer: 76,
        strategy: 58,
      },
      overall: 74,
      completedTasks: ['f1', 'f2', 'f3', 'f4'],
      cycleStage: 4,
    },
  ];

  const insertBusiness = db.prepare(`
    INSERT INTO businesses (user_id, name, owner_name, business_type, years_operating, membership_plan, assigned_consultant)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAssessment = db.prepare(`
    INSERT INTO assessments (business_id, overall_score, category_scores, answers)
    VALUES (?, ?, ?, ?)
  `);

  const insertBlueprint = db.prepare(`
    INSERT INTO blueprints (business_id, assessment_id, priorities, roadmap_phase, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertTask = db.prepare(`
    INSERT INTO onboarding_tasks (business_id, task_key, phase_group, text, is_completed, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertCycle = db.prepare(`
    INSERT INTO growth_cycles (business_id, cycle_stage, stage_name, notes)
    VALUES (?, ?, ?, ?)
  `);

  seedBusinesses.forEach((b) => {
    // 1. Create client user account
    const userRes = insertUser.run(
      b.owner,
      b.email,
      passwordHash,
      'client',
      b.phone
    );
    const userId = userRes.lastInsertRowid;

    // 2. Create business
    const bizRes = insertBusiness.run(
      userId,
      b.name,
      b.owner,
      b.type,
      b.years,
      b.plan,
      'Dr. Aris Thorne (SYNEX)'
    );
    const bizId = bizRes.lastInsertRowid;

    // 3. Create assessment
    const assessRes = insertAssessment.run(
      bizId,
      b.overall,
      JSON.stringify(b.scores),
      JSON.stringify({ seeded: true })
    );
    const assessId = assessRes.lastInsertRowid;

    // 4. Create blueprint from scores
    const blueprintData = buildBlueprint(b.scores);
    insertBlueprint.run(
      bizId,
      assessId,
      JSON.stringify(blueprintData.priorities),
      1,
      `Personalized growth roadmap generated for ${b.name}`
    );

    // 5. Create onboarding tasks with progress
    DEFAULT_ONBOARD_TASKS.forEach((t) => {
      const isDone = b.completedTasks.includes(t.key) ? 1 : 0;
      insertTask.run(
        bizId,
        t.key,
        t.day,
        t.text,
        isDone,
        isDone ? new Date().toISOString() : null
      );
    });

    // 6. Create growth cycle
    insertCycle.run(
      bizId,
      b.cycleStage,
      CYCLE_STAGES[b.cycleStage],
      `Currently executing stage ${b.cycleStage + 1}: ${CYCLE_STAGES[b.cycleStage]}`
    );
  });

  console.log('✅ Database seeded successfully with 5 client businesses and admin account!');
}

// Initialize tables and seed
initSchema();
seedDefaultData();

module.exports = db;
