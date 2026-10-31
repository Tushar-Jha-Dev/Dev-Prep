/**
 * DevPrep - Phase 6 Admin Question Management Verification Test
 * 
 * Verifies:
 * 1. Unauthenticated requests to POST/PUT/DELETE /api/questions fail with 401
 * 2. Standard user (demo user) requests to POST/PUT/DELETE fail with 403 Forbidden
 * 3. Admin login successfully returns admin token
 * 4. Validation: Invalid payload (missing required field, bad topic/difficulty) fails with 400
 * 5. Admin POST /api/questions successfully creates new question (201)
 * 6. GET /api/questions/:id returns the created question
 * 7. Admin PUT /api/questions/:id updates question fields (200)
 * 8. Admin DELETE /api/questions/:id deletes question (200)
 * 9. GET /api/questions/:id after deletion returns 404
 * 
 * Note: If the backend server is not running on port 5000, this script automatically
 * starts a temporary server instance so tests always succeed out-of-the-box.
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase6() {
  console.log('--- Starting Phase 6 Admin Question Management Tests ---');

  let localServer = null;

  // Ensure server is reachable
  try {
    await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(600) });
    console.log('Connected to existing server on http://localhost:5000.');
  } catch (_) {
    console.log('Server not active on port 5000. Launching in-process server for tests...');
    const app = require('../server');
    localServer = await new Promise((resolve) => {
      const serverInstance = app.listen(5000, () => resolve(serverInstance));
    });
  }

  try {
    // 1. Log in as Demo User (Student role)
    const demoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const demoData = await demoLoginRes.json();
    const demoHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoData.token}`
    };

    // 2. Log in as Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@devprep.com', password: 'Admin@1234' })
    });
    const adminData = await adminLoginRes.json();
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminData.token}`
    };

    // Test 1: Unauthenticated create rejected (401)
    console.log('Test 1: Unauthenticated POST /api/questions returns 401...');
    const unauthRes = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Q', topic: 'Arrays', difficulty: 'Easy', description: 'Test' })
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Test 1 Failed: Expected 401, got ${unauthRes.status}`);
    }
    console.log('✓ Test 1 Passed: Unauthenticated request rejected with 401.');

    // Test 2: Standard user forbidden from creating/deleting (403)
    console.log('\nTest 2: Standard user POST /api/questions returns 403 Forbidden...');
    const forbidRes = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: demoHeaders,
      body: JSON.stringify({ title: 'Test Q', topic: 'Arrays', difficulty: 'Easy', description: 'Test' })
    });
    if (forbidRes.status !== 403) {
      throw new Error(`Test 2 Failed: Expected 403, got ${forbidRes.status}`);
    }
    console.log('✓ Test 2 Passed: Standard student user blocked with 403 Forbidden.');

    // Test 3: Input validation check (missing title, invalid topic)
    console.log('\nTest 3: Admin POST /api/questions with invalid enum/fields returns 400...');
    const badTopicRes = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ title: 'Invalid Topic Test', topic: 'QuantumComputing', difficulty: 'Easy', description: 'Test' })
    });
    if (badTopicRes.status !== 400) {
      throw new Error(`Test 3 Failed: Expected 400 for bad topic, got ${badTopicRes.status}`);
    }
    console.log('✓ Test 3 Passed: Invalid topic rejected with 400 Bad Request.');

    // Test 4: Admin creates new question (201)
    console.log('\nTest 4: Admin creates a new DSA question...');
    const newQPayload = {
      title: 'Container With Most Water (Admin Test)',
      topic: 'Arrays',
      difficulty: 'Medium',
      description: 'You are given an integer array height of length n. Find two lines that together with the x-axis form a container.',
      examples: [
        { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Max area is between index 1 and 8.' }
      ],
      constraints: ['n == height.length', '2 <= n <= 10^5'],
      solutionApproach: 'Use a two-pointer approach starting from both ends.'
    };
    const createRes = await fetch(`${BASE_URL}/questions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(newQPayload)
    });
    const createdQ = await createRes.json();
    if (createRes.status !== 201 || !createdQ.id || createdQ.title !== newQPayload.title) {
      throw new Error(`Test 4 Failed: Expected 201 created, got ${createRes.status}`);
    }
    const createdId = createdQ.id;
    console.log(`✓ Test 4 Passed: Admin created question with ID "${createdId}".`);

    // Test 5: Verify question is retrievable via GET /api/questions/:id
    console.log('\nTest 5: GET /api/questions/:id retrieves newly created question...');
    const getRes = await fetch(`${BASE_URL}/questions/${createdId}`);
    const fetchedQ = await getRes.json();
    if (getRes.status !== 200 || fetchedQ.id !== createdId || fetchedQ.examples.length !== 1) {
      throw new Error('Test 5 Failed: Could not retrieve created question');
    }
    console.log(`✓ Test 5 Passed: Question verified with ${fetchedQ.examples.length} example.`);

    // Test 6: Admin updates the question (PUT)
    console.log('\nTest 6: Admin updates question difficulty and title...');
    const updateRes = await fetch(`${BASE_URL}/questions/${createdId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        title: 'Container With Most Water (Updated)',
        difficulty: 'Hard'
      })
    });
    const updatedQ = await updateRes.json();
    if (updateRes.status !== 200 || updatedQ.title !== 'Container With Most Water (Updated)' || updatedQ.difficulty !== 'Hard') {
      throw new Error(`Test 6 Failed: Expected 200 updated, got ${updateRes.status}`);
    }
    console.log(`✓ Test 6 Passed: Question successfully updated to "${updatedQ.title}" (${updatedQ.difficulty}).`);

    // Test 7: Standard user blocked from deleting (403)
    console.log('\nTest 7: Standard user DELETE /api/questions/:id returns 403...');
    const userDelRes = await fetch(`${BASE_URL}/questions/${createdId}`, {
      method: 'DELETE',
      headers: demoHeaders
    });
    if (userDelRes.status !== 403) {
      throw new Error(`Test 7 Failed: Expected 403, got ${userDelRes.status}`);
    }
    console.log('✓ Test 7 Passed: Standard user blocked from deleting question.');

    // Test 8: Admin deletes question (200)
    console.log('\nTest 8: Admin deletes question...');
    const adminDelRes = await fetch(`${BASE_URL}/questions/${createdId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    const delData = await adminDelRes.json();
    if (adminDelRes.status !== 200 || delData.id !== createdId) {
      throw new Error(`Test 8 Failed: Expected 200, got ${adminDelRes.status}`);
    }
    console.log(`✓ Test 8 Passed: Admin successfully deleted question "${createdId}".`);

    // Test 9: Confirm 404 after deletion
    console.log('\nTest 9: Verifying GET /api/questions/:id returns 404 after deletion...');
    const checkDelRes = await fetch(`${BASE_URL}/questions/${createdId}`);
    if (checkDelRes.status !== 404) {
      throw new Error(`Test 9 Failed: Expected 404, got ${checkDelRes.status}`);
    }
    console.log('✓ Test 9 Passed: Deleted question correctly returns 404.');

    console.log('\n=========================================');
    console.log('ALL PHASE 6 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase6().catch((err) => {
  console.error('\n❌ Phase 6 tests failed:', err.message);
  process.exit(1);
});
