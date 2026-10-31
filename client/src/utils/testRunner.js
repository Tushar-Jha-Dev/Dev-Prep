/**
 * DevPrep - Test Runner Client Service (`testRunner.js`)
 * 
 * Manages the Web Worker execution lifecycle:
 * - Instantiates isolated testWorker instance
 * - Enforces hard 2-second timeout per execution run
 * - Returns structured test execution results
 */

export function runTestsAsync({ userCode, functionName, testCases, compareMode = 'exact' }) {
  return new Promise((resolve) => {
    let worker = null;
    let timer = null;
    let settled = false;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    try {
      worker = new Worker(new URL('./testWorker.js', import.meta.url), { type: 'module' });
    } catch (err) {
      return resolve({
        status: 'error',
        error: `Failed to initialize test worker sandbox: ${err.message}`,
        results: [],
        logs: [],
        passCount: 0,
        totalCount: Array.isArray(testCases) ? testCases.length : 0
      });
    }

    // Enforce 2-second hard execution timeout
    timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        status: 'timeout',
        error: 'Time limit exceeded (2.0s cap)',
        results: [],
        logs: [],
        passCount: 0,
        totalCount: Array.isArray(testCases) ? testCases.length : 0
      });
    }, 2000);

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      cleanup();

      const data = event.data || {};
      if (data.error && (!data.results || data.results.length === 0)) {
        resolve({
          status: 'error',
          error: data.error,
          results: [],
          logs: data.logs || [],
          passCount: 0,
          totalCount: Array.isArray(testCases) ? testCases.length : 0
        });
      } else {
        resolve({
          status: 'completed',
          error: data.error || null,
          results: data.results || [],
          logs: data.logs || [],
          passCount: data.passCount || 0,
          totalCount: data.totalCount || (Array.isArray(testCases) ? testCases.length : 0)
        });
      }
    };

    worker.onerror = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        status: 'error',
        error: err && err.message ? err.message : 'Worker execution error',
        results: [],
        logs: [],
        passCount: 0,
        totalCount: Array.isArray(testCases) ? testCases.length : 0
      });
    };

    worker.postMessage({
      type: 'RUN_TESTS',
      userCode,
      functionName,
      testCases,
      compareMode
    });
  });
}
