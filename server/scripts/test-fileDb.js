/**
 * DevPrep - FileDb Verification Script
 * 
 * Plain Node.js script (no external testing libraries required).
 * Verifies:
 * 1. Read & write functionality
 * 2. Missing-file fallback creation
 * 3. Atomic concurrency (serialized writes under high load)
 * 4. Graceful recovery on corrupted JSON (does not crash)
 */

const fs = require('fs/promises');
const path = require('path');
const { readJson, writeJson } = require('../utils/fileDb');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function cleanFile(fileName) {
  try {
    await fs.unlink(path.join(DATA_DIR, fileName));
  } catch (_) {
    // Ignore if file doesn't exist
  }
}

async function runTests() {
  console.log('--- Starting fileDb Tests ---');

  // Test 1: Basic Write and Read
  console.log('Test 1: Basic Write & Read...');
  const test1File = 'test-basic.json';
  await cleanFile(test1File);
  const sampleData = { message: 'Hello from DevPrep', count: 42 };
  await writeJson(test1File, sampleData);
  const readBack = await readJson(test1File);
  if (JSON.stringify(readBack) !== JSON.stringify(sampleData)) {
    throw new Error(`Test 1 Failed: Expected ${JSON.stringify(sampleData)}, got ${JSON.stringify(readBack)}`);
  }
  await cleanFile(test1File);
  console.log('✓ Test 1 Passed: Write and Read work correctly.');

  // Test 2: Missing File Handling with Fallback
  console.log('\nTest 2: Missing File Fallback...');
  const test2File = 'test-missing.json';
  await cleanFile(test2File);
  const fallbackData = [{ id: 'seed-1', title: 'Two Sum' }];
  const missingResult = await readJson(test2File, fallbackData);
  if (JSON.stringify(missingResult) !== JSON.stringify(fallbackData)) {
    throw new Error('Test 2 Failed: Fallback data was not returned');
  }
  // Verify it actually created the file on disk
  const diskCheck = await fs.readFile(path.join(DATA_DIR, test2File), 'utf-8');
  if (!diskCheck.includes('Two Sum')) {
    throw new Error('Test 2 Failed: Fallback was not written to disk');
  }
  await cleanFile(test2File);
  console.log('✓ Test 2 Passed: Missing file returns and persists fallback.');

  // Test 3: Concurrency & Atomic Write Queue
  console.log('\nTest 3: Concurrent Writes (Write Queue)...');
  const test3File = 'test-concurrent.json';
  await cleanFile(test3File);
  
  // Launch 15 concurrent writes simultaneously
  const writePromises = [];
  for (let i = 1; i <= 15; i++) {
    writePromises.push(writeJson(test3File, { iteration: i, timestamp: Date.now() }));
  }
  await Promise.all(writePromises);

  // Read back the result: it should be valid JSON and have a valid iteration
  const concurrentResult = await readJson(test3File);
  if (!concurrentResult || typeof concurrentResult.iteration !== 'number') {
    throw new Error('Test 3 Failed: Concurrent writes corrupted the file');
  }
  await cleanFile(test3File);
  console.log(`✓ Test 3 Passed: 15 concurrent writes serialized cleanly without corruption. Final iteration: ${concurrentResult.iteration}.`);

  // Test 4: Corrupted File Recovery
  console.log('\nTest 4: Corrupted JSON File Recovery...');
  const test4File = 'test-corrupt.json';
  await fs.writeFile(path.join(DATA_DIR, test4File), '{ broken_json: [invalid, ', 'utf-8');
  const corruptFallback = { recovered: true };
  const recoveredData = await readJson(test4File, corruptFallback);
  if (!recoveredData || recoveredData.recovered !== true) {
    throw new Error('Test 4 Failed: Corrupted file did not return safe fallback');
  }
  await cleanFile(test4File);
  console.log('✓ Test 4 Passed: Malformed JSON handled gracefully without crashing.');

  console.log('\n=========================================');
  console.log('ALL fileDb TESTS PASSED SUCCESSFULLY! ✓');
  console.log('=========================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
