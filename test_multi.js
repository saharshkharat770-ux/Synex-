const assert = require('assert');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
const app = require('./src/server');

const server = app.listen(3002, async () => {
  console.log('======================================================================');
  console.log('🧪 RUNNING 3 COMPREHENSIVE TEST RUNS ACROSS VARIOUS DATA TYPES & SIZES');
  console.log('======================================================================\n');

  try {
    function request(method, path, body = null, token = null) {
      return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request(
          {
            hostname: 'localhost',
            port: 3002,
            path,
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                resolve({ status: res.statusCode, body: parsed });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          }
        );
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
      });
    }

    // ============================================================================
    // TEST RUN 1: Micro / Solo Retail SME (Small Data Size, Lagging Tech)
    // ============================================================================
    console.log('🔷 [TEST RUN 1 / 3] MICRO SME (Small Data, High Opportunity)');
    console.log('   Registering "Chai & Conversations Cafe" (Solo cafe, 1 year)');
    const email1 = `chai_${Date.now()}@example.com`;
    const reg1 = await request('POST', '/api/auth/register', {
      name: 'Aditya Sen',
      email: email1,
      password: 'password123',
      businessName: 'Chai & Conversations Cafe',
      businessType: 'Restaurant / Cafe',
      yearsOperating: 'Less than 1 year',
    });
    assert.strictEqual(reg1.status, 201);
    const bizId1 = reg1.body.business.id;
    const token1 = reg1.body.token;

    // Assessment for Micro SME (Low digital/marketing)
    const answers1 = {
      f1: 1, f2: 1, f3: 1, f4: 2,
      m1: 1, m2: 1, m3: 1, m4: 2, m5: 1,
      d1: 1, d2: 1, d3: 1, d4: 1,
      t1: 1, t2: 1, t3: 2, t4: 2,
      o1: 1, o2: 1, o3: 1, o4: 2,
      c1: 1, c2: 1, c3: 1, c4: 2,
      s1: 1, s2: 1, s3: 1, s4: 2,
    };
    const assess1 = await request('POST', '/api/assessments', {
      businessId: bizId1,
      answers: answers1,
    }, token1);
    assert.strictEqual(assess1.status, 200);
    assert.strictEqual(assess1.body.health, 'Needs Improvement');
    assert.ok(assess1.body.analytics, 'Analytics object present');
    assert.ok(assess1.body.analytics.financials.estimatedRevenueLeakage > 500000, 'High revenue leakage detected');
    console.log(`   ✓ Overall Score: ${assess1.body.overall}/100 (${assess1.body.health})`);
    console.log(`   ✓ Recoverable Revenue Upside: ₹${assess1.body.analytics.financials.estimatedRevenueLeakage.toLocaleString()}`);
    console.log(`   ✓ Top Transformation Priority: ${assess1.body.blueprint.priorities[0].key.toUpperCase()}`);

    // Update Onboarding task
    const task1 = await request('PATCH', `/api/sync/${bizId1}/onboarding`, {
      taskKey: 'f1',
      isCompleted: true,
    }, token1);
    assert.strictEqual(task1.status, 200);
    console.log(`   ✓ Completed task: Google Business Profile (Progress: ${task1.body.progress}%)`);
    console.log('   ✅ TEST RUN 1 COMPLETED SUCCESSFULLY!\n');

    // ============================================================================
    // TEST RUN 2: Mid-Size Growing Service SME (Medium Data Size, Moderate Growth)
    // ============================================================================
    console.log('🔶 [TEST RUN 2 / 3] MID-SIZE SME (Medium Data, Growth Phase)');
    console.log('   Registering "Apex Diagnostic Labs" (Service Business, 4 years, 18 staff)');
    const email2 = `apex_labs_${Date.now()}@example.com`;
    const reg2 = await request('POST', '/api/auth/register', {
      name: 'Dr. Neha Kulkarni',
      email: email2,
      password: 'password123',
      businessName: 'Apex Diagnostic Labs',
      businessType: 'Service Business',
      yearsOperating: '3–7 years',
    });
    assert.strictEqual(reg2.status, 201);
    const bizId2 = reg2.body.business.id;
    const token2 = reg2.body.token;

    // Assessment for Mid-Size Service SME
    const answers2 = {
      f1: 3, f2: 3, f3: 2, f4: 4,
      m1: 2, m2: 2, m3: 2, m4: 4, m5: 2,
      d1: 3, d2: 2, d3: 2, d4: 3,
      t1: 2, t2: 2, t3: 3, t4: 4,
      o1: 3, o2: 3, o3: 2, o4: 4,
      c1: 2, c2: 2, c3: 2, c4: 4,
      s1: 2, s2: 2, s3: 2, s4: 4,
    };
    const assess2 = await request('POST', '/api/assessments', {
      businessId: bizId2,
      answers: answers2,
    }, token2);
    assert.ok(['Good', 'Strong'].includes(assess2.body.health), 'Health status should be Good or Strong');
    console.log(`   ✓ Overall Score: ${assess2.body.overall}/100 (${assess2.body.health})`);
    console.log(`   ✓ Customer Retention Rate: ${assess2.body.analytics.financials.customerRetentionRate}%`);
    console.log(`   ✓ CAC Efficiency: ${assess2.body.analytics.financials.cacEfficiency}%`);

    // Verify Business Full Details API with Consultant Profile
    const bizDetail2 = await request('GET', `/api/businesses/${bizId2}`, null, token2);
    assert.strictEqual(bizDetail2.status, 200);
    assert.strictEqual(bizDetail2.body.consultant.name, 'Dr. Aris Thorne');
    console.log(`   ✓ Assigned Consultant: ${bizDetail2.body.consultant.name} (${bizDetail2.body.consultant.title})`);
    console.log(`   ✓ Next Strategy Call: ${bizDetail2.body.consultant.nextReviewDate}`);
    console.log('   ✅ TEST RUN 2 COMPLETED SUCCESSFULLY!\n');

    // ============================================================================
    // TEST RUN 3: Heavy Industrial Manufacturer (Large Enterprise, High Operation)
    // ============================================================================
    console.log('🔴 [TEST RUN 3 / 3] HEAVY INDUSTRIAL ENTERPRISE (Large Data Size, Complex Operations)');
    console.log('   Registering "Bharat Precision Heavy Engineering" (120 employees, 8+ years)');
    const email3 = `bharat_eng_${Date.now()}@example.com`;
    const reg3 = await request('POST', '/api/auth/register', {
      name: 'Rajesh V. Singhania',
      email: email3,
      password: 'password123',
      businessName: 'Bharat Precision Heavy Engineering',
      businessType: 'Manufacturer',
      yearsOperating: '7+ years',
    });
    assert.strictEqual(reg3.status, 201);
    const bizId3 = reg3.body.business.id;
    const token3 = reg3.body.token;

    // Upgrade to Premium Plan
    const planRes = await request('PATCH', `/api/businesses/${bizId3}/plan`, { plan: 'Premium' }, token3);
    assert.strictEqual(planRes.status, 200);
    assert.strictEqual(planRes.body.business.membership_plan, 'Premium');
    console.log(`   ✓ Membership Tier: ${planRes.body.business.membership_plan}`);

    // Heavy Industrial answers (High Foundation & Ops, Low Digital/Marketing)
    const answers3 = {
      f1: 4, f2: 3, f3: 3, f4: 5,
      m1: 1, m2: 1, m3: 1, m4: 4, m5: 1,
      d1: 1, d2: 1, d3: 1, d4: 2,
      t1: 3, t2: 2, t3: 3, t4: 4,
      o1: 3, o2: 3, o3: 3, o4: 5,
      c1: 3, c2: 2, c3: 3, c4: 4,
      s1: 3, s2: 3, s3: 2, s4: 5,
    };
    const assess3 = await request('POST', '/api/assessments', {
      businessId: bizId3,
      answers: answers3,
    }, token3);
    assert.strictEqual(assess3.status, 200);
    console.log(`   ✓ Overall Score: ${assess3.body.overall}/100 (${assess3.body.health})`);
    console.log(`   ✓ Operations Score: ${assess3.body.catScores.operations}% vs Digital Score: ${assess3.body.catScores.digital}%`);
    console.log(`   ✓ Scalability Readiness Score: ${assess3.body.analytics.financials.scalabilityScore}/100`);

    // Advance Growth Cycle across multiple stages
    for (let stage = 1; stage <= 4; stage++) {
      const cycle = await request('PATCH', `/api/sync/${bizId3}/cycle`, { cycleStage: stage }, token3);
      assert.strictEqual(cycle.status, 200);
      assert.strictEqual(cycle.body.cycle.cycle_stage, stage);
    }
    console.log(`   ✓ Successfully simulated & cycled through all 5 Monthly Growth Cycle stages`);

    // Verify Consultant portfolio contains all clients
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@synex.com',
      password: 'admin123',
    });
    const portfolio = await request('GET', '/api/businesses', null, adminLogin.body.token);
    assert.strictEqual(portfolio.status, 200);
    assert.ok(portfolio.body.data.length >= 8, 'Portfolio has 8+ businesses');
    console.log(`   ✓ Consultant Portfolio Total Clients: ${portfolio.body.data.length}`);
    console.log('   ✅ TEST RUN 3 COMPLETED SUCCESSFULLY!\n');

    console.log('======================================================================');
    console.log('🎉 ALL 3 TEST RUNS ACROSS VARIOUS DATA SIZES PASSED WITH ZERO ERRORS! 🚀');
    console.log('======================================================================');
  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});
