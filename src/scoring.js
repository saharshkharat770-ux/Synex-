// SYNEX Scoring, Analytics & Blueprint Engine

const CATEGORY_META = {
  foundation: { label: 'Business Foundation', color: '#0F2A5C', icon: '🏛️' },
  marketing: { label: 'Marketing', color: '#F5821F', icon: '📢' },
  digital: { label: 'Digital Presence', color: '#1E8A5F', icon: '🌐' },
  technology: { label: 'Technology', color: '#5B4FBF', icon: '💻' },
  operations: { label: 'Operations', color: '#C77A1F', icon: '⚙️' },
  customer: { label: 'Customer Growth', color: '#C0432F', icon: '👥' },
  strategy: { label: 'Strategy', color: '#0E7C86', icon: '🎯' },
};

const INDUSTRY_BENCHMARKS = {
  'Retail Store': {
    foundation: 65,
    marketing: 52,
    digital: 48,
    technology: 55,
    operations: 62,
    customer: 68,
    strategy: 58,
    avgOverall: 58,
  },
  'Restaurant / Cafe': {
    foundation: 60,
    marketing: 45,
    digital: 58,
    technology: 42,
    operations: 52,
    customer: 64,
    strategy: 48,
    avgOverall: 53,
  },
  'Manufacturer': {
    foundation: 75,
    marketing: 40,
    digital: 35,
    technology: 65,
    operations: 78,
    customer: 62,
    strategy: 70,
    avgOverall: 61,
  },
  'Service Business': {
    foundation: 68,
    marketing: 60,
    digital: 62,
    technology: 65,
    operations: 64,
    customer: 60,
    strategy: 62,
    avgOverall: 63,
  },
  'Other': {
    foundation: 65,
    marketing: 50,
    digital: 50,
    technology: 55,
    operations: 60,
    customer: 60,
    strategy: 55,
    avgOverall: 56,
  },
};

const RECS = {
  marketing: {
    problem: 'Lead generation is inconsistent and marketing is not driving predictable growth.',
    actions: [
      'Define a target customer profile and core value message',
      'Set up a simple weekly content + promotion calendar',
      'Launch one paid channel test (Google or Meta ads) with a small budget',
      'Put a lead-tracking sheet in place so no enquiry is lost',
    ],
    impact: 'High',
    effort: 'Medium',
  },
  digital: {
    problem: 'Online visibility is limited, so potential customers cannot easily find or trust the business.',
    actions: [
      'Claim and fully complete the Google Business Profile with reviews',
      'Publish or refresh a high-converting one-page website with contact and offerings',
      'Establish a consistent posting rhythm on one core social channel',
      'Add customer review collection to the post-sale process',
    ],
    impact: 'High',
    effort: 'Medium',
  },
  technology: {
    problem: 'Manual, paper-based processes are slowing operations and losing customer data.',
    actions: [
      'Move core operations off paper into one simple integrated digital tool',
      'Set up a basic CRM or shared customer database',
      'Enable multiple digital payment methods (UPI, POS, online payment link)',
      'Train the team on the new tools over the first two weeks',
    ],
    impact: 'Medium',
    effort: 'Medium',
  },
  operations: {
    problem: 'Key processes rely on memory rather than documentation, creating inconsistency and risk.',
    actions: [
      'Document the 3–5 most repeated tasks as simple Standard Operating Procedure (SOP) checklists',
      'Introduce a weekly numbers review (sales, unit costs, footfall/tickets)',
      'Assign clear ownership for each documented process',
      'Review and tighten the highest-friction operational bottleneck first',
    ],
    impact: 'Medium',
    effort: 'Low',
  },
  customer: {
    problem: 'Customer relationships are not being tracked, so repeat business and referrals are left on the table.',
    actions: [
      'Start logging customer contact details and transaction history',
      'Introduce an automated feedback request after every purchase',
      'Launch a basic loyalty or repeat-visit incentive program',
      'Segment customers into new vs. repeat and track the ratio monthly',
    ],
    impact: 'Medium',
    effort: 'Low',
  },
  strategy: {
    problem: 'There is no clear, written growth direction to align day-to-day decisions against.',
    actions: [
      'Set one clear, measurable 12-month top-line growth target',
      'Break the annual target into quarterly milestone KPIs',
      'Schedule a monthly performance review against the plan',
      'Appoint SYNEX growth consultant to sanity-check progress and eliminate risks',
    ],
    impact: 'High',
    effort: 'Low',
  },
  foundation: {
    problem: 'The core target customer and business direction are not clearly defined yet.',
    actions: [
      'Write a one-paragraph description of your ideal customer profile (ICP)',
      'Clarify your unique selling proposition (USP) in one crisp sentence',
      'Put a lightweight one-page business plan in writing',
      'Revisit and recalibrate the plan every quarter',
    ],
    impact: 'Medium',
    effort: 'Low',
  },
};

