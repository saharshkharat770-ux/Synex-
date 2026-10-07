const assert = require('assert');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
const app = require('./src/server');

const server = app.listen(3001, async () => {
  console.log('🧪 Starting SYNEX Backend Verification Test Suite...\n');

  try {
    // Helper for HTTP requests
    function request(method, path, body = null, token = null) {
      return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request(
          {
            hostname: 'localhost',
            port: 3001,
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

    // 1. Health check
    console.log('Test 1: GET /api/health');
    const health = await request('GET', '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'healthy');
    assert.strictEqual(health.body.database, 'connected (SQLite WAL)');
    assert.ok(health.body.records.businesses >= 5, 'Must have at least 5 businesses in database');
    console.log(`✅ Health check passed: ${health.body.records.businesses} businesses in database.`);

    // 2. Consultant Login
    console.log('\nTest 2: POST /api/auth/login (Consultant)');
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@synex.com',
      password: 'admin123',
    });
    assert.strictEqual(adminLogin.status, 200);
    assert.strictEqual(adminLogin.body.user.role, 'consultant');
    assert.ok(adminLogin.body.token, 'Token must be present');
    const consultantToken = adminLogin.body.token;
    console.log('✅ Consultant login passed.');

    // 3. Client Login
    console.log('\nTest 3: POST /api/auth/login (Client: Shree Traders)');
    const clientLogin = await request('POST', '/api/auth/login', {
      email: 'shree@synex.com',
      password: 'password123',
    });
    assert.strictEqual(clientLogin.status, 200);
    assert.strictEqual(clientLogin.body.user.role, 'client');
    assert.strictEqual(clientLogin.body.business.name, 'Shree Traders');
    const clientToken = clientLogin.body.token;
    console.log(`✅ Client login passed: Logged in as ${clientLogin.body.business.name}`);

    // 4. Invalid Login
    console.log('\nTest 4: Invalid Credentials check');
    const badLogin = await request('POST', '/api/auth/login', {
      email: 'shree@synex.com',
      password: 'wrong_password',
    });
    assert.strictEqual(badLogin.status, 401);
    console.log('✅ Invalid password correctly rejected with 401.');

    // 5. Consultant views all businesses
    console.log('\nTest 5: GET /api/businesses (Consultant view)');
    const bizList = await request('GET', '/api/businesses', null, consultantToken);
    assert.strictEqual(bizList.status, 200);
    assert.ok(bizList.body.data.length >= 5, 'Must list at least 5 businesses');
    console.log(`✅ Consultant retrieved ${bizList.body.data.length} client businesses.`);
    bizList.body.data.forEach((b) => {
      console.log(`   - [ID ${b.id}] ${b.name} (${b.type}) | Score: ${b.score}/100 [${b.health}] | Priority: ${b.topPriority}`);
    });

    // 6. Register a new Client
    console.log('\nTest 6: POST /api/auth/register (New SME Registration)');
    const testEmail = `newbiz_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Rohan Deshmukh',
      email: testEmail,
      password: 'securePass123',
      businessName: 'Deshmukh Electronics',
      businessType: 'Retail Store',
      yearsOperating: '1–3 years',
      phone: '+91 99999 88888',
    });
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regRes.body.business.name, 'Deshmukh Electronics');
    const newBizId = regRes.body.business.id;
    const newToken = regRes.body.token;
    console.log(`✅ Registered new business: ${regRes.body.business.name} (ID: ${newBizId})`);

    // 7. Submit Health Check Assessment
    console.log('\nTest 7: POST /api/assessments (Health Check scoring & blueprint)');
    const sampleAnswers = {
      f1: 2, f2: 3, f3: 2, f4: 4,
      m1: 2, m2: 2, m3: 1, m4: 3, m5: 1,
      d1: 2, d2: 1, d3: 2, d4: 2,
      t1: 2, t2: 2, t3: 3, t4: 4,
      o1: 2, o2: 3, o3: 2, o4: 3,
      c1: 2, c2: 2, c3: 2, c4: 4,
      s1: 3, s2: 2, s3: 1, s4: 4,
    };
    const assessRes = await request('POST', '/api/assessments', {
      businessId: newBizId,
      answers: sampleAnswers,
    }, newToken);
    assert.strictEqual(assessRes.status, 200);
    assert.ok(assessRes.body.overall > 0, 'Overall score computed');
    assert.ok(assessRes.body.blueprint.priorities.length === 3, 'Blueprint generated 3 priorities');
    console.log(`✅ Health check scored: Overall = ${assessRes.body.overall}/100 (${assessRes.body.health})`);
    console.log(`   Top priority: ${assessRes.body.blueprint.priorities[0].key} - ${assessRes.body.blueprint.priorities[0].problem}`);

    // 8. Toggle onboarding task
    console.log('\nTest 8: PATCH /api/sync/:id/onboarding (Task progress)');
    const taskRes = await request('PATCH', `/api/sync/${newBizId}/onboarding`, {
      taskKey: 'f1',
      isCompleted: true,
    }, newToken);
    assert.strictEqual(taskRes.status, 200);
    assert.strictEqual(taskRes.body.completedCount, 1);
    assert.strictEqual(taskRes.body.progress, 20);
    console.log(`✅ Onboarding task updated: 1/5 tasks done (20% progress)`);

    // 9. Advance monthly growth cycle
    console.log('\nTest 9: PATCH /api/sync/:id/cycle (Monthly Growth Cycle)');
    const cycleRes = await request('PATCH', `/api/sync/${newBizId}/cycle`, {
      cycleStage: 2,
    }, newToken);
    assert.strictEqual(cycleRes.status, 200);
    assert.strictEqual(cycleRes.body.cycle.cycle_stage, 2);
    assert.strictEqual(cycleRes.body.cycle.stage_name, 'Growth Report');
    console.log(`✅ Growth cycle advanced to Stage 3: ${cycleRes.body.cycle.stage_name}`);

    console.log('\n🎉 ALL 9 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});
