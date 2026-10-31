/**
 * DevPrep - User Progress Controller (`progressController.js`)
 * 
 * Concepts explained:
 * 1. User Data Isolation: Progress is strictly keyed by `req.user.id` from the JWT token.
 * 2. Unified Action Endpoint: Handles multiple operations (`markSolved`, `unmarkSolved`, `updateProfile`)
 *    through a clean, standardized single API contract `POST /api/progress`.
 * 3. Stored Streak Maintenance: Updates the `{ current, lastActiveDate }` object based on daily problem
 *    activity without relying on client-supplied timestamps.
 */

const { readJson, writeJson, FILES } = require('../utils/fileDb');
const { validateEnum, ALLOWED_PROGRESS_ACTIONS, ALLOWED_TOPICS } = require('../utils/validators');

/**
 * Returns empty baseline progress structure for a user
 */
function createDefaultProgress() {
  return {
    solvedQuestionIds: [],
    streak: { current: 0, lastActiveDate: null },
    activity: [],
    profile: {
      college: '',
      branch: '',
      graduationYear: '2026',
      targetRole: 'Software Development Engineer',
      weeklyGoal: 5,
      skills: [],
      goals: [],
      theme: 'light'
    }
  };
}

/**
 * GET /api/progress
 * Retrieve progress record for authenticated user, augmented with
 * computed dashboard metrics, topic completion breakdown, and weekly activity.
 */
