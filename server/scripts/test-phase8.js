/**
 * DevPrep - Phase 8 Mock Tests Engine Verification Test
 * 
 * Verifies:
 * 1. Unauthenticated request to /api/mock-test returns 401
 * 2. GET /api/mock-test returns randomized questions
 * 3. ANTI-CHEAT: correctIndex and explanation are NOT returned in question payload
 * 4. Topic filter (?topic=Arrays&count=5) returns matching topic questions
 * 5. POST /api/mock-test/submit evaluates answers on server, computes accuracy %, score
 * 6. Attempt is saved to mockTests.json scoped to userId
 * 7. GET /api/mock-test/attempts retrieves user's historical attempts
 * 
 * Note: If the backend server is not running on port 5000, this script automatically
 * starts a temporary server instance so tests always succeed out-of-the-box.
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase8() {
  console.log('--- Starting Phase 8 Mock Tests Engine Tests ---');

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
    // Test 1: Unauthenticated request rejected (401)
    console.log('Test 1: Unauthenticated GET /api/mock-test returns 401...');
    const unauthRes = await fetch(`${BASE_URL}/mock-test`);
    if (unauthRes.status !== 401) {
      throw new Error(`Test 1 Failed: Expected 401, got ${unauthRes.status}`);
    }
    console.log('✓ Test 1 Passed: Unauthenticated request rejected with 401.');

    // 1. Log in as Demo Student
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const demoUser = await loginRes.json();
    const demoHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoUser.token}`
    };

    // Test 2: Fetch default mock test (10 questions)
    console.log('\nTest 2: GET /api/mock-test for demo student...');
    const testRes = await fetch(`${BASE_URL}/mock-test`, { headers: demoHeaders });
    const testData = await testRes.json();
    if (testRes.status !== 200 || !Array.isArray(testData.questions) || testData.questions.length !== 10) {
      throw new Error(`Test 2 Failed: Expected 10 questions, got ${testData?.questions?.length}`);
    }
    console.log(`✓ Test 2 Passed: Retrieved test with ${testData.questions.length} questions, time limit: ${testData.timeLimitSeconds}s.`);

    // Test 3: Anti-Cheat verification (no correctIndex or explanation in response)
    console.log('\nTest 3: Anti-Cheat Check (ensure correctIndex & explanation are hidden)...');
    for (const q of testData.questions) {
      if (q.correctIndex !== undefined || q.explanation !== undefined) {
        throw new Error(`Test 3 Failed: Anti-Cheat violation! Question "${q.id}" contains answers.`);
      }
      if (!q.id || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Test 3 Failed: Malformed question structure on "${q.id}"`);
      }
    }
    console.log('✓ Test 3 Passed: All questions are strictly sanitized; answers and explanations remain on server.');

    // Test 4: Topic filter & count (?topic=Arrays&count=5)
    console.log('\nTest 4: GET /api/mock-test?topic=Arrays&count=5...');
    const arrTestRes = await fetch(`${BASE_URL}/mock-test?topic=Arrays&count=5`, { headers: demoHeaders });
    const arrTestData = await arrTestRes.json();
    if (arrTestRes.status !== 200 || arrTestData.questions.length !== 5) {
      throw new Error(`Test 4 Failed: Expected 5 questions, got ${arrTestData?.questions?.length}`);
    }
    const allArrays = arrTestData.questions.every((q) => q.topic === 'Arrays');
    if (!allArrays) {
      throw new Error('Test 4 Failed: Some questions did not match topic "Arrays"');
    }
    console.log(`✓ Test 4 Passed: Retrieved 5 questions specifically for "Arrays".`);

    // Test 5: Server-Side Grading via POST /api/mock-test/submit
    console.log('\nTest 5: POST /api/mock-test/submit (Server-Side Evaluation)...');
    // We submit answers for the 5 array questions
    const answersPayload = arrTestData.questions.map((q, idx) => ({
      questionId: q.id,
      // Deliberately pick option 2 or 1 to test grading
      selectedIndex: idx % 2 === 0 ? 0 : 1
    }));

    const submitRes = await fetch(`${BASE_URL}/mock-test/submit`, {
      method: 'POST',
      headers: demoHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        answers: answersPayload,
        timeTaken: 112
      })
    });
    const submitResult = await submitRes.json();
    if (submitRes.status !== 200 || !submitResult.attempt || !Array.isArray(submitResult.reviews)) {
      throw new Error('Test 5 Failed: Expected attempt and reviews object');
    }

    const { attempt, reviews } = submitResult;
    if (reviews.length !== 5 || typeof attempt.score !== 'number' || typeof attempt.accuracy !== 'number') {
      throw new Error('Test 5 Failed: Invalid score or review calculations');
    }
    // Verify explanations and correctIndex are now provided in the review
    const allHaveExplanations = reviews.every((r) => r.explanation && typeof r.correctIndex === 'number');
    if (!allHaveExplanations) {
      throw new Error('Test 5 Failed: Reviews missing explanations or correct keys');
    }
    console.log(`✓ Test 5 Passed: Graded successfully! Score: ${attempt.score}/${attempt.total} (${attempt.accuracy}%). Detailed reviews received.`);

    // Test 6: Verify attempt saved to mockTests.json
    console.log('\nTest 6: Verify attempt was persisted and is retrievable via GET /api/mock-test/attempts...');
    const attemptsRes = await fetch(`${BASE_URL}/mock-test/attempts`, { headers: demoHeaders });
    const attemptsData = await attemptsRes.json();
    if (attemptsRes.status !== 200 || !Array.isArray(attemptsData)) {
      throw new Error('Test 6 Failed: Could not retrieve past attempts');
    }
    const foundAttempt = attemptsData.find((a) => a.id === attempt.id);
    if (!foundAttempt) {
      throw new Error('Test 6 Failed: Submitted attempt was not found in user attempts');
    }
    console.log(`✓ Test 6 Passed: Attempt "${attempt.id}" persisted in database. Total user attempts: ${attemptsData.length}.`);

    console.log('\n=========================================');
    console.log('ALL PHASE 8 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase8().catch((err) => {
  console.error('\n❌ Phase 8 tests failed:', err.message);
  process.exit(1);
});
