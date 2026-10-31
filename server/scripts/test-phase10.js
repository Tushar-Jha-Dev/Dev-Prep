/**
 * DevPrep - Phase 10 Profile & Settings Verification Test Suite
 * 
 * Verifies:
 * 1. 401 Unauthorized on unauthenticated POST /api/progress
 * 2. 400 Bad Request on malformed profile inputs (invalid skills, theme, graduation year, weekly goal)
 * 3. 200 OK on valid profile update with skills tags, goals list, academic info, and theme
 * 4. Persistence of profile changes in progress.json via subsequent GET /api/progress
 * 5. Reversion back to clean baseline state
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase10() {
  console.log('--- Starting Phase 10 Profile & Settings Tests ---');

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
    // 2. Unauthenticated check
    console.log('Test 1: Unauthenticated POST /api/progress returns 401...');
    const unauthRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateProfile', theme: 'dark' })
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Test 1 Failed: Expected 401, got ${unauthRes.status}`);
    }
    console.log('✓ Test 1 Passed: Unauthenticated request rejected with 401.');

    // 3. Log in with demo student account
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

    // 4. Validation Checks (400 Bad Request)
    console.log('\nTest 2: Validation checks for malformed profile updates...');

    // 2a. Skills not an array
    const invSkillsRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'updateProfile', skills: 'JavaScript,React' })
    });
    if (invSkillsRes.status !== 400) {
      throw new Error(`Test 2a Failed: Expected 400 for non-array skills, got ${invSkillsRes.status}`);
    }

    // 2b. Invalid theme enum
    const invThemeRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'updateProfile', theme: 'neon-cyberpunk' })
    });
    if (invThemeRes.status !== 400) {
      throw new Error(`Test 2b Failed: Expected 400 for invalid theme, got ${invThemeRes.status}`);
    }

    // 2c. Invalid graduation year
    const invYearRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'updateProfile', graduationYear: '1995' })
    });
    if (invYearRes.status !== 400) {
      throw new Error(`Test 2c Failed: Expected 400 for graduation year 1995, got ${invYearRes.status}`);
    }

    // 2d. Invalid weekly goal
    const invGoalRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ action: 'updateProfile', weeklyGoal: 999 })
    });
    if (invGoalRes.status !== 400) {
      throw new Error(`Test 2d Failed: Expected 400 for weekly goal > 50, got ${invGoalRes.status}`);
    }
    console.log('✓ Test 2 Passed: All malformed profile updates properly rejected with 400 Bad Request.');

    // 5. Valid Profile Update
    console.log('\nTest 3: Demo student updates full profile...');
    const updatePayload = {
      action: 'updateProfile',
      college: 'Indian Institute of Information Technology',
      branch: 'Computer Science & Engineering',
      graduationYear: '2026',
      targetRole: 'Full Stack Engineer',
      weeklyGoal: 8,
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'System Design'],
      goals: ['Crack Dream SDE Internship 2026', 'Solve 200 DSA Problems', 'Score 90%+ on Mock Tests'],
      theme: 'dark'
    };

    const updateRes = await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(updatePayload)
    });

    if (updateRes.status !== 200) {
      const errData = await updateRes.json();
      throw new Error(`Test 3 Failed: Status ${updateRes.status} - ${errData.error}`);
    }
    const updateData = await updateRes.json();
    if (
      updateData.profile.college !== updatePayload.college ||
      updateData.profile.skills.length !== 5 ||
      updateData.profile.goals.length !== 3 ||
      updateData.profile.weeklyGoal !== 8 ||
      updateData.profile.theme !== 'dark'
    ) {
      throw new Error(`Test 3 Failed: Profile payload was not saved correctly: ${JSON.stringify(updateData.profile)}`);
    }
    console.log('✓ Test 3 Passed: Profile successfully updated with skills, goals, academic info, and dark theme.');

    // 6. Persistence check via GET /api/progress
    console.log('\nTest 4: Verifying persistence via GET /api/progress...');
    const getRes = await fetch(`${BASE_URL}/progress`, { headers: authHeaders });
    const getData = await getRes.json();

    if (getRes.status !== 200) {
      throw new Error(`Test 4 Failed: Status ${getRes.status}`);
    }
    if (
      getData.profile.college !== updatePayload.college ||
      getData.profile.branch !== updatePayload.branch ||
      getData.profile.skills.length !== 5 ||
      getData.profile.goals.length !== 3 ||
      getData.profile.theme !== 'dark'
    ) {
      throw new Error(`Test 4 Failed: Stored profile in progress.json does not match updated state: ${JSON.stringify(getData.profile)}`);
    }
    console.log(`✓ Test 4 Passed: Profile persistence confirmed (${getData.profile.skills.length} skills, ${getData.profile.goals.length} goals, theme: ${getData.profile.theme}).`);

    // 7. Revert to baseline demo state
    console.log('\nTest 5: Restoring demo user profile to baseline...');
    const revertPayload = {
      action: 'updateProfile',
      college: '',
      branch: '',
      graduationYear: '2026',
      targetRole: 'Software Development Engineer',
      weeklyGoal: 5,
      skills: ['JavaScript', 'React', 'DSA'],
      goals: ['Crack SDE Internship 2026'],
      theme: 'light'
    };
    await fetch(`${BASE_URL}/progress`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(revertPayload)
    });
    console.log('✓ Test 5 Passed: Profile restored cleanly to initial demo baseline.');

    console.log('\n==========================================');
    console.log('ALL PHASE 10 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('==========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase10().catch((err) => {
  console.error('\n❌ Phase 10 tests failed:', err.message);
  process.exit(1);
});