async function getProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const progressMap = await readJson(FILES.PROGRESS, {});
    const userProgress = progressMap[userId] || createDefaultProgress();

    // Ensure profile has safe baseline structure
    userProgress.profile = {
      college: '',
      branch: '',
      graduationYear: '2026',
      targetRole: 'Software Development Engineer',
      weeklyGoal: 5,
      skills: [],
      goals: [],
      theme: 'light',
      ...(userProgress.profile || {})
    };

    // Read other collections to compute live aggregations
    const questions = await readJson(FILES.QUESTIONS, []);
    const mockAttempts = await readJson(FILES.MOCK_ATTEMPTS, []);
    const applications = await readJson(FILES.APPLICATIONS, []);

    // 1. Topic Progress Calculation (All 9 topics)
    // Filter solved IDs against active questions so deleted questions are strictly ignored
    const existingQuestionIds = new Set(questions.map((q) => q.id));
    const validSolvedIds = (userProgress.solvedQuestionIds || []).filter((id) =>
      existingQuestionIds.has(id)
    );
    const validSolvedSet = new Set(validSolvedIds);

    const topicProgress = ALLOWED_TOPICS.map((topic) => {
      const topicQuestions = questions.filter((q) => q.topic === topic);
      const total = topicQuestions.length;
      const solved = topicQuestions.filter((q) => validSolvedSet.has(q.id)).length;
      const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
      return {
        topic,
        solved,
        total,
        percent,
        percentage: percent // Backwards-compatible alias
      };
    });

    // 2. User Scoped Counts
    const userMockAttempts = (mockAttempts || []).filter((a) => a.userId === userId);
    const userApplications = (applications || []).filter((a) => a.userId === userId);
    const interviewCount = userApplications.filter((a) => a.status === 'Interview').length;

    // 3. Stats Summary Object
    const totalSolved = validSolvedSet.size;
    const totalQuestions = questions.length;
    const solvePercent = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

    const stats = {
      totalSolved,
      totalQuestions,
      solvePercent,
      solvePercentage: solvePercent,
      streak: userProgress.streak || { current: 0, lastActiveDate: null },
      mockTestsCount: userMockAttempts.length,
      applicationsCount: userApplications.length,
      interviewCount
    };

    // 4. Weekly Activity (Past 7 Days, rolling, aligned with UTC ISO timestamps)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];
    const now = Date.now();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getUTCDay()];

      // Count solves on this date from activity feed
      const count = (userProgress.activity || []).filter(
        (act) => act.type === 'solved' && act.date && act.date.startsWith(dateStr)
      ).length;

      weeklyActivity.push({
        day: dayName,
        date: dateStr,
        solved: count
      });
    }

    // 5. Unified Recent Activity Feed (Problem Solves + Mock Tests)
    const combinedActivity = [
      ...(userProgress.activity || []),
      ...userMockAttempts.map((a) => ({
        type: 'mock_test',
        text: `Completed ${a.topic} Mock Test (${a.score}/${a.total})`,
        date: a.date,
        attemptId: a.id
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.status(200).json({
      ...userProgress,
      activity: combinedActivity,
      stats,
      topicProgress,
      weeklyActivity
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/progress
 * Update user progress via action discriminator
 * Body: { action: "markSolved" | "unmarkSolved" | "updateProfile", questionId, skills, goals, theme }
 */
async function updateProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const { action, questionId, skills, goals, theme } = req.body;

    // Validate action enum
    const actionError = validateEnum(action, ALLOWED_PROGRESS_ACTIONS, 'action');
    if (actionError) {
      return res.status(400).json({ error: actionError });
    }

    const progressMap = await readJson(FILES.PROGRESS, {});
    const userProgress = progressMap[userId] || createDefaultProgress();

    if (action === 'markSolved') {
      if (!questionId) {
        return res.status(400).json({ error: 'Field "questionId" is required for markSolved' });
      }

      // Verify question exists in question bank
      const questions = await readJson(FILES.QUESTIONS, []);
      const question = questions.find((q) => q.id === questionId);
      if (!question) {
        return res.status(404).json({ error: `Question with ID "${questionId}" does not exist` });
      }

      // Add to solvedQuestionIds if not already present
      if (!userProgress.solvedQuestionIds.includes(questionId)) {
        userProgress.solvedQuestionIds.push(questionId);

        // Update stored streak
        const today = new Date().toISOString().split('T')[0];
        const lastDate = userProgress.streak.lastActiveDate;

        if (lastDate === today) {
          // Already solved a problem today: streak stays current
        } else if (lastDate) {
          const lastTime = new Date(lastDate).getTime();
          const currentTime = new Date(today).getTime();
          const diffDays = Math.round((currentTime - lastTime) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day: increment streak
            userProgress.streak.current = (userProgress.streak.current || 0) + 1;
          } else {
            // Broken streak: reset to 1
            userProgress.streak.current = 1;
          }
          userProgress.streak.lastActiveDate = today;
        } else {
          // First problem ever solved
          userProgress.streak.current = 1;
          userProgress.streak.lastActiveDate = today;
        }

        // Add activity entry
        userProgress.activity.unshift({
          type: 'solved',
          text: `Solved ${question.title}`,
          date: new Date().toISOString()
        });

        // Limit activity feed to latest 50 entries
        if (userProgress.activity.length > 50) {
          userProgress.activity = userProgress.activity.slice(0, 50);
        }
      }
    } else if (action === 'unmarkSolved') {
      if (!questionId) {
        return res.status(400).json({ error: 'Field "questionId" is required for unmarkSolved' });
      }

      userProgress.solvedQuestionIds = userProgress.solvedQuestionIds.filter((id) => id !== questionId);

      // Remove activity entry for this question if present
      const questions = await readJson(FILES.QUESTIONS, []);
      const question = questions.find((q) => q.id === questionId);
      if (question && Array.isArray(userProgress.activity)) {
        const targetText = `Solved ${question.title}`;
        const actIndex = userProgress.activity.findIndex((act) => act.text === targetText);
        if (actIndex !== -1) {
          userProgress.activity.splice(actIndex, 1);
        }
      }
    } else if (action === 'updateProfile') {
      const {
        skills,
        goals,
        theme,
        college,
        branch,
        graduationYear,
        targetRole,
        weeklyGoal
      } = req.body;

      if (!userProgress.profile) {
        userProgress.profile = {};
      }

      // 1. Validate & sanitize skills (array of strings, max 30 skills, max 30 chars each)
      if (skills !== undefined) {
        if (!Array.isArray(skills)) {
          return res.status(400).json({ error: 'Skills must be an array of strings' });
        }
        if (skills.length > 30) {
          return res.status(400).json({ error: 'Cannot exceed maximum of 30 skills' });
        }
        const cleanedSkills = [];
        for (const s of skills) {
          if (typeof s !== 'string' || !s.trim()) {
            return res.status(400).json({ error: 'Each skill must be a non-empty string' });
          }
          if (s.trim().length > 30) {
            return res.status(400).json({ error: `Skill "${s.trim()}" exceeds 30 character limit` });
          }
          const val = s.trim();
          if (!cleanedSkills.includes(val)) {
            cleanedSkills.push(val);
          }
        }
        userProgress.profile.skills = cleanedSkills;
      }

      // 2. Validate & sanitize goals (array of strings, max 15 goals, max 100 chars each)
      if (goals !== undefined) {
        if (!Array.isArray(goals)) {
          return res.status(400).json({ error: 'Goals must be an array of strings' });
        }
        if (goals.length > 15) {
          return res.status(400).json({ error: 'Cannot exceed maximum of 15 goals' });
        }
        const cleanedGoals = [];
        for (const g of goals) {
          if (typeof g !== 'string' || !g.trim()) {
            return res.status(400).json({ error: 'Each goal must be a non-empty string' });
          }
          if (g.trim().length > 150) {
            return res.status(400).json({ error: 'Each goal must not exceed 150 characters' });
          }
          const val = g.trim();
          if (!cleanedGoals.includes(val)) {
            cleanedGoals.push(val);
          }
        }
        userProgress.profile.goals = cleanedGoals;
      }

      // 3. Validate theme
      if (theme !== undefined) {
        if (theme !== 'light' && theme !== 'dark') {
          return res.status(400).json({ error: 'Theme must be either "light" or "dark"' });
        }
        userProgress.profile.theme = theme;
      }

      // 4. Academic & career fields (optional strings, max 100 chars)
      if (college !== undefined) {
        if (typeof college !== 'string' || college.length > 100) {
          return res.status(400).json({ error: 'College must be a string up to 100 characters' });
        }
        userProgress.profile.college = college.trim();
      }

      if (branch !== undefined) {
        if (typeof branch !== 'string' || branch.length > 100) {
          return res.status(400).json({ error: 'Branch must be a string up to 100 characters' });
        }
        userProgress.profile.branch = branch.trim();
      }

      if (graduationYear !== undefined) {
        const gradStr = String(graduationYear).trim();
        if (gradStr && (!/^\d{4}$/.test(gradStr) || Number(gradStr) < 2020 || Number(gradStr) > 2035)) {
          return res.status(400).json({ error: 'Graduation year must be a valid 4-digit year between 2020 and 2035' });
        }
        userProgress.profile.graduationYear = gradStr;
      }

      if (targetRole !== undefined) {
        if (typeof targetRole !== 'string' || targetRole.length > 100) {
          return res.status(400).json({ error: 'Target role must be a string up to 100 characters' });
        }
        userProgress.profile.targetRole = targetRole.trim();
      }

      if (weeklyGoal !== undefined) {
        const numGoal = Number(weeklyGoal);
        if (!Number.isInteger(numGoal) || numGoal < 1 || numGoal > 50) {
          return res.status(400).json({ error: 'Weekly goal must be an integer between 1 and 50 problems' });
        }
        userProgress.profile.weeklyGoal = numGoal;
      }
    }

    // Persist changes to progress.json
    progressMap[userId] = userProgress;
    await writeJson(FILES.PROGRESS, progressMap);

    res.status(200).json(userProgress);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProgress,
  updateProgress
};
