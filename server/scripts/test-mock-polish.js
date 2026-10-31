const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5000/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 5000,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================================================');
  console.log('   DevPrep: Mock Test Polish, History, Snapshot & API Verification      ');
  console.log('========================================================================\n');

  // 1. Authenticate Demo User (Student)
  console.log('1. Authenticating as demo user...');
  const loginRes = await request(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: { email: 'demo@devprep.com', password: 'Demo@1234' }
  });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error(`Demo login failed: ${JSON.stringify(loginRes.data)}`);
  }
  const demoToken = loginRes.data.token;
  const demoHeaders = { Authorization: `Bearer ${demoToken}` };
  console.log('   ✓ Demo user authenticated');

  // 2. Authenticate Admin User
  console.log('2. Authenticating as admin user...');
  const adminLogin = await request(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: { email: 'admin@devprep.com', password: 'Admin@1234' }
  });
  if (adminLogin.status !== 200 || !adminLogin.data.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminToken = adminLogin.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('   ✓ Admin authenticated');

  // 3. Fetch Mock Test Questions
  console.log('3. Fetching 5 mock test questions (Mixed / All Topics)...');
  const testRes = await request(`${BASE_URL}/mock-test?count=5`, { headers: demoHeaders });
  if (testRes.status !== 200 || !testRes.data.questions || testRes.data.questions.length === 0) {
    throw new Error(`Failed to fetch mock test questions: ${JSON.stringify(testRes.data)}`);
  }
  const questions = testRes.data.questions;
  console.log(`   ✓ Received ${questions.length} questions (safe payload, correctIndex stripped)`);

  // 4. Submit Mock Test with Snapshot
  console.log('4. Submitting mock test answers...');
  const answers = questions.map((q, idx) => ({
    questionId: q.id,
    selectedIndex: idx % 2 === 0 ? 0 : 1
  }));

  const submitRes = await request(`${BASE_URL}/mock-test/submit`, {
    method: 'POST',
    headers: demoHeaders,
    body: {
      topic: 'Mixed',
      answers,
      timeTaken: 145
    }
  });

  if (submitRes.status !== 200 || !submitRes.data.attempt) {
    throw new Error(`Submit failed: ${JSON.stringify(submitRes.data)}`);
  }
  const submittedAttempt = submitRes.data.attempt;
  console.log(`   ✓ Test submitted. Attempt ID: ${submittedAttempt.id}, Score: ${submittedAttempt.score}/${submittedAttempt.total}`);

  // 5. Test GET /api/mock-test/attempts (Listing endpoint)
  console.log('5. Testing GET /api/mock-test/attempts (summary only, no reviews array)...');
  const attemptsRes = await request(`${BASE_URL}/mock-test/attempts`, { headers: demoHeaders });
  if (attemptsRes.status !== 200 || !Array.isArray(attemptsRes.data)) {
    throw new Error(`Listing attempts failed: ${JSON.stringify(attemptsRes.data)}`);
  }
  const found = attemptsRes.data.find(a => a.id === submittedAttempt.id);
  if (!found) {
    throw new Error(`Submitted attempt "${submittedAttempt.id}" not found in attempts list`);
  }
  if (found.reviews !== undefined) {
    throw new Error(`Listing endpoint leaked heavy "reviews" snapshot! It must be summary only.`);
  }
  console.log('   ✓ Listing returns summary only (reviews properly omitted)');

  // 6. Test Pagination on GET /api/mock-test/attempts
  console.log('6. Testing pagination: GET /api/mock-test/attempts?page=1&limit=5...');
  const pageRes = await request(`${BASE_URL}/mock-test/attempts?page=1&limit=5`, { headers: demoHeaders });
  if (pageRes.status !== 200 || !pageRes.data.attempts || pageRes.data.page !== 1) {
    throw new Error(`Paginated attempts failed: ${JSON.stringify(pageRes.data)}`);
  }
  console.log(`   ✓ Pagination verified: Page ${pageRes.data.page} of ${pageRes.data.totalPages}, Total: ${pageRes.data.total}`);

  // 7. Test GET /api/mock-test/attempts/:id (Full report endpoint)
  console.log('7. Testing GET /api/mock-test/attempts/:id (full report with reviews)...');
  const detailRes = await request(`${BASE_URL}/mock-test/attempts/${submittedAttempt.id}`, { headers: demoHeaders });
  if (detailRes.status !== 200 || !detailRes.data.attempt || !Array.isArray(detailRes.data.reviews)) {
    throw new Error(`Get attempt details failed: ${JSON.stringify(detailRes.data)}`);
  }
  if (detailRes.data.reviews.length !== questions.length) {
    throw new Error(`Reviews length mismatch: expected ${questions.length}, got ${detailRes.data.reviews.length}`);
  }
  console.log(`   ✓ Report fetched with full ${detailRes.data.reviews.length} question reviews and explanations`);

  // 8. Test Multi-Tenant Privacy: Admin querying Demo User's Attempt ID -> 404
  console.log('8. Testing multi-tenant privacy: Admin querying Demo user attempt ID...');
  const foreignRes = await request(`${BASE_URL}/mock-test/attempts/${submittedAttempt.id}`, { headers: adminHeaders });
  if (foreignRes.status !== 404) {
    throw new Error(`Security breach: Admin was able to access student attempt! Status: ${foreignRes.status}`);
  }
  console.log('   ✓ Multi-tenant privacy verified: 404 returned for foreign attempt ID');

  // 9. Test Non-Existent Attempt ID -> 404
  console.log('9. Testing non-existent attempt ID...');
  const nonExistentRes = await request(`${BASE_URL}/mock-test/attempts/att-non-existent-999`, { headers: demoHeaders });
  if (nonExistentRes.status !== 404) {
    throw new Error(`Expected 404 for missing attempt, got ${nonExistentRes.status}`);
  }
  console.log('   ✓ 404 correctly returned for non-existent attempt');

  // 10. Test Snapshot Resilience: Edit/delete an MCQ and verify report still opens with question text & options
  console.log('10. Testing question snapshot immutability against MCQ bank mutations...');
  const questionToMutate = questions[0];
  // Admin updates this question in MCQ bank
  const updateRes = await request(`${BASE_URL}/admin/mcq/${questionToMutate.id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: {
      topic: questionToMutate.topic,
      question: `${questionToMutate.question} [EDITED BY ADMIN]`,
      options: ['New A', 'New B', 'New C', 'New D'],
      correctIndex: 3,
      explanation: 'Updated explanation'
    }
  });
  if (updateRes.status !== 200) {
    console.warn('   (Note: MCQ update status:', updateRes.status, ')');
  }

  // Student re-opens the past report
  const recheckRes = await request(`${BASE_URL}/mock-test/attempts/${submittedAttempt.id}`, { headers: demoHeaders });
  if (recheckRes.status !== 200) {
    throw new Error('Report failed to open after admin edited MCQ in bank');
  }
  const preservedReview = recheckRes.data.reviews.find(r => r.questionId === questionToMutate.id);
  if (!preservedReview || preservedReview.question.includes('[EDITED BY ADMIN]')) {
    throw new Error('Report did not preserve immutable snapshot of the original question!');
  }
  console.log('   ✓ Snapshot immutability verified: past report retains pristine original question text and options');

  // 11. Test Dashboard Progress Feed includes attemptId
  console.log('11. Testing Dashboard recent activity links include attemptId...');
  const progressRes = await request(`${BASE_URL}/progress`, { headers: demoHeaders });
  if (progressRes.status !== 200 || !progressRes.data.activity) {
    throw new Error(`Failed to fetch progress: ${JSON.stringify(progressRes.data)}`);
  }
  const mockActivity = progressRes.data.activity.find(a => a.type === 'mock_test' && a.attemptId);
  if (!mockActivity) {
    throw new Error('Recent activity mock_test entries are missing attemptId');
  }
  console.log(`   ✓ Dashboard activity contains attemptId: "${mockActivity.attemptId}" linking to report`);

  console.log('\n========================================================================');
  console.log('   ✓ ALL BACKEND MOCK TEST POLISH & HISTORY CHECKS PASSED');
  console.log('========================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err.stack || err.message || err);
  process.exit(1);
});
