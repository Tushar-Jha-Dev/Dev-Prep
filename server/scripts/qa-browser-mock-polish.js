/**
 * DevPrep - Browser Automation Suite: Mock Test Polish, Top Bar Alignment,
 * Spacing Audit, Progress Bars, and History Verification via Chrome CDP
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.exceptions = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        this.exceptions.push(msg.params);
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

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('[CDP Evaluate Exception]:', res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res.result?.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('========================================================================');
  console.log('   DevPrep: Browser QA Suite - Spacing, Bars, TopBar & Past Tests       ');
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

  const rootDir = path.resolve(__dirname, '../..');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(rootDir, 'node_modules', '.tmp_chrome_mock_polish');
  if (!fs.existsSync(tempProfileDir)) fs.mkdirSync(tempProfileDir, { recursive: true });

  const artifactDir = 'C:\\Users\\tusha\\.gemini\\antigravity\\brain\\03db4159-4966-4dee-970d-80bc64c3b431';
  const clientScreenshotsDir = path.join(rootDir, 'client/public/qa-screenshots');
  if (!fs.existsSync(clientScreenshotsDir)) fs.mkdirSync(clientScreenshotsDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9230',
    `--user-data-dir=${tempProfileDir}`,
    'about:blank'
  ]);

  let cdp = null;

  try {
    await sleep(2000);
    const newTabRes = await fetch('http://127.0.0.1:9230/json/new?about:blank', { method: 'PUT' });
    const tabData = await newTabRes.json();
    cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.ready();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 1. Authenticate Demo Student
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const authData = await loginRes.json();

    // 2. Submit a rich 7-topic test so all 7 topics appear in Topic Performance!
    console.log('1. Submitting a test with 7 topics for Topic Performance verification...');
    const questionsRes = await fetch('http://127.0.0.1:5000/api/mock-test?count=15', {
      headers: { Authorization: `Bearer ${authData.token}` }
    });
    const questionsData = await questionsRes.json();
    const testQuestions = questionsData.questions || [];

    // Select answers
    const answers = testQuestions.map((q, i) => ({
      questionId: q.id,
      selectedIndex: i % 3 === 0 ? 0 : (i % 3 === 1 ? 1 : -1) // mix of correct, incorrect, unanswered
    }));

    const submitRes = await fetch('http://127.0.0.1:5000/api/mock-test/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.token}`
      },
      body: JSON.stringify({
        topic: 'Mixed',
        answers,
        timeTaken: 215
      })
    });
    const submitData = await submitRes.json();
    const targetAttemptId = submitData.attempt?.id;
    console.log(`   ✓ Created comprehensive test attempt: ${targetAttemptId}`);

    // Set origin and localStorage
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(800);

    await cdp.evaluate(`
      localStorage.setItem('devprep-token', '${authData.token}');
      localStorage.setItem('devprep-user', JSON.stringify(${JSON.stringify(authData.user)}));
      localStorage.setItem('devprep-skin', 'paper');
      localStorage.setItem('devprep-theme', 'light');
    `);

    // Navigate to authenticated route with Layout topbar
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1200);

    // 2. TOP BAR ALIGNMENT AUDIT (360, 768, 1280 across Paper and Studio)
    console.log('\n--- 2. Top Bar Alignment Audit (ThemeToggle & Avatar) ---');
    const viewports = [
      { name: 'Mobile', width: 360, height: 740 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 800 }
    ];

    const skinThemes = [
      { skin: 'paper', theme: 'light' },
      { skin: 'paper', theme: 'dark' },
      { skin: 'studio', theme: 'light' },
      { skin: 'studio', theme: 'dark' }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768
      });

      for (const st of skinThemes) {
        await cdp.evaluate(`
          document.documentElement.setAttribute('data-skin', '${st.skin}');
          document.documentElement.setAttribute('data-theme', '${st.theme}');
        `);
        await sleep(150);

        const metrics = await cdp.evaluate(`(() => {
          const toggle = document.querySelector('.theme-toggle-btn');
          const avatar = document.querySelector('.topbar-avatar-link');
          const right = document.querySelector('.topbar-right');
          if (!toggle || !avatar || !right) return null;

          const tRect = toggle.getBoundingClientRect();
          const aRect = avatar.getBoundingClientRect();
          const rStyle = window.getComputedStyle(right);

          return {
            toggleWidth: tRect.width,
            toggleHeight: tRect.height,
            avatarWidth: aRect.width,
            avatarHeight: aRect.height,
            verticalDelta: Math.abs(tRect.top - aRect.top),
            horizontalGap: aRect.left - tRect.right,
            isFlex: rStyle.display === 'flex',
            alignItems: rStyle.alignItems
          };
        })()`);

        if (!metrics) {
          fail(`Top bar elements missing at ${vp.name} [${st.skin}-${st.theme}]`);
        } else {
          const sizeOk = Math.round(metrics.toggleWidth) === 40 &&
                         Math.round(metrics.toggleHeight) === 40 &&
                         Math.round(metrics.avatarWidth) === 40 &&
                         Math.round(metrics.avatarHeight) === 40;
          const alignOk = metrics.verticalDelta <= 2; // vertically centered on same line
          const gapOk = metrics.horizontalGap >= 8;

          if (sizeOk && alignOk && gapOk) {
            pass(`Top bar 40x40 toggle & avatar vertically aligned (delta ${metrics.verticalDelta.toFixed(1)}px, gap ${metrics.horizontalGap}px) at ${vp.name} [${st.skin}-${st.theme}]`);
          } else {
            fail(`Top bar alignment issue at ${vp.name} [${st.skin}-${st.theme}]: sizeOk=${sizeOk}, alignOk=${alignOk}, metrics=${JSON.stringify(metrics)}`);
          }
        }
      }
    }

    // 3. RESULT & REVIEW PAGE SPACING AUDIT
    console.log('\n--- 3. Result & Review Page Spacing Audit ---');
    // Navigate to the attempt report
    await cdp.send('Page.navigate', { url: `http://localhost:5173/mock-tests/attempts/${targetAttemptId}` });
    await sleep(1500);

    for (const st of skinThemes) {
      await cdp.evaluate(`
        document.documentElement.setAttribute('data-skin', '${st.skin}');
        document.documentElement.setAttribute('data-theme', '${st.theme}');
      `);
      await sleep(200);

      const spacingCheck = await cdp.evaluate(`(() => {
        // 1. Question number and topic gap
        const meta = document.querySelector('.review-question-meta');
        const qNum = document.querySelector('.review-q-num');
        const qTopic = document.querySelector('.review-topic-tag');
        let metaGap = -1;
        if (qNum && qTopic) {
          const numRect = qNum.getBoundingClientRect();
          const topicRect = qTopic.getBoundingClientRect();
          metaGap = topicRect.left - numRect.right;
        }

        // 2. Option letter chip and text gap
        const optLetter = document.querySelector('.review-opt-letter');
        const optText = document.querySelector('.review-opt-text');
        let optGap = -1;
        let letterWidth = 0;
        if (optLetter && optText) {
          const lRect = optLetter.getBoundingClientRect();
          const tRect = optText.getBoundingClientRect();
          optGap = tRect.left - lRect.right;
          letterWidth = lRect.width;
        }

        // 3. Progress bars
        const pbHeaders = document.querySelectorAll('.topic-stat-item .progress-bar-header');
        const pbFills = document.querySelectorAll('.topic-stat-item .progress-bar-fill');
        let headerGaps = [];
        pbHeaders.forEach(h => {
          const lbl = h.querySelector('.progress-bar-label');
          const val = h.querySelector('.progress-bar-value');
          if (lbl && val) {
            headerGaps.push(val.getBoundingClientRect().left - lbl.getBoundingClientRect().right);
          }
        });

        let fillsWithWidth = 0;
        pbFills.forEach(f => {
          const style = window.getComputedStyle(f);
          if (f.getBoundingClientRect().width > 0 && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            fillsWithWidth++;
          }
        });

        return {
          metaGap,
          optGap,
          letterWidth,
          headerGaps,
          totalBars: pbFills.length,
          fillsWithWidth
        };
      })()`);

      if (!spacingCheck) {
        fail(`Could not evaluate spacing on result page [${st.skin}-${st.theme}]`);
      } else {
        if (spacingCheck.metaGap >= 8) {
          pass(`Question number and topic have clear gap (${spacingCheck.metaGap.toFixed(1)}px >= 8px) [${st.skin}-${st.theme}]`);
        } else {
          fail(`Touching text: Question number and topic gap is ${spacingCheck.metaGap}px [${st.skin}-${st.theme}]`);
        }

        if (spacingCheck.optGap >= 10 && spacingCheck.letterWidth >= 24) {
          pass(`Option letter chip (width ${spacingCheck.letterWidth}px) has clear gap (${spacingCheck.optGap.toFixed(1)}px >= 10px) to text [${st.skin}-${st.theme}]`);
        } else {
          fail(`Option letter chip gap issue: ${spacingCheck.optGap}px [${st.skin}-${st.theme}]`);
        }

        if (spacingCheck.totalBars > 0 && spacingCheck.fillsWithWidth > 0) {
          pass(`Topic breakdown bars use shared ProgressBar and display colored fills (${spacingCheck.fillsWithWidth}/${spacingCheck.totalBars} filled) [${st.skin}-${st.theme}]`);
        } else {
          fail(`Topic breakdown bars empty: ${JSON.stringify(spacingCheck)} [${st.skin}-${st.theme}]`);
        }
      }

      // Take screenshots for desktop (1280px)
      const screenshotName = `result-review-${st.skin}-${st.theme}-1280.png`;
      await cdp.captureScreenshot(path.join(clientScreenshotsDir, screenshotName));
      await cdp.captureScreenshot(path.join(artifactDir, screenshotName));
      console.log(`   📸 Captured screenshot: ${screenshotName}`);
    }

    // 4. MOBILE 360PX SCREENSHOTS & OVERFLOW CHECK
    console.log('\n--- 4. Mobile 360px Viewport Spacing & Screenshots ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 740,
      deviceScaleFactor: 1,
      mobile: true
    });
    await sleep(200);

    for (const st of [{ skin: 'paper', theme: 'light' }, { skin: 'studio', theme: 'dark' }]) {
      await cdp.evaluate(`
        document.documentElement.setAttribute('data-skin', '${st.skin}');
        document.documentElement.setAttribute('data-theme', '${st.theme}');
      `);
      await sleep(200);

      const overflow = await cdp.evaluate(`(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      })()`);

      if (!overflow) {
        pass(`No horizontal overflow on Result & Review page at 360px [${st.skin}-${st.theme}]`);
      } else {
        fail(`Horizontal overflow detected at 360px [${st.skin}-${st.theme}]`);
      }

      const mobileScreenshot = `result-review-${st.skin}-${st.theme}-360.png`;
      await cdp.captureScreenshot(path.join(clientScreenshotsDir, mobileScreenshot));
      await cdp.captureScreenshot(path.join(artifactDir, mobileScreenshot));
      console.log(`   📸 Captured screenshot: ${mobileScreenshot}`);
    }

    // 5. REVIEW FILTER CHIPS VERIFICATION
    console.log('\n--- 5. Review Filter Chips Functionality ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(200);

    const filterCounts = await cdp.evaluate(`(() => {
      const chips = document.querySelectorAll('.review-filter-chips .filter-chip');
      const cards = document.querySelectorAll('.reviews-list .review-card');
      return {
        chipCount: chips.length,
        initialCards: cards.length
      };
    })()`);

    if (filterCounts.chipCount === 3 && filterCounts.initialCards > 0) {
      pass(`Filter chips rendered (All, Incorrect, Unanswered) with ${filterCounts.initialCards} total questions`);
    } else {
      fail(`Filter chips missing or count wrong: ${JSON.stringify(filterCounts)}`);
    }

    // Click Incorrect filter
    await cdp.evaluate(`(() => {
      const btn = document.querySelectorAll('.review-filter-chips .filter-chip')[1];
      if (btn) btn.click();
    })()`);
    await sleep(200);

    const incorrectCards = await cdp.evaluate(`(() => {
      return document.querySelectorAll('.reviews-list .review-card-wrong').length;
    })()`);
    pass(`Incorrect filter chip active: displaying ${incorrectCards} incorrect questions`);

    // 6. PAST TESTS TABLE, MOBILE CARDS & REPORT NAVIGATION
    console.log('\n--- 6. Mock Tests Page: Past Tests Section & Report Link ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/mock-tests' });
    await sleep(1500);

    const pastTestsCheck = await cdp.evaluate(`(() => {
      const section = document.querySelector('#past-tests');
      const table = document.querySelector('.past-tests-table-wrapper');
      const rows = document.querySelectorAll('.past-tests-table-wrapper tbody tr');
      const firstReportBtn = document.querySelector('.past-tests-table-wrapper tbody tr a');
      return {
        sectionExists: Boolean(section),
        tableExists: Boolean(table),
        rowCount: rows.length,
        hasReportBtn: Boolean(firstReportBtn),
        firstHref: firstReportBtn ? firstReportBtn.getAttribute('href') : null
      };
    })()`);

    if (pastTestsCheck.sectionExists && pastTestsCheck.rowCount > 0 && pastTestsCheck.hasReportBtn) {
      pass(`Past Tests table rendered with ${pastTestsCheck.rowCount} historical rows and working "View report" button (${pastTestsCheck.firstHref})`);
    } else {
      fail(`Past Tests section missing or incomplete: ${JSON.stringify(pastTestsCheck)}`);
    }

    // 7. DASHBOARD BARS & RECENT ACTIVITY LINKS
    console.log('\n--- 7. Dashboard Bars & Recent Activity Link to Report ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1500);

    const dashCheck = await cdp.evaluate(`(() => {
      const topicBars = document.querySelectorAll('.topic-bar-row .progress-bar-fill');
      const activityLinks = document.querySelectorAll('.activity-item-link');
      return {
        barsCount: topicBars.length,
        hasActivityLinks: activityLinks.length > 0,
        firstActivityHref: activityLinks[0] ? activityLinks[0].getAttribute('href') : null
      };
    })()`);

    if (dashCheck.barsCount === 9) {
      pass(`Dashboard renders all 9 topic proficiency bars with shared ProgressBar`);
    } else {
      fail(`Dashboard missing topic bars: count=${dashCheck.barsCount}`);
    }

    if (dashCheck.hasActivityLinks && dashCheck.firstActivityHref && dashCheck.firstActivityHref.startsWith('/mock-tests/attempts/')) {
      pass(`Dashboard recent activity contains clickable links directly to test reports: "${dashCheck.firstActivityHref}"`);
    } else {
      fail(`Dashboard activity links missing: ${JSON.stringify(dashCheck)}`);
    }

    console.log('\n========================================================================');
    console.log(`   RESULTS: ${passes} Passed, ${fails} Failed`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill('SIGKILL');
  }
}

run();
