const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const http = require('http');

async function runFreshSetupTest() {
  const tempDir = path.join(os.tmpdir(), `devprep-fresh-${Date.now()}`);
  console.log(`\n========================================================================`);
  console.log(`        DevPrep QA: Fresh Setup Simulation from Scratch                 `);
  console.log(`========================================================================\n`);
  console.log(`1. Target directory: ${tempDir}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // 1. Export tracked files
    console.log('2. Exporting tracked files from git archive...');
    const projectRoot = path.resolve(__dirname, '../..');
    const archiveTar = path.join(tempDir, 'repo.tar');
    execSync(`git archive --format=tar HEAD -o "${archiveTar}"`, { cwd: projectRoot, stdio: 'inherit' });
    execSync(`tar -xf "${archiveTar}" -C "${tempDir}"`, { cwd: tempDir, stdio: 'inherit' });
    fs.unlinkSync(archiveTar);
    console.log('   ✓ Tracked files extracted cleanly');

    // 2. Configure server .env
    console.log('3. Copying server/.env.example to server/.env (using PORT=5005)...');
    const envExamplePath = path.join(tempDir, 'server/.env.example');
    const envPath = path.join(tempDir, 'server/.env');
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    envContent = envContent.replace('PORT=5000', 'PORT=5005');
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('   ✓ server/.env configured');

    // 3. Install packages in server & client
    console.log('4. Running npm install in server...');
    execSync('npm.cmd install --prefer-offline --no-audit', { cwd: path.join(tempDir, 'server'), stdio: 'inherit' });
    console.log('   ✓ server npm install complete');

    console.log('5. Running npm install in client...');
    execSync('npm.cmd install --prefer-offline --no-audit', { cwd: path.join(tempDir, 'client'), stdio: 'inherit' });
    console.log('   ✓ client npm install complete');

    // 4. Run database seed
    console.log('6. Executing database seed: npm run seed in server...');
    execSync('npm.cmd run seed', { cwd: path.join(tempDir, 'server'), stdio: 'inherit' });
    const usersData = JSON.parse(fs.readFileSync(path.join(tempDir, 'server/data/users.json'), 'utf8'));
    console.log(`   ✓ Seed successful: ${usersData.length} users seeded`);

    // 5. Run client build
    console.log('7. Executing client production build: npm run build in client...');
    execSync('npm.cmd run build', { cwd: path.join(tempDir, 'client'), stdio: 'inherit' });
    const distIndex = path.join(tempDir, 'client/dist/index.html');
    if (!fs.existsSync(distIndex)) {
      throw new Error('client/dist/index.html was not generated');
    }
    console.log('   ✓ Client built successfully (dist/ ready)');

    // 6. Start server and verify /api/health
    console.log('8. Starting server on PORT 5005 and probing /api/health...');
    const serverProcess = spawn('node', ['server.js'], {
      cwd: path.join(tempDir, 'server'),
      env: { ...process.env, PORT: '5005' },
      stdio: 'pipe'
    });

    let healthOk = false;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const res = await new Promise((resolve, reject) => {
          const req = http.get('http://localhost:5005/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
          });
          req.on('error', reject);
          req.setTimeout(1000, () => req.destroy());
        });

        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'ok') {
            healthOk = true;
            console.log(`   ✓ /api/health returned 200 OK: ${res.body}`);
            break;
          }
        }
      } catch (e) {
        // Retry
      }
    }

    serverProcess.kill('SIGTERM');

    if (!healthOk) {
      throw new Error('Health check failed or timed out on PORT 5005');
    }

    console.log('\n========================================================================');
    console.log('   ✓ ALL FRESH SETUP CHECKS PASSED');
    console.log('========================================================================\n');

  } finally {
    console.log('9. Cleaning up temporary directory...');
    try {
      fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 3 });
      console.log('   ✓ Cleaned up temp directory successfully');
    } catch (cleanupErr) {
      console.warn('   (Note during cleanup):', cleanupErr.message);
    }
  }
}

runFreshSetupTest().catch(err => {
  console.error('Fresh setup test failed:', err);
  process.exit(1);
});
