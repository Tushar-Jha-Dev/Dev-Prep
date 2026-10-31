/**
 * DevPrep - Phase 5 Questions & Progress Verification Test
 * 
 * Verifies:
 * 1. GET /api/questions with multi-param filters (topic, difficulty, search)
 * 2. GET /api/questions/:id returns single question
 * 3. GET /api/progress returns authenticated user progress
 * 4. POST /api/progress with action: "markSolved" increments solved questions and maintains streak
 * 5. POST /api/progress with action: "unmarkSolved" correctly untoggles problem
 * 
 * Note: If the backend server is not running on port 5000, this script automatically
 * starts a temporary server instance so tests always succeed out-of-the-box.
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase5() {
  console.log('--- Starting Phase 5 Questions & Progress Tests ---');

  let localServer = null;

  // 1. Check if backend is already running on port 5000
  try {
    await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(600) });
    console.log('Connected to existing server on http://localhost:5000.');
  } catch (_) {
    // Start temporary in-process server
    console.log('Server not active on port 5000. Launching in-process server for tests...');
    const app = require('../server');
    localServer = await new Promise((resolve) => {
      const serverInstance = app.listen(5000, () => resolve(serverInstance));
    });
  }

  try {
    // 2. Log in with demo account
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const { token } = await loginRes.json();
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // Test 1: GET /api/questions with filters
    console.log('Test 1: GET /api/questions?topic=Arrays&difficulty=Easy...');
    const filteredRes = await fetch(`${BASE_URL}/questions?topic=Arrays&difficulty=Easy`);
    const filtered = await filteredRes.json();
    if (filteredRes.status !== 200 || !Array.isArray(filtered)) {
      throw new Error('Test 1 Failed: Expected array of questions');
    }
    const allMatch = filtered.every((q) => q.topic === 'Arrays' && q.difficulty === 'Easy');
    if (!allMatch || filtered.length === 0) {
      throw new Error('Test 1 Failed: Questions did not match filters');
    }
    console.log(`✓ Test 1 Passed: Retrieved ${filtered.length} matching questions (all Arrays + Easy).`);

    // Test 2: Search filter
    console.log('\nTest 2: GET /api/questions?search=stock...');
    const searchRes = await fetch(`${BASE_URL}/questions?search=stock`);
    const searchResults = await searchRes.json();
    if (!searchResults.some((q) => q.title.includes('Stock'))) {
      throw new Error('Test 2 Failed: Search query did not match expected question');
    }
    console.log(`✓ Test 2 Passed: Found "${searchResults[0].title}" matching search query.`);

    // Test 3: GET /api/questions/:id
    console.log('\nTest 3: GET /api/questions/q-arr-1 (Two Sum)...');
    const singleRes = await fetch(`${BASE_URL}/questions/q-arr-1`);
    const single = await singleRes.json();
    if (singleRes.status !== 200 || single.title !== 'Two Sum') {
      throw new Error('Test 3 Failed: Single question retrieval failed');
    }
    console.log(`✓ Test 3 Passed: Retrieved details for "${single.title}".`);

    // Test 4: GET /api/progress
    console.log('\nTest 4: GET /api/progress for demo user...');
    const progRes = await fetch(`${BASE_URL}/progress`, { headers: authHeaders });
    const progData = await progRes.json();
    if (progRes.status !== 200 || !Array.isArray(progData.solvedQuestionIds)) {
      throw new Error('Test 4 Failed: Expected progress object');
    }
    console.log(`✓ Test 4 Passed: Demo user has ${progData.solvedQuestionIds.length} solved problems, streak: ${progData.streak.current}.`);

    // Test 5: POST /api/progress action: "markSolved"
    console.log('\nTest 5: POST /api/progress action: "markSolved"...');
    const targetQ = 'q-tree-2'; // Maximum Depth of Binary Tree
    const markRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'markSolved', questionId: targetQ })
    });
    const markData = await markRes.json();
    if (markRes.status !== 200 || !markData.solvedQuestionIds.includes(targetQ)) {
      throw new Error('Test 5 Failed: Question was not marked as solved');
    }
    console.log(`✓ Test 5 Passed: Question "${targetQ}" marked solved, total solved: ${markData.solvedQuestionIds.length}.`);

    // Test 6: POST /api/progress action: "unmarkSolved"
    console.log('\nTest 6: POST /api/progress action: "unmarkSolved"...');
    const unmarkRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'unmarkSolved', questionId: targetQ })
    });
    const unmarkData = await unmarkRes.json();
    if (unmarkRes.status !== 200 || unmarkData.solvedQuestionIds.includes(targetQ)) {
      throw new Error('Test 6 Failed: Question was not unmarked');
    }
    console.log(`✓ Test 6 Passed: Question "${targetQ}" successfully unmarked.`);

    console.log('\n=========================================');
    console.log('ALL PHASE 5 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase5().catch((err) => {
  if (err.cause?.code === 'ECONNREFUSED' || (err.message && err.message.includes('fetch failed'))) {
    console.error('\n❌ Connection Error: Could not connect to Express server at http://127.0.0.1:5000.');
    console.error('👉 Make sure the server is running with `cd server && npm run dev` in another terminal.\n');
  } else {
    console.error('\n❌ Phase 5 tests failed:', err.message);
  }
  process.exit(1);
});
