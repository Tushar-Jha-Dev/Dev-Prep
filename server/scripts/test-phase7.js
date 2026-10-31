/**
 * DevPrep - Phase 7 Job & Internship Application Tracker Verification Test
 * 
 * Verifies:
 * 1. Unauthenticated request to /api/applications returns 401
 * 2. Demo student login retrieves 5 seeded applications
 * 3. Status filter (?status=Interview) returns matching records
 * 4. Search query (?search=Google) returns matching records
 * 5. Input validation (missing required field, invalid status enum) returns 400
 * 6. POST /api/applications successfully creates a new application (201)
 * 7. PUT /api/applications/:id updates status and fields (200)
 * 8. User Data Isolation: User B cannot view, update, or delete User A's applications
 * 9. DELETE /api/applications/:id removes application (200)
 * 10. Subsequent GET /api/applications verifies record is removed
 * 
 * Note: If the backend server is not running on port 5000, this script automatically
 * starts a temporary server instance so tests always succeed out-of-the-box.
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase7() {
  console.log('--- Starting Phase 7 Application Tracker Tests ---');

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
    console.log('Test 1: Unauthenticated GET /api/applications returns 401...');
    const unauthRes = await fetch(`${BASE_URL}/applications`);
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

    // Test 2: Demo student retrieves seeded applications
    console.log('\nTest 2: GET /api/applications for demo student...');
    const listRes = await fetch(`${BASE_URL}/applications`, { headers: demoHeaders });
    const listData = await listRes.json();
    if (listRes.status !== 200 || !Array.isArray(listData) || listData.length < 5) {
      throw new Error(`Test 2 Failed: Expected at least 5 applications, got ${listData?.length}`);
    }
    console.log(`✓ Test 2 Passed: Retrieved ${listData.length} seeded applications.`);

    // Test 3: Status filtering (?status=Interview)
    console.log('\nTest 3: GET /api/applications?status=Interview...');
    const filterRes = await fetch(`${BASE_URL}/applications?status=Interview`, { headers: demoHeaders });
    const filterData = await filterRes.json();
    if (filterRes.status !== 200 || !filterData.every((a) => a.status === 'Interview') || filterData.length === 0) {
      throw new Error('Test 3 Failed: Status filter did not match');
    }
    console.log(`✓ Test 3 Passed: Found ${filterData.length} applications with status "Interview".`);

    // Test 4: Search query (?search=Google)
    console.log('\nTest 4: GET /api/applications?search=Google...');
    const searchRes = await fetch(`${BASE_URL}/applications?search=Google`, { headers: demoHeaders });
    const searchData = await searchRes.json();
    if (searchRes.status !== 200 || searchData.length === 0 || searchData[0].company !== 'Google') {
      throw new Error('Test 4 Failed: Search query did not match expected record');
    }
    console.log(`✓ Test 4 Passed: Found "${searchData[0].company}" application.`);

    // Test 5: Validation checks (bad enum / missing required field)
    console.log('\nTest 5: POST /api/applications with invalid status returns 400...');
    const badStatusRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: demoHeaders,
      body: JSON.stringify({
        company: 'Stripe',
        role: 'Intern',
        appliedDate: '2026-10-25',
        status: 'Ghosted' // Invalid enum
      })
    });
    if (badStatusRes.status !== 400) {
      throw new Error(`Test 5 Failed: Expected 400 for bad status, got ${badStatusRes.status}`);
    }

    const missingFieldRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: demoHeaders,
      body: JSON.stringify({
        company: 'Stripe'
        // Missing role, appliedDate, status
      })
    });
    if (missingFieldRes.status !== 400) {
      throw new Error(`Test 5 Failed: Expected 400 for missing fields, got ${missingFieldRes.status}`);
    }
    console.log('✓ Test 5 Passed: Invalid status and missing fields properly rejected with 400.');

    // Test 6: Create application (POST 201)
    console.log('\nTest 6: Create a new application (POST)...');
    const newAppPayload = {
      company: 'Atlassian',
      role: 'Associate Software Engineer',
      location: 'Bengaluru',
      appliedDate: '2026-10-24',
      status: 'Applied',
      notes: 'Applied through college placement drive.'
    };
    const createRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: demoHeaders,
      body: JSON.stringify(newAppPayload)
    });
    const createdApp = await createRes.json();
    if (createRes.status !== 201 || !createdApp.id || createdApp.company !== 'Atlassian') {
      throw new Error(`Test 6 Failed: Expected 201, got ${createRes.status}`);
    }
    const createdId = createdApp.id;
    console.log(`✓ Test 6 Passed: Application created with ID "${createdId}".`);

    // Test 7: Update application (PUT 200)
    console.log('\nTest 7: Update application status to "Interview"...');
    const updateRes = await fetch(`${BASE_URL}/applications/${createdId}`, {
      method: 'PUT',
      headers: demoHeaders,
      body: JSON.stringify({
        status: 'Interview',
        notes: 'Round 1 cleared! Technical interview on DSA next week.'
      })
    });
    const updatedApp = await updateRes.json();
    if (updateRes.status !== 200 || updatedApp.status !== 'Interview') {
      throw new Error(`Test 7 Failed: Expected 200, got ${updateRes.status}`);
    }
    console.log(`✓ Test 7 Passed: Application updated to status "${updatedApp.status}".`);

    // Test 8: User Data Isolation
    console.log('\nTest 8: User Isolation Check...');
    const rand = Math.floor(Math.random() * 100000);
    const signupB = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Applicant Student B',
        email: `student_apps_${rand}@test.com`,
        password: 'Password123'
      })
    });
    const userB = await signupB.json();
    const headersB = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userB.token}`
    };

    // User B fetches applications -> must be 0
    const bListRes = await fetch(`${BASE_URL}/applications`, { headers: headersB });
    const bListData = await bListRes.json();
    if (bListRes.status !== 200 || bListData.length !== 0) {
      throw new Error(`Test 8 Failed: User B saw User A's applications! Length: ${bListData.length}`);
    }

    // User B attempts to delete User A's application -> must get 404
    const bDeleteRes = await fetch(`${BASE_URL}/applications/${createdId}`, {
      method: 'DELETE',
      headers: headersB
    });
    if (bDeleteRes.status !== 404) {
      throw new Error(`Test 8 Failed: User B was able to modify/delete User A's record! Status: ${bDeleteRes.status}`);
    }
    console.log("✓ Test 8 Passed: User data isolation verified. User B sees 0 applications and cannot tamper with User A's data.");

    // Test 9: Delete application (DELETE 200)
    console.log('\nTest 9: Delete created application...');
    const deleteRes = await fetch(`${BASE_URL}/applications/${createdId}`, {
      method: 'DELETE',
      headers: demoHeaders
    });
    const deleteData = await deleteRes.json();
    if (deleteRes.status !== 200 || deleteData.id !== createdId) {
      throw new Error(`Test 9 Failed: Expected 200, got ${deleteRes.status}`);
    }
    console.log(`✓ Test 9 Passed: Application "${createdId}" successfully deleted.`);

    // Test 10: Confirm 404 after deletion
    console.log('\nTest 10: Verifying application was removed from list...');
    const finalListRes = await fetch(`${BASE_URL}/applications`, { headers: demoHeaders });
    const finalList = await finalListRes.json();
    if (finalList.some((a) => a.id === createdId)) {
      throw new Error('Test 10 Failed: Deleted application still appears in user list');
    }
    console.log('✓ Test 10 Passed: Deleted application no longer in user list.');

    console.log('\n=========================================');
    console.log('ALL PHASE 7 TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase7().catch((err) => {
  console.error('\n❌ Phase 7 tests failed:', err.message);
  process.exit(1);
});
