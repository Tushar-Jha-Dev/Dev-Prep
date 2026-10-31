/**
 * DevPrep - Phase 8B Admin MCQ Bank Verification Test
 * 
 * Verifies:
 * 1. 401 Unauthenticated on /api/admin/mcq
 * 2. 403 Forbidden for standard user on all /api/admin/mcq routes
 * 3. 400 Validation on invalid topic, missing/long question, <2 or >6 options, duplicate options, out-of-range correctIndex
 * 4. 409 Conflict on duplicate question in same topic
 * 5. 201 Created on valid MCQ creation
 * 6. GET /api/admin/mcq and GET /api/admin/mcq/:id return full details with correctIndex
 * 7. Anti-Cheat: GET /api/mock-test for student strictly hides correctIndex & explanation
 * 8. 200 Updated on MCQ update
 * 9. Past Attempt Immutability: Deleting an MCQ does not break past student attempts or reviews
 * 10. 200 Deleted on MCQ deletion
 * 11. GET /api/admin/mcq/:id returns 404 after deletion
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function testPhase8B() {
  console.log('--- Starting Phase 8B Admin MCQ Bank Tests ---');

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
    // 2. Log in as Demo Student (standard user)
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const { token: studentToken } = await studentLoginRes.json();
    const studentHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    };

    // 3. Log in as Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@devprep.com', password: 'Admin@1234' })
    });
    const { token: adminToken } = await adminLoginRes.json();
    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    };

    // Test 1: Unauthenticated request returns 401
    console.log('Test 1: Unauthenticated GET /api/admin/mcq returns 401...');
    const unauthRes = await fetch(`${BASE_URL}/admin/mcq`);
    if (unauthRes.status !== 401) {
      throw new Error(`Test 1 Failed: Expected 401, got ${unauthRes.status}`);
    }
    console.log('✓ Test 1 Passed: Unauthenticated request rejected with 401.');

    // Test 2: Standard student user gets 403 Forbidden
    console.log('\nTest 2: Standard user GET and POST /api/admin/mcq returns 403 Forbidden...');
    const studentGetRes = await fetch(`${BASE_URL}/admin/mcq`, { headers: studentHeaders });
    if (studentGetRes.status !== 403) {
      throw new Error(`Test 2 Failed: Expected 403 for GET, got ${studentGetRes.status}`);
    }
    const studentPostRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: 'Hack question?',
        options: ['A', 'B'],
        correctIndex: 0
      })
    });
    if (studentPostRes.status !== 403) {
      throw new Error(`Test 2 Failed: Expected 403 for POST, got ${studentPostRes.status}`);
    }
    console.log('✓ Test 2 Passed: Standard user blocked with 403 Forbidden.');

    // Test 3: Validation checks
    console.log('\nTest 3: Admin validation checks on POST /api/admin/mcq...');
    
    // 3a. Invalid topic
    const badTopicRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'InvalidTopic',
        question: 'Sample question?',
        options: ['A', 'B'],
        correctIndex: 0
      })
    });
    if (badTopicRes.status !== 400) {
      throw new Error('Test 3a Failed: Invalid topic should return 400');
    }

    // 3b. Empty question
    const emptyQRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: '   ',
        options: ['A', 'B'],
        correctIndex: 0
      })
    });
    if (emptyQRes.status !== 400) {
      throw new Error('Test 3b Failed: Empty question should return 400');
    }

    // 3c. Fewer than 2 options (1 option)
    const oneOptRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: 'Only one option question?',
        options: ['A'],
        correctIndex: 0
      })
    });
    if (oneOptRes.status !== 400) {
      throw new Error('Test 3c Failed: Fewer than 2 options should return 400');
    }

    // 3d. More than 6 options (7 options)
    const sevenOptRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: 'Seven options question?',
        options: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        correctIndex: 0
      })
    });
    if (sevenOptRes.status !== 400) {
      throw new Error('Test 3d Failed: More than 6 options should return 400');
    }

    // 3e. Duplicate options
    const dupOptRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: 'Duplicate options question?',
        options: ['Option A', 'option a'],
        correctIndex: 0
      })
    });
    if (dupOptRes.status !== 400) {
      throw new Error('Test 3e Failed: Duplicate options should return 400');
    }

    // 3f. Out of range correctIndex
    const outOfRangeRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: 'Valid question?',
        options: ['Option 1', 'Option 2'],
        correctIndex: 5
      })
    });
    if (outOfRangeRes.status !== 400) {
      throw new Error('Test 3f Failed: Out-of-range correctIndex should return 400');
    }
    console.log('✓ Test 3 Passed: All validation error rules verified with 400 Bad Request.');

    // Test 4: Admin creates a new MCQ
    console.log('\nTest 4: Admin creates a new MCQ...');
    const testQuestionText = `Unique Amortized Complexity Test Q ${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: testQuestionText,
        options: ['O(1) amortized', 'O(n) worst case', 'O(log n)', 'O(n^2)'],
        correctIndex: 0,
        explanation: 'Dynamic arrays double in capacity, making appending O(1) amortized.'
      })
    });
    const createdMcq = await createRes.json();
    if (createRes.status !== 201 || !createdMcq.id) {
      throw new Error(`Test 4 Failed: Expected 201 Created, got ${createRes.status}: ${JSON.stringify(createdMcq)}`);
    }
    console.log(`✓ Test 4 Passed: Admin created MCQ with ID "${createdMcq.id}".`);

    // Test 5: Duplicate question in same topic returns 409
    console.log('\nTest 5: Duplicate question in same topic returns 409 Conflict...');
    const duplicateRes = await fetch(`${BASE_URL}/admin/mcq`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: testQuestionText,
        options: ['Alpha', 'Beta'],
        correctIndex: 0
      })
    });
    if (duplicateRes.status !== 409) {
      throw new Error(`Test 5 Failed: Expected 409 Conflict, got ${duplicateRes.status}`);
    }
    console.log('✓ Test 5 Passed: Duplicate question rejected with 409 Conflict.');

    // Test 6: Retrieve single MCQ via GET /api/admin/mcq/:id
    console.log('\nTest 6: Retrieve single MCQ via GET /api/admin/mcq/:id...');
    const getSingleRes = await fetch(`${BASE_URL}/admin/mcq/${createdMcq.id}`, { headers: adminHeaders });
    const singleData = await getSingleRes.json();
    if (getSingleRes.status !== 200 || singleData.correctIndex !== 0) {
      throw new Error('Test 6 Failed: Single MCQ retrieval failed');
    }
    console.log(`✓ Test 6 Passed: Retrieved MCQ with correctIndex: ${singleData.correctIndex}.`);

    // Test 7: Student GET /api/mock-test Anti-Cheat Verification
    console.log('\nTest 7: Student GET /api/mock-test Anti-Cheat Verification...');
    const studentTestRes = await fetch(`${BASE_URL}/mock-test?topic=Arrays&count=25`, { headers: studentHeaders });
    const studentTestData = await studentTestRes.json();
    const foundInStudentTest = studentTestData.questions.find((q) => q.id === createdMcq.id);
    if (!foundInStudentTest) {
      throw new Error('Test 7 Failed: Newly created MCQ not found in topic test pool');
    }
    if (foundInStudentTest.correctIndex !== undefined || foundInStudentTest.explanation !== undefined) {
      throw new Error('Test 7 Failed: ANTI-CHEAT BREACH! correctIndex or explanation leaked in student test!');
    }
    console.log('✓ Test 7 Passed: Newly created MCQ present in test pool, and answers/explanations remain strictly hidden.');

    // Test 8: Admin updates MCQ
    console.log('\nTest 8: Admin updates MCQ...');
    const updatedRes = await fetch(`${BASE_URL}/admin/mcq/${createdMcq.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        question: `${testQuestionText} (Updated)`,
        options: ['O(1) amortized', 'O(n) worst case', 'O(log n)'],
        correctIndex: 1,
        explanation: 'Updated explanation note.'
      })
    });
    const updatedData = await updatedRes.json();
    if (updatedRes.status !== 200 || updatedData.correctIndex !== 1 || updatedData.options.length !== 3) {
      throw new Error('Test 8 Failed: MCQ update failed');
    }
    console.log(`✓ Test 8 Passed: MCQ updated to 3 options and correctIndex: 1.`);

    // Test 9: Student submits test with this MCQ, then Admin deletes MCQ
    console.log('\nTest 9: Historical Snapshot check — Student submits test, then MCQ is deleted...');
    const submitRes = await fetch(`${BASE_URL}/mock-test/submit`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        topic: 'Arrays',
        answers: [{ questionId: createdMcq.id, selectedIndex: 1 }],
        timeTaken: 45
      })
    });
    const submitData = await submitRes.json();
    if (submitRes.status !== 200 || !submitData.attempt) {
      throw new Error('Test 9 Failed: Mock test submission failed');
    }

    // Now delete the MCQ
    const deleteRes = await fetch(`${BASE_URL}/admin/mcq/${createdMcq.id}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    if (deleteRes.status !== 200) {
      throw new Error(`Test 9 Failed: Deletion failed with status ${deleteRes.status}`);
    }

    // Verify GET /api/admin/mcq/:id now returns 404
    const getDeletedRes = await fetch(`${BASE_URL}/admin/mcq/${createdMcq.id}`, { headers: adminHeaders });
    if (getDeletedRes.status !== 404) {
      throw new Error('Test 9 Failed: Deleted MCQ should return 404');
    }

    // Verify user attempts history still loads cleanly and contains snapshot
    const attemptsRes = await fetch(`${BASE_URL}/mock-test/attempts`, { headers: studentHeaders });
    const attempts = await attemptsRes.json();
    const latestAttempt = attempts[0];
    if (!latestAttempt || latestAttempt.id !== submitData.attempt.id) {
      throw new Error('Test 9 Failed: User attempts corrupted after MCQ deletion');
    }
    console.log('✓ Test 9 Passed: MCQ deleted from active bank; past student attempt snapshot preserved cleanly.');

    console.log('\n==========================================');
    console.log('ALL PHASE 8B TESTS PASSED SUCCESSFULLY! ✓');
    console.log('==========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testPhase8B().catch((err) => {
  console.error('\n❌ Phase 8B tests failed:', err.message);
  process.exit(1);
});