const ASSESSMENT_STRUCTURE = [
  {
    key: 'foundation',
    questions: [
      { id: 'f1', type: 'choice', maxV: 4 },
      { id: 'f2', type: 'choice', maxV: 3 },
      { id: 'f3', type: 'choice', maxV: 3 },
      { id: 'f4', type: 'scale', maxV: 5 },
    ],
  },
  {
    key: 'marketing',
    questions: [
      { id: 'm1', type: 'choice', maxV: 3 },
      { id: 'm2', type: 'choice', maxV: 3 },
      { id: 'm3', type: 'choice', maxV: 3 },
      { id: 'm4', type: 'scale', maxV: 5 },
      { id: 'm5', type: 'choice', maxV: 3 },
    ],
  },
  {
    key: 'digital',
    questions: [
      { id: 'd1', type: 'choice', maxV: 3 },
      { id: 'd2', type: 'choice', maxV: 3 },
      { id: 'd3', type: 'choice', maxV: 3 },
      { id: 'd4', type: 'scale', maxV: 5 },
    ],
  },
  {
    key: 'technology',
    questions: [
      { id: 't1', type: 'choice', maxV: 3 },
      { id: 't2', type: 'choice', maxV: 3 },
      { id: 't3', type: 'choice', maxV: 3 },
      { id: 't4', type: 'scale', maxV: 5 },
    ],
  },
  {
    key: 'operations',
    questions: [
      { id: 'o1', type: 'choice', maxV: 3 },
      { id: 'o2', type: 'choice', maxV: 3 },
      { id: 'o3', type: 'choice', maxV: 3 },
      { id: 'o4', type: 'scale', maxV: 5 },
    ],
  },
  {
    key: 'customer',
    questions: [
      { id: 'c1', type: 'choice', maxV: 3 },
      { id: 'c2', type: 'choice', maxV: 3 },
      { id: 'c3', type: 'choice', maxV: 3 },
      { id: 'c4', type: 'scale', maxV: 5 },
    ],
  },
  {
    key: 'strategy',
    questions: [
      { id: 's1', type: 'choice', maxV: 3 },
      { id: 's2', type: 'choice', maxV: 3 },
      { id: 's3', type: 'choice', maxV: 3 },
      { id: 's4', type: 'scale', maxV: 5 },
    ],
  },
];

function computeScores(answers) {
  const catScores = {};
  ASSESSMENT_STRUCTURE.forEach((sec) => {
    let total = 0;
    let max = 0;
    sec.questions.forEach((q) => {
      const val = answers[q.id];
      if (val != null) {
        total += Number(val);
      }
      max += q.maxV;
    });
    const pct = max > 0 ? Math.round((total / max) * 100) : 0;
    catScores[sec.key] = pct;
  });

  const catValues = Object.values(catScores);
  const overall = catValues.length > 0
    ? Math.round(catValues.reduce((a, b) => a + b, 0) / catValues.length)
    : 0;

  return { overall, catScores };
}

function healthLabel(score) {
  if (score >= 75) return { label: 'Strong', cls: 'health-strong', statusText: 'Market Leader Position' };
  if (score >= 50) return { label: 'Good', cls: 'health-good', statusText: 'Solid Base with Growth Levers' };
  return { label: 'Needs Improvement', cls: 'health-weak', statusText: 'High Priority Transformation Needed' };
}

