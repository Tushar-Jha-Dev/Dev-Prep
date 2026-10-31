/**
 * DevPrep - Phase 5B Solutions API Verification Test
 * 
 * Verifies:
 * 1. GET /api/solutions -> returns user's saved solution summary
 * 2. GET /api/solutions/:questionId -> returns saved code for question
 * 3. PUT /api/solutions/:questionId -> saves new code or updates existing
 * 4. Question 404: saving for invalid question returns 404
 * 5. Invalid language: saving with unlisted language returns 400
 * 6. Code length cap: code exceeding 20,000 chars returns 400
 * 7. Multi-tenant privacy: User B cannot view or modify User A's solutions
 * 8. DELETE /api/solutions/:questionId?language=... -> removes language solution
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase5B() {
  console.log('--- Starting Phase 5B Solutions API Tests ---');

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
    // 1. Log in as Demo User (Account A)
    const loginARes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const userA = await loginARes.json();
    const headersA = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userA.token}`
    };

    // Test 1: GET /api/solutions (seeded solution check)
    console.log('Test 1: GET /api/solutions for Demo User...');
    const listRes = await fetch(`${BASE_URL}/solutions`, { headers: headersA });
    const listData = await listRes.json();
    if (listRes.status !== 200 || !Array.isArray(listData)) {
      throw new Error('Test 1 Failed: Expected array of solutions');
    }
    const hasTwoSum = listData.some((s) => s.questionId === 'q-arr-1' && s.language === 'JavaScript');
    if (!hasTwoSum) {
      throw new Error('Test 1 Failed: Seeded solution for Two Sum not found');
    }
    console.log(`✓ Test 1 Passed: Retrieved ${listData.length} saved solution record(s).`);

    // Test 2: GET /api/solutions/q-arr-1
    console.log('\nTest 2: GET /api/solutions/q-arr-1 (Two Sum)...');
    const qSolRes = await fetch(`${BASE_URL}/solutions/q-arr-1`, { headers: headersA });
    const qSolData = await qSolRes.json();
    if (qSolRes.status !== 200 || !qSolData.some((s) => s.language === 'JavaScript')) {
      throw new Error('Test 2 Failed: Did not retrieve JavaScript code for Two Sum');
    }
    console.log(`✓ Test 2 Passed: Retrieved code for Two Sum (${qSolData[0].code.length} chars).`);

    // Test 3: PUT /api/solutions/q-arr-1 (Save Python solution)
    console.log('\nTest 3: PUT /api/solutions/q-arr-1 (Save Python solution)...');
    const pyCode = 'def twoSum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        if target - num in lookup:\n            return [lookup[target - num], i]\n        lookup[num] = i\n    return []';
    const saveRes = await fetch(`${BASE_URL}/solutions/q-arr-1`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({ language: 'Python', code: pyCode })
    });
    const saveData = await saveRes.json();
    if (saveRes.status !== 200 || saveData.language !== 'Python') {
      throw new Error(`Test 3 Failed: Expected 200, got ${saveRes.status}`);
    }
    console.log('✓ Test 3 Passed: Python solution saved successfully.');

    // Test 4: Question 404 validation
    console.log('\nTest 4: Non-existent question ID returns 404...');
    const fakeRes = await fetch(`${BASE_URL}/solutions/non-existent-question-id`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({ language: 'Python', code: 'print("hello")' })
    });
    if (fakeRes.status !== 404) {
      throw new Error(`Test 4 Failed: Expected 404, got ${fakeRes.status}`);
    }
    console.log('✓ Test 4 Passed: Non-existent question correctly returned 404.');

    // Test 5: Invalid language validation (400)
    console.log('\nTest 5: Invalid language returns 400...');
    const badLangRes = await fetch(`${BASE_URL}/solutions/q-arr-1`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({ language: 'Rust', code: 'fn main() {}' })
    });
    if (badLangRes.status !== 400) {
      throw new Error(`Test 5 Failed: Expected 400, got ${badLangRes.status}`);
    }
    console.log('✓ Test 5 Passed: Invalid language rejected with 400.');

    // Test 6: Code max length cap (400)
    console.log('\nTest 6: Code exceeding 20,000 characters returns 400...');
    const longCode = 'a'.repeat(20001);
    const longRes = await fetch(`${BASE_URL}/solutions/q-arr-1`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({ language: 'JavaScript', code: longCode })
    });
    if (longRes.status !== 400) {
      throw new Error(`Test 6 Failed: Expected 400, got ${longRes.status}`);
    }
    console.log('✓ Test 6 Passed: Oversized code payload rejected with 400.');

    // Test 7: Multi-Tenant Data Privacy (User B cannot see User A's code)
    console.log('\nTest 7: User Isolation Check...');
    const rand = Math.floor(Math.random() * 10000);
    const signupB = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student B',
        email: `studentB${rand}@test.com`,
        password: 'Password123'
      })
    });
    const userB = await signupB.json();
    const headersB = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userB.token}`
    };

    // User B fetches solutions for q-arr-1
    const bFetchRes = await fetch(`${BASE_URL}/solutions/q-arr-1`, { headers: headersB });
    const bFetchData = await bFetchRes.json();
    if (bFetchRes.status !== 200 || bFetchData.length !== 0) {
      throw new Error(`Test 7 Failed: User B was able to see User A's solutions! Length: ${bFetchData.length}`);
    }
    console.log("✓ Test 7 Passed: User B's solution list is empty (User A's code is strictly private).");

    // Test 8: DELETE /api/solutions/q-arr-1?language=Python
    console.log('\nTest 8: Delete specific language solution...');
    const delRes = await fetch(`${BASE_URL}/solutions/q-arr-1?language=Python`, {
      method: 'DELETE',
      headers: headersA
    });
    if (delRes.status !== 200) {
      throw new Error(`Test 8 Failed: Expected 200, got ${delRes.status}`);
    }

    // Verify Python is gone but JavaScript remains
    const checkRes = await fetch(`${BASE_URL}/solutions/q-arr-1`, { headers: headersA });
    const checkData = await checkRes.json();
    const hasPy = checkData.some((s) => s.language === 'Python');
    const hasJs = checkData.some((s) => s.language === 'JavaScript');
    if (hasPy || !hasJs) {
      throw new Error('Test 8 Failed: Python was not removed or JavaScript was accidentally deleted');
    }
    console.log('✓ Test 8 Passed: Python solution deleted, JavaScript preserved.');

    console.log('\n=========================================');
    console.log('ALL PHASE 5B TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase5B().catch((err) => {
  console.error('\n❌ Phase 5B tests failed:', err.message);
  process.exit(1);
});
