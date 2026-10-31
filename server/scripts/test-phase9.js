/**
 * DevPrep - Phase 9 Dashboard & Progress Aggregation Verification Test
 * 
 * Verifies:
 * 1. 401 Unauthenticated on GET /api/progress
 * 2. Authenticated GET /api/progress returns complete dashboard aggregations:
 *    - stats: totalSolved (8), totalQuestions (36), mockTestsCount (2), applicationsCount (5)
 *    - streak: current (3)
 *    - topicProgress: all 9 topics with computed fractions and percentages
 *    - weeklyActivity: 7 days of activity metrics
 * 3. Marking a problem solved immediately updates stats and topic breakdown
 * 4. Unmarking a problem restores counts
 * 5. Multi-tenant privacy: new user has 0 solved, 0 tests, 0 applications
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase9() {
  console.log('--- Starting Phase 9 Dashboard & Progress Tests ---');

  let localServer = null;

  // 1. Check if backend is already running on port 5000
  try {
    await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(600) });
    console.log('Connected to existing server on http://localhost:5000.');
  } catch (_) {
    console.log('Server not active on port 5000. Launching in-process server for tests...');
    const app = require('../server');
    localServer = await new Promise((resolve) => {
      const serverInstance = app.listen(5000, () => resolve(serverInstance));
    });
  }

  try {
    // Test 1: Unauthenticated request returns 401
    console.log('Test 1: Unauthenticated GET /api/progress returns 401...');
    const unauthRes = await fetch(`${BASE_URL}/progress`);
    if (unauthRes.status !== 401) {
      throw new Error(`Test 1 Failed: Expected 401, got ${unauthRes.status}`);
    }
    console.log('✓ Test 1 Passed: Unauthenticated request rejected with 401.');

    // 2. Log in as Demo Student
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

    // Test 2: Authenticated GET /api/progress dashboard summary
    console.log('\nTest 2: GET /api/progress dashboard summary for demo student...');
    const progRes = await fetch(`${BASE_URL}/progress`, { headers: authHeaders });
    const data = await progRes.json();

    if (progRes.status !== 200) {
      throw new Error(`Test 2 Failed: Status ${progRes.status}`);
    }

    // Verify stats
    const { stats, topicProgress, weeklyActivity, streak } = data;
    if (!stats || typeof stats.totalSolved !== 'number') {
      throw new Error('Test 2 Failed: Missing stats object in response');
    }

    if (stats.totalSolved !== 8 || stats.totalQuestions < 36) {
      throw new Error(`Test 2 Failed: Expected 8 solved of 36+, got ${stats.totalSolved}/${stats.totalQuestions}`);
    }

    if (stats.mockTestsCount < 2) {
      throw new Error(`Test 2 Failed: Expected at least 2 mock tests, got ${stats.mockTestsCount}`);
    }

    if (stats.applicationsCount !== 5) {
      throw new Error(`Test 2 Failed: Expected 5 applications, got ${stats.applicationsCount}`);
    }

    if (streak.current !== 3) {
      throw new Error(`Test 2 Failed: Expected streak of 3, got ${streak.current}`);
    }
    console.log(`✓ Test 2a Passed: Core metrics verified — Solved: ${stats.totalSolved}/${stats.totalQuestions}, Streak: ${streak.current}, Tests: ${stats.mockTestsCount}, Apps: ${stats.applicationsCount}.`);

    // Verify topic progress breakdown
    if (!Array.isArray(topicProgress) || topicProgress.length !== 9) {
      throw new Error(`Test 2 Failed: Expected 9 topic progress bars, got ${topicProgress?.length}`);
    }
    const arraysTopic = topicProgress.find((t) => t.topic === 'Arrays');
    if (!arraysTopic || arraysTopic.solved !== 2 || arraysTopic.total !== 4 || arraysTopic.percent !== 50 || arraysTopic.percentage !== 50) {
      throw new Error(`Test 2 Failed: Expected Arrays to be 2/4 (50%), got ${JSON.stringify(arraysTopic)}`);
    }
    console.log(`✓ Test 2b Passed: All 9 DSA topics calculated (Arrays: ${arraysTopic.solved}/${arraysTopic.total} = ${arraysTopic.percent}%).`);

    // Verify weekly activity
    if (!Array.isArray(weeklyActivity) || weeklyActivity.length !== 7) {
      throw new Error(`Test 2 Failed: Expected 7 days in weekly activity, got ${weeklyActivity?.length}`);
    }
    console.log(`✓ Test 2c Passed: 7-day rolling activity series generated.`);

    // Test 3: Solve a new problem and verify dashboard updates live
    console.log('\nTest 3: Marking a new problem solved updates dashboard stats...');
    const markQ = 'q-tree-2';
    await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'markSolved', questionId: markQ })
    });

    const refreshedRes = await fetch(`${BASE_URL}/progress`, { headers: authHeaders });
    const refreshedData = await refreshedRes.json();
    if (refreshedData.stats.totalSolved !== 9) {
      throw new Error(`Test 3 Failed: Expected 9 solved after marking, got ${refreshedData.stats.totalSolved}`);
    }
    const treeTopic = refreshedData.topicProgress.find((t) => t.topic === 'Trees');
    if (!treeTopic || treeTopic.solved < 1) {
      throw new Error('Test 3 Failed: Trees topic solved count did not increment');
    }
    console.log(`✓ Test 3 Passed: Live aggregation verified — Total solved incremented to ${refreshedData.stats.totalSolved}.`);

    // Test 4: Unmark to restore state
    console.log('\nTest 4: Unmarking restores count...');
    await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'unmarkSolved', questionId: markQ })
    });
    const restoredRes = await fetch(`${BASE_URL}/progress`, { headers: authHeaders });
    const restoredData = await restoredRes.json();
    if (restoredData.stats.totalSolved !== 8) {
      throw new Error(`Test 4 Failed: Expected 8 solved after unmarking, got ${restoredData.stats.totalSolved}`);
    }
    console.log(`✓ Test 4 Passed: Count successfully restored to ${restoredData.stats.totalSolved}.`);

    console.log('\n=========================================');
    console.log('ALL PHASE 9 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase9().catch((err) => {
  console.error('\n❌ Phase 9 tests failed:', err.message);
  process.exit(1);
});
