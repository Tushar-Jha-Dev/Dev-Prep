/**
 * DevPrep - Database Seeding Script (`seed.js`)
 * 
 * Works identically against both storage drivers ('file' and 'postgres').
 * 
 * Safety & Invariants:
 * 1. Fully idempotent: never overwrites or deletes existing records.
 * 2. In production (NODE_ENV=production):
 *    - Requires ADMIN_PASSWORD from env (rejects missing, empty, <8 chars, or "Admin@1234").
 *    - Seeds demo user ONLY if ALLOW_DEMO_USER=true is set.
 * 3. In development/testing:
 *    - Falls back to default credentials with a clear warning.
 *    - Seeds demo user and sample progress, solution, applications, and attempts.
 * 4. Loads 36 DSA questions and 45 MCQs from tracked data files (`questions.json` and `mcqBank.json`).
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { getStorage } = require('../storage');

async function seed() {
  console.log('--- Starting DevPrep Database Seeding ---');

  const storage = getStorage();
  await storage.init();
  console.log(`Active storage driver: "${storage.getDriverName()}"`);

  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@devprep.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (isProduction) {
    if (
      !adminPassword ||
      typeof adminPassword !== 'string' ||
      adminPassword.trim().length < 8 ||
      adminPassword === 'Admin@1234'
    ) {
      throw new Error(
        'In production (NODE_ENV=production), ADMIN_PASSWORD must be defined in environment, at least 8 characters long, and cannot be "Admin@1234".'
      );
    }
  }

  const finalAdminPassword = adminPassword || 'Admin@1234';
  const shouldSeedDemo = !isProduction || process.env.ALLOW_DEMO_USER === 'true';

  if (finalAdminPassword === 'Admin@1234') {
    console.warn('\n⚠️  [seed] WARNING: Using default development credentials ("Admin@1234").');
    console.warn('    Set ADMIN_PASSWORD in server/.env and change passwords before deploying to production!\n');
  }

  const adminId = 'user-admin-default';
  const demoId = 'user-demo-default';
  const demoEmail = 'demo@devprep.com';
  const demoPassword = 'Demo@1234';

  // 1. Seed Admin User (idempotent)
  const existingAdmin = await storage.findUserByEmail(adminEmail);
  if (!existingAdmin) {
    const adminPasswordHash = await bcrypt.hash(finalAdminPassword, 10);
    const adminInitialProgress = {
      solvedQuestionIds: [],
      streak: { current: 0, lastActiveDate: null },
      activity: [
        {
          type: 'account_created',
          text: 'Admin account provisioned',
          date: new Date().toISOString()
        }
      ],
      profile: {
        college: '',
        branch: '',
        graduationYear: '2026',
        targetRole: 'Software Development Engineer',
        weeklyGoal: 5,
        skills: ['JavaScript', 'Node.js', 'System Architecture'],
        goals: ['Manage platform content'],
        theme: 'light'
      }
    };

    await storage.createUser(
      {
        id: adminId,
        name: 'DevPrep Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      adminInitialProgress
    );
    console.log(`✓ Seeded admin user (${adminEmail}).`);
  } else {
    console.log(`- Admin user (${adminEmail}) already exists; skipping.`);
  }

  // 2. Seed Demo User, Applications, Solution, Attempts (idempotent, if allowed)
  if (shouldSeedDemo) {
    const existingDemo = await storage.findUserByEmail(demoEmail);
    if (!existingDemo) {
      const demoPasswordHash = await bcrypt.hash(demoPassword, 10);
      const demoSolvedQuestionIds = [
        'q-arr-1',
        'q-arr-2',
        'q-str-1',
        'q-ll-1',
        'q-stk-1',
        'q-tree-1',
        'q-dp-1',
        'q-bs-1'
      ];
      const todayStr = new Date().toISOString().split('T')[0];
      const demoInitialProgress = {
        solvedQuestionIds: demoSolvedQuestionIds,
        streak: {
          current: 3,
          lastActiveDate: todayStr
        },
        activity: [
          {
            type: 'solved',
            text: 'Solved Two Sum',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            type: 'solved',
            text: 'Solved Valid Parentheses',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            type: 'solved',
            text: 'Solved Climbing Stairs',
            date: new Date().toISOString()
          }
        ],
        profile: {
          college: '',
          branch: '',
          graduationYear: '2026',
          targetRole: 'Software Development Engineer',
          weeklyGoal: 5,
          skills: ['JavaScript', 'React', 'DSA'],
          goals: ['Crack SDE Internship 2026'],
          theme: 'light'
        }
      };

      await storage.createUser(
        {
          id: demoId,
          name: 'Demo Student',
          email: demoEmail,
          passwordHash: demoPasswordHash,
          role: 'user',
          createdAt: new Date().toISOString()
        },
        demoInitialProgress
      );
      console.log(`✓ Seeded demo user (${demoEmail}).`);
    } else {
      console.log(`- Demo user (${demoEmail}) already exists; skipping.`);
    }

    // Seed Demo Solution
    const demoSolution = {
      id: 'sol-demo-1',
      userId: demoId,
      questionId: 'q-arr-1',
      language: 'JavaScript',
      code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      updatedAt: new Date().toISOString()
    };

    const existingSolutions = await storage.findSolutionsByQuestion(demoId, demoSolution.questionId);
    if (existingSolutions.length === 0) {
      await storage.saveSolution(demoId, demoSolution.questionId, {
        language: demoSolution.language,
        code: demoSolution.code
      });
      console.log(`✓ Seeded demo solution for "${demoSolution.questionId}".`);
    } else {
      console.log(`- Demo solution for "${demoSolution.questionId}" already exists; skipping.`);
    }

    // Seed Demo Applications
    const demoApplications = [
      {
        id: 'app-demo-1',
        userId: demoId,
        company: 'Google',
        role: 'SDE Intern',
        location: 'Bangalore',
        appliedDate: '2026-10-05',
        status: 'Interview',
        notes: 'Round 1 technical interview scheduled on DSA and Problem Solving.'
      },
      {
        id: 'app-demo-2',
        userId: demoId,
        company: 'Microsoft',
        role: 'Software Engineer',
        location: 'Hyderabad',
        appliedDate: '2026-10-12',
        status: 'Applied',
        notes: 'Applied via employee referral from college alumni network.'
      },
      {
        id: 'app-demo-3',
        userId: demoId,
        company: 'Amazon',
        role: 'SDE 1',
        location: 'Bangalore',
        appliedDate: '2026-09-28',
        status: 'Selected',
        notes: 'Received offer letter! 6-month internship + full-time conversion.'
      },
      {
        id: 'app-demo-4',
        userId: demoId,
        company: 'Uber',
        role: 'Backend Intern',
        location: 'Bangalore',
        appliedDate: '2026-10-02',
        status: 'Rejected',
        notes: 'Online assessment had tricky graph and dynamic programming questions.'
      },
      {
        id: 'app-demo-5',
        userId: demoId,
        company: 'Razorpay',
        role: 'Frontend Engineer',
        location: 'Remote',
        appliedDate: '2026-10-18',
        status: 'Interview',
        notes: 'Machine coding round in React completed; hiring manager round pending.'
      }
    ];

    const existingApps = await storage.listApplications(demoId);
    const existingAppIds = new Set(existingApps.map((a) => a.id));
    let seededApps = 0;
    for (const app of demoApplications) {
      if (!existingAppIds.has(app.id)) {
        await storage.createApplication(app);
        seededApps++;
      }
    }
    console.log(`✓ Seeded ${seededApps} demo applications (${existingApps.length} already existed).`);

    // Seed Demo Mock Attempts
    const demoAttempts = [
      {
        id: 'att-demo-1',
        userId: demoId,
        topic: 'Arrays',
        score: 4,
        total: 5,
        accuracy: 80,
        timeTaken: 145,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        topicBreakdown: { Arrays: { score: 4, total: 5 } }
      },
      {
        id: 'att-demo-2',
        userId: demoId,
        topic: 'Trees',
        score: 5,
        total: 5,
        accuracy: 100,
        timeTaken: 190,
        date: new Date(Date.now() - 86400000).toISOString(),
        topicBreakdown: { Trees: { score: 5, total: 5 } }
      }
    ];

    const existingAttemptsResult = await storage.listAttempts(demoId);
    const existingAttempts = Array.isArray(existingAttemptsResult)
      ? existingAttemptsResult
      : (existingAttemptsResult.attempts || []);
    const existingAttemptIds = new Set(existingAttempts.map((a) => a.id));
    let seededAttempts = 0;
    for (const att of demoAttempts) {
      if (!existingAttemptIds.has(att.id)) {
        await storage.createAttempt(att);
        seededAttempts++;
      }
    }
    console.log(`✓ Seeded ${seededAttempts} demo mock test attempts (${existingAttempts.length} already existed).`);
  } else {
    console.log('- Demo user seeding skipped (production mode without ALLOW_DEMO_USER=true).');
  }

  // 3. Seed 36 DSA Questions from tracked server/data/questions.json
  const questionsPath = path.join(__dirname, '../data/questions.json');
  if (fs.existsSync(questionsPath)) {
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    const existingQuestions = await storage.listQuestions();
    const existingQuestionIds = new Set(existingQuestions.map((q) => q.id));
    let seededQuestions = 0;
    for (const q of questionsData) {
      if (!existingQuestionIds.has(q.id)) {
        await storage.createQuestion(q);
        seededQuestions++;
      }
    }
    console.log(`✓ Seeded ${seededQuestions} DSA questions (${existingQuestions.length} already existed).`);
  } else {
    console.warn(`⚠️  Tracked questions file not found at "${questionsPath}".`);
  }

  // 4. Seed 45 MCQs from tracked server/data/mcqBank.json
  const mcqPath = path.join(__dirname, '../data/mcqBank.json');
  if (fs.existsSync(mcqPath)) {
    const mcqData = JSON.parse(fs.readFileSync(mcqPath, 'utf8'));
    const existingMcqs = await storage.listMcqs();
    const existingMcqIds = new Set(existingMcqs.map((m) => m.id));
    let seededMcqs = 0;
    for (const m of mcqData) {
      if (!existingMcqIds.has(m.id)) {
        await storage.createMcq(m);
        seededMcqs++;
      }
    }
    console.log(`✓ Seeded ${seededMcqs} MCQs (${existingMcqs.length} already existed).`);
  } else {
    console.warn(`⚠️  Tracked MCQ bank file not found at "${mcqPath}".`);
  }

  await storage.close();

  console.log('\n=========================================');
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY! ✓');
  console.log('=========================================');
}

seed().catch((err) => {
  console.error('\n❌ Seeding failed:', err.message || err);
  process.exit(1);
});