function buildBlueprint(catScores) {
  const sorted = Object.entries(catScores).sort((a, b) => a[1] - b[1]);
  const weakest = sorted.slice(0, 3).map((e) => e[0]);
  const strongest = sorted.slice(-2).map((e) => e[0]);
  const priorities = weakest.map((key) => ({
    key,
    ...RECS[key],
    score: catScores[key],
  }));

  return { priorities, strongest, weakest };
}

/**
 * Deep Business Analytics Engine
 * Computes deep diagnostic indicators, industry benchmarks, estimated financial upside, and risk factors
 */
function generateBusinessAnalytics(catScores, businessType = 'Retail Store', businessName = 'Client Business') {
  const benchmarks = INDUSTRY_BENCHMARKS[businessType] || INDUSTRY_BENCHMARKS['Other'];
  const overall = Math.round(Object.values(catScores).reduce((a, b) => a + b, 0) / Object.keys(catScores).length);

  // Financial Diagnostics
  const gap = Math.max(0, 100 - overall);
  // Estimated revenue leakage: higher gap = higher lost revenue recoverable
  const estimatedRevenueLeakage = Math.round((gap / 100) * 1250000); 
  const projectedGrowthPercent = Math.min(48, Math.max(14, Math.round(gap * 0.45)));

  // CAC Efficiency rating
  const marketingScore = catScores.marketing || 50;
  const cacEfficiency = Math.min(95, Math.max(35, Math.round(marketingScore * 0.95 + 10)));

  // Operational Friction Index
  const opsScore = catScores.operations || 50;
  const techScore = catScores.technology || 50;
  const operationalFrictionIndex = Math.max(10, Math.min(85, Math.round(100 - (opsScore * 0.6 + techScore * 0.4))));

  // Customer Retention Rate
  const custScore = catScores.customer || 50;
  const customerRetentionRate = Math.min(92, Math.max(38, Math.round(custScore * 0.65 + 30)));

  // Scalability Readiness
  const stratScore = catScores.strategy || 50;
  const scalabilityScore = Math.round((stratScore * 0.4 + techScore * 0.3 + opsScore * 0.3));

  // Category comparison vs benchmark
  const categoryComparison = {};
  Object.keys(catScores).forEach((k) => {
    const clientVal = catScores[k];
    const benchVal = benchmarks[k] || 50;
    categoryComparison[k] = {
      clientScore: clientVal,
      industryAvg: benchVal,
      variance: clientVal - benchVal,
      isAboveAvg: clientVal >= benchVal,
      dimension: CATEGORY_META[k].label,
      color: CATEGORY_META[k].color,
      icon: CATEGORY_META[k].icon,
    };
  });

  // SWOT Analysis
  const strengths = [];
  const weaknesses = [];
  const opportunities = [];
  const threats = [];

  Object.entries(catScores).forEach(([k, score]) => {
    const meta = CATEGORY_META[k];
    if (score >= 70) {
      strengths.push(`High competence in ${meta.label} (${score}%) — key competitive moat.`);
    } else if (score < 55) {
      weaknesses.push(`Underperforming ${meta.label} (${score}%) — causing efficiency friction.`);
      opportunities.push(`Automate and upgrade ${meta.label} for rapid +15-20% margin gain.`);
    }
  });

  if (catScores.digital < 60) {
    threats.push('Competitors with modern local SEO and active digital channels are capturing high-intent leads.');
  }
  if (catScores.technology < 55) {
    threats.push('Legacy manual tracking exposes operations to employee turnover and data loss.');
  }
  if (threats.length === 0) {
    threats.push('Market stagnation risk if innovation cadence slows over next 12 months.');
  }

  return {
    overallScore: overall,
    health: healthLabel(overall),
    benchmarks,
    categoryComparison,
    financials: {
      estimatedRevenueLeakage,
      projectedGrowthPercent,
      cacEfficiency,
      operationalFrictionIndex,
      customerRetentionRate,
      scalabilityScore,
    },
    swot: {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      opportunities: opportunities.slice(0, 3),
      threats: threats.slice(0, 2),
    },
  };
}

module.exports = {
  CATEGORY_META,
  INDUSTRY_BENCHMARKS,
  RECS,
  computeScores,
  healthLabel,
  buildBlueprint,
  generateBusinessAnalytics,
};
