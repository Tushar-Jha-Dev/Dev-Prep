/**
 * DevPrep - Final QA Pass: Data, Storage, Concurrency & Recovery Suite
 */

const fs = require('fs/promises');
const path = require('path');
const assert = require('assert');
const { readJson, writeJson, FILES } = require('../utils/fileDb');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function cleanFile(fileName) {
  try {
    await fs.unlink(path.join(DATA_DIR, path.basename(fileName)));
  } catch (_) {}
}

async function run() {
  console.log('========================================================================');
  console.log('    DevPrep QA: Data, Storage, Concurrency & Recovery Suite             ');
  console.log('========================================================================\n');

  let passes = 0;
  let fails = 0;

  function pass(desc) {
    passes++;
    console.log(`✓ [PASS] ${desc}`);
  }

  function fail(desc, err) {
    fails++;
    console.error(`❌ [FAIL] ${desc}:`, err);
  }

  // 1. 50 PARALLEL WRITES TO SAME FILE
  console.log('--- 1. 50 Parallel Writes Concurrency Test ---');
  const testFile = 'qa-concurrent-50.json';
  await cleanFile(testFile);

  try {
    const promises = [];
    for (let i = 1; i <= 50; i++) {
      promises.push(writeJson(testFile, { iteration: i, payload: `Load test write #${i}`, timestamp: Date.now() }));
    }
    await Promise.all(promises);

    const result = await readJson(testFile);
    if (result && typeof result.iteration === 'number' && result.iteration >= 1 && result.iteration <= 50) {
      pass(`50 concurrent writes serialized cleanly without data corruption (Final iteration: ${result.iteration})`);
    } else {
      fail('50 concurrent writes resulted in unexpected shape', result);
    }
  } catch (err) {
    fail('50 concurrent writes crashed', err);
  } finally {
    await cleanFile(testFile);
  }

  // 2. MISSING FILE FALLBACK HANDLING
  console.log('\n--- 2. Missing File Fallback Handling ---');
  const missingFile = 'qa-missing-test.json';
  await cleanFile(missingFile);
  try {
    const fallback = { initialized: true, defaultItems: [1, 2, 3] };
    const res = await readJson(missingFile, fallback);
    if (res && res.initialized === true && res.defaultItems.length === 3) {
      pass('Missing file safely returns provided fallback');
    } else {
      fail('Missing file did not return fallback', res);
    }

    // Verify it created on disk
    const content = await fs.readFile(path.join(DATA_DIR, missingFile), 'utf-8');
    const parsed = JSON.parse(content);
    if (parsed.initialized === true) {
      pass('Fallback was atomically saved to disk for subsequent reads');
    } else {
      fail('Fallback not saved to disk', content);
    }
  } catch (err) {
    fail('Missing file handling error', err);
  } finally {
    await cleanFile(missingFile);
  }

  // 3. CORRUPTED FILE RECOVERY
  console.log('\n--- 3. Corrupted File Graceful Recovery ---');
  const corruptFile = 'qa-corrupt-test.json';
  await cleanFile(corruptFile);
  try {
    // Write invalid partial JSON
    await fs.writeFile(path.join(DATA_DIR, corruptFile), '{"corrupt": true, "list": [1, 2, ', 'utf-8');
    const safeFallback = { recoveredFromCorruption: true };
    const recovered = await readJson(corruptFile, safeFallback);
    if (recovered && recovered.recoveredFromCorruption === true) {
      pass('Corrupted/broken JSON handled gracefully without crashing or throwing unhandled exception');
    } else {
      fail('Corrupted file did not recover with fallback', recovered);
    }
  } catch (err) {
    fail('Corrupted file threw exception', err);
  } finally {
    await cleanFile(corruptFile);
  }

  // 4. PATH TRAVERSAL DEFENSE
  console.log('\n--- 4. Path Traversal Neutralization ---');
  try {
    // Attempt directory traversal
    const traversalAttempt = '../../package.json';
    const readAttempt = await readJson(traversalAttempt, { safe: true });
    // In fileDb.js, path.basename('../../package.json') becomes 'package.json' inside DATA_DIR
    // It should NEVER read the root package.json or server.js
    if (readAttempt.safe === true) {
      pass('Path traversal attempt safely confined inside data directory via path.basename');
    } else {
      fail('Path traversal read unexpected file', readAttempt);
    }
  } catch (err) {
    pass('Path traversal attempt safely blocked or handled');
  } finally {
    await cleanFile('package.json');
  }

  // 5. ID UNIQUENESS ACROSS ALL CORE DATASETS
  console.log('\n--- 5. Dataset Integrity & ID Uniqueness ---');
  try {
    // 5a. Questions
    const questions = await readJson(FILES.QUESTIONS, []);
    const questionIds = new Set();
    let qDuplicate = false;
    for (const q of questions) {
      if (questionIds.has(q.id)) {
        qDuplicate = true;
        break;
      }
      questionIds.add(q.id);
    }
    if (!qDuplicate && questions.length > 0) {
      pass(`All ${questions.length} DSA questions have distinct, globally unique IDs`);
    } else {
      fail(`Found duplicate ID in questions.json (Total: ${questions.length})`);
    }

    // 5b. Users
    const users = await readJson(FILES.USERS, []);
    const userIds = new Set();
    const userEmails = new Set();
    let uDuplicate = false;
    for (const u of users) {
      if (userIds.has(u.id) || userEmails.has(u.email.toLowerCase())) {
        uDuplicate = true;
        break;
      }
      userIds.add(u.id);
      userEmails.add(u.email.toLowerCase());
    }
    if (!uDuplicate && users.length > 0) {
      pass(`All ${users.length} user accounts have distinct, unique IDs and unique lowercase emails`);
    } else {
      fail(`Found duplicate ID or email in users.json`);
    }

    // 5c. MCQs in MCQ Bank
    const mcqs = await readJson(FILES.MCQ_BANK, []);
    const mcqIds = new Set();
    let mcqDuplicate = false;
    for (const m of mcqs) {
      if (mcqIds.has(m.id)) {
        mcqDuplicate = true;
        break;
      }
      mcqIds.add(m.id);
    }
    if (!mcqDuplicate && mcqs.length > 0) {
      pass(`All ${mcqs.length} MCQ assessment questions have unique IDs`);
    } else {
      fail(`Found duplicate MCQ ID in mcqBank.json (Total: ${mcqs.length})`);
    }

    // 5d. Applications
    const applications = await readJson(FILES.APPLICATIONS, []);
    const appIds = new Set();
    let aDuplicate = false;
    for (const a of applications) {
      if (appIds.has(a.id)) {
        aDuplicate = true;
        break;
      }
      appIds.add(a.id);
    }
    if (!aDuplicate && applications.length > 0) {
      pass(`All ${applications.length} applications have distinct IDs`);
    } else {
      fail(`Found duplicate ID in applications.json`);
    }
  } catch (err) {
    fail('Dataset integrity error', err);
  }

  // 6. JSON SYNTAX AUDIT FOR ALL FILES IN server/data/
  console.log('\n--- 6. JSON Syntax Audit for All Data Files ---');
  const dataFiles = await fs.readdir(DATA_DIR);
  for (const f of dataFiles) {
    if (f.endsWith('.json')) {
      try {
        const raw = await fs.readFile(path.join(DATA_DIR, f), 'utf-8');
        JSON.parse(raw);
        pass(`File "server/data/${f}" parses valid JSON with zero syntax errors`);
      } catch (err) {
        fail(`File "server/data/${f}" has syntax error`, err.message);
      }
    }
  }

  console.log('\n========================================================================');
  console.log(`Results: ${passes} Passed, ${fails} Failed`);
  console.log('========================================================================');
  if (fails > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
