const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForUrl(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304 || res.status === 404) return true;
    } catch (_) {}
    await sleep(400);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.exceptions = [];
    this.consoleLogs = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Runtime.exceptionThrown') {
          this.exceptions.push(msg.params);
        } else if (msg.method === 'Console.messageAdded') {
          this.consoleLogs.push(msg.params.message);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push(msg.params);
        }
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  const rootDir = path.resolve(__dirname, '../..');

  let serverProc = null;
  try {
    const check = await fetch('http://127.0.0.1:5000/api/health');
    if (check.ok) console.log('Existing Express server detected on :5000');
  } catch (_) {
    console.log('Starting Express server on port 5000...');
    serverProc = spawn('node', [path.join(rootDir, 'server/server.js')], {
      cwd: rootDir,
      env: { ...process.env, PORT: '5000' }
    });
  }

  let clientProc = null;
  try {
    const check = await fetch('http://127.0.0.1:5173');
    if (check.ok) console.log('Existing Vite server detected on :5173');
  } catch (_) {
    console.log('Starting Vite server on port 5173...');
    const viteBin = path.join(rootDir, 'client/node_modules/vite/bin/vite.js');
    clientProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
      cwd: path.join(rootDir, 'client')
    });
  }

  await waitForUrl('http://127.0.0.1:5000/api/health');
  console.log('Backend ready on http://127.0.0.1:5000');
  await waitForUrl('http://127.0.0.1:5173');
  console.log('Frontend ready on http://127.0.0.1:5173');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(rootDir, 'node_modules', '.tmp_chrome_sweep');
  if (!fs.existsSync(tempProfileDir)) fs.mkdirSync(tempProfileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9228',
    `--user-data-dir=${tempProfileDir}`,
    'about:blank'
  ]);

  let cdp = null;

  try {
    await sleep(2000);
    const newTabRes = await fetch('http://127.0.0.1:9228/json/new?about:blank', { method: 'PUT' });
    const tabData = await newTabRes.json();
    const wsUrl = tabData.webSocketDebuggerUrl;

    cdp = new CDPClient(wsUrl);
    await cdp.ready();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    // Get Auth tokens
    const demoRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const demoAuth = await demoRes.json();

    const adminRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@devprep.com', password: 'Admin@1234' })
    });
    const adminAuth = await adminRes.json();

    console.log('Demo Auth token acquired:', !!demoAuth.token);
    console.log('Admin Auth token acquired:', !!adminAuth.token);

    // Initial navigation to establish origin
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/login' });
    await sleep(1500);

    async function setSession(userObj, token, skin = 'paper', theme = 'light') {
      await cdp.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('devprep-token', '${token}');
          localStorage.setItem('devprep-user', JSON.stringify(${JSON.stringify(userObj)}));
          localStorage.setItem('devprep-skin', '${skin}');
          localStorage.setItem('devprep-theme', '${theme}');
          document.documentElement.setAttribute('data-skin', '${skin}');
          document.documentElement.setAttribute('data-theme', '${theme}');
        `
      });
    }

    // =========================================================================
    // PART 1: COMPLETE MOCK TEST FLOW
    // Tests: Setup (with fewer questions than requested), Start, Answer, Previous/Next,
    //        Timer, Submit, Result Scorecard, and Review.
    // Matrix: Paper Light, Paper Dark, Studio Light, Studio Dark, Demo & Admin
    // =========================================================================
    console.log('\n========================================================================');
    console.log('PART 1: VERIFYING ENTIRE MOCK TEST FLOW (Setup -> Test -> Submit -> Result)');
    console.log('========================================================================');

    const testCombinations = [
      { role: 'Demo User', auth: demoAuth, skin: 'paper', theme: 'light', topic: 'Arrays' },
      { role: 'Demo User', auth: demoAuth, skin: 'paper', theme: 'dark', topic: 'Strings' },
      { role: 'Demo User', auth: demoAuth, skin: 'studio', theme: 'light', topic: 'Trees' },
      { role: 'Demo User', auth: demoAuth, skin: 'studio', theme: 'dark', topic: 'Dynamic Programming' },
      { role: 'Admin User', auth: adminAuth, skin: 'studio', theme: 'light', topic: 'Graphs' }
    ];

    for (const combo of testCombinations) {
      console.log(`\n--- Testing ${combo.role} in Skin: ${combo.skin.toUpperCase()}, Mode: ${combo.theme.toUpperCase()}, Topic: "${combo.topic}" (5 questions in bank) ---`);
      await setSession(combo.auth.user, combo.auth.token, combo.skin, combo.theme);
      cdp.exceptions = [];

      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/mock-tests' });
      await sleep(2000);

      // 1. Setup Phase: Select topic with fewer questions than requested (5 questions)
      const setupCheck = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const topicSelect = document.getElementById('test-topic');
          if (!topicSelect) return { error: 'Topic select not found' };
          topicSelect.value = '${combo.topic}';
          topicSelect.dispatchEvent(new Event('change', { bubbles: true }));

          const startBtn = document.querySelector('.start-test-btn');
          const warning = document.querySelector('.topic-capacity-warning');
          const countBtns = Array.from(document.querySelectorAll('.count-btn')).map(b => ({
            count: b.querySelector('.count-num') ? b.querySelector('.count-num').textContent.trim() : '',
            disabled: b.disabled || b.classList.contains('count-btn-disabled')
          }));

          return {
            selectedTopic: topicSelect.value,
            hasStartBtn: !!startBtn,
            hasCapacityWarning: !!warning,
            warningText: warning ? warning.textContent.trim() : null,
            countBtns
          };
        })()`,
        returnByValue: true
      });

      console.log('  [Setup Check]:', setupCheck.result.value);

      // 2. Start Assessment
      await cdp.send('Runtime.evaluate', {
        expression: `document.querySelector('.start-test-btn').click();`
      });
      await sleep(2000);

      const inTestCheck = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('.active-test-header');
          const counterText = document.querySelector('.test-counter-text');
          const timerText = document.querySelector('.timer-text');
          const questionText = document.querySelector('.active-question-text');
          const options = Array.from(document.querySelectorAll('.option-card'));
          const pills = Array.from(document.querySelectorAll('.strip-pill'));

          return {
            isTestActive: !!header,
            counterText: counterText ? counterText.textContent.trim() : null,
            timerText: timerText ? timerText.textContent.trim() : null,
            questionSummary: questionText ? questionText.textContent.slice(0, 50) + '...' : null,
            optionCount: options.length,
            stripCount: pills.length
          };
        })()`,
        returnByValue: true
      });
      console.log('  [In-Test Active Check]:', inTestCheck.result.value);

      // 3. Select Option A on Question 1, click Next, click Previous
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const opts = document.querySelectorAll('.option-card');
          if (opts[0]) opts[0].click();
        })()`
      });
      await sleep(300);

      // Next
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Next'));
          if (nextBtn) nextBtn.click();
        })()`
      });
      await sleep(400);

      // Previous back to Q1
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const prevBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Previous'));
          if (prevBtn) prevBtn.click();
        })()`
      });
      await sleep(400);

      const navPersistCheck = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const opts = document.querySelectorAll('.option-card');
          return {
            q1StillSelected: opts[0] && opts[0].classList.contains('option-selected')
          };
        })()`,
        returnByValue: true
      });
      console.log('  [Previous / Next Selection Persistence]:', navPersistCheck.result.value);

      // 4. Answer remaining questions via strip navigator
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const pills = document.querySelectorAll('.strip-pill');
          pills.forEach((p, idx) => {
            p.click();
            const opts = document.querySelectorAll('.option-card');
            if (opts[idx % opts.length]) opts[idx % opts.length].click();
          });
        })()`
      });
      await sleep(500);

      // 5. Submit Test
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit'));
          if (submitBtn) submitBtn.click();
        })()`
      });
      await sleep(2500);

      // 6. Verify Scorecard & Review
      const scorecardCheck = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const scoreCard = document.querySelector('.result-score-card');
          const score = document.querySelector('.score-big');
          const total = document.querySelector('.score-total');
          const accuracy = document.querySelector('.accuracy-badge');
          const reviews = document.querySelectorAll('.review-card');
          const retakeBtn = Array.from(document.querySelectorAll('a, button')).find(b => b.textContent.includes('Take Another Test') || b.textContent.includes('Retake'));

          return {
            currentPath: window.location.pathname,
            hasScoreCard: !!scoreCard,
            score: score && total ? (score.textContent.trim() + '/' + total.textContent.trim()) : null,
            accuracy: accuracy ? accuracy.textContent.trim() : null,
            reviewItemCount: reviews.length,
            hasRetakeBtn: !!retakeBtn
          };
        })()`,
        returnByValue: true
      });
      console.log('  [Scorecard & Review Check]:', scorecardCheck.result.value);

      // 7. Click Retake Assessment to return to setup
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const retakeBtn = Array.from(document.querySelectorAll('a, button')).find(b => b.textContent.includes('Take Another Test') || b.textContent.includes('Retake'));
          if (retakeBtn) retakeBtn.click();
        })()`
      });
      await sleep(1500);

      const returnedPath = await cdp.send('Runtime.evaluate', {
        expression: `window.location.pathname`,
        returnByValue: true
      });
      console.log('  [Retake Navigation]: returned to', returnedPath.result.value);

      if (cdp.exceptions.length === 0) {
        console.log(`  ✓ Flow PASS: ${combo.role} in ${combo.skin} ${combo.theme} completed without errors!`);
      } else {
        console.error(`  ✗ Flow FAIL with ${cdp.exceptions.length} exceptions:`, cdp.exceptions);
      }
    }

    // =========================================================================
    // PART 2: APP-WIDE SWEEP ACROSS ALL ROUTES, SIDEBAR, ADMIN TABS & ERROR BOUNDARY
    // =========================================================================
    console.log('\n========================================================================');
    console.log('PART 2: APP-WIDE SWEEP ACROSS ALL ROUTES, SIDEBAR ITEMS & ADMIN TABS');
    console.log('========================================================================');

    const routesToSweep = [
      { name: 'Dashboard', path: '/', role: 'user', auth: demoAuth },
      { name: 'Problems Library', path: '/problems', role: 'user', auth: demoAuth },
      { name: 'Problem Details (q-arr-1)', path: '/problems/q-arr-1', role: 'user', auth: demoAuth },
      { name: 'Mock Tests Setup & History', path: '/mock-tests', role: 'user', auth: demoAuth },
      { name: 'Applications Tracker', path: '/applications', role: 'user', auth: demoAuth },
      { name: 'Profile & Settings', path: '/profile', role: 'user', auth: demoAuth },
      { name: 'Admin Coding Questions', path: '/admin/questions', role: 'admin', auth: adminAuth },
      { name: 'Admin Add Question Form', path: '/admin/questions/new', role: 'admin', auth: adminAuth },
      { name: 'Admin MCQ Bank', path: '/admin/mcq', role: 'admin', auth: adminAuth },
      { name: 'Page Not Found (404 Fallback)', path: '/non-existent-page-test-404', role: 'user', auth: demoAuth }
    ];

    let sweepPassCount = 0;
    for (const item of routesToSweep) {
      await setSession(item.auth.user, item.auth.token, 'paper', 'light');
      cdp.exceptions = [];

      await cdp.send('Page.navigate', { url: `http://127.0.0.1:5173${item.path}` });
      await sleep(1800);

      const check = await cdp.send('Runtime.evaluate', {
        expression: `({
          url: window.location.pathname,
          title: document.title,
          rootLen: document.getElementById('root') ? document.getElementById('root').innerHTML.length : 0,
          hasErrorBoundary: !!document.querySelector('.error-boundary-container'),
          has404: !!document.querySelector('.not-found-container')
        })`,
        returnByValue: true
      });

      const res = check.result.value;
      const pass = res.rootLen > 300 && cdp.exceptions.length === 0;
      if (pass) sweepPassCount++;

      const status = pass ? '[PASS]' : '[FAIL]';
      console.log(`  ${status} Route: ${item.name.padEnd(30)} | URL: ${res.url.padEnd(28)} | Title: "${res.title}" | Root: ${res.rootLen} chars | Exceptions: ${cdp.exceptions.length}`);
      if (item.path.includes('404')) {
        console.log(`         -> 404 Component Rendered Successfully: ${res.has404}`);
      }
    }

    console.log('\n========================================================================');
    console.log(`SWEEP SUMMARY: ${sweepPassCount}/${routesToSweep.length} ROUTES PASSED WITH 0 ERRORS!`);
    console.log('========================================================================');

    cdp.close();
  } finally {
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill();
    if (clientProc) clientProc.kill();
  }
}

run().catch(console.error);
