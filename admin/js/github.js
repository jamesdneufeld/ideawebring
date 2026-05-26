// js/github.js
// GitHub API + 3-factor engagement scoring (Recency + Frequency + Depth)

let REPO_OWNER = "jamesdneufeld";
let REPO_NAME = "ideawebring";

export function setRepoConfig(owner, name) {
  REPO_OWNER = owner;
  REPO_NAME = name;
}

// =========================
// CACHE
// =========================

function getCacheKey(folder) {
  return `dashboard_activity_${folder}`;
}

function getCached(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 60 * 60 * 1000) return data;
  } catch (e) {}

  return null;
}

function setCache(key, data) {
  localStorage.setItem(
    key,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );
}

// =========================
// FETCH
// =========================

export async function fetchActivityForFolder(folder) {
  const key = getCacheKey(folder);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=100`;
    const res = await fetch(url);

    if (!res.ok || res.status === 403) {
      const fallback = buildActivity(null, 0, 0);
      setCache(key, fallback);
      return fallback;
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    const commitDates = commits.map((c) => c?.commit?.author?.date).filter(Boolean);

    const lastCommitDate = commitDates[0] || null;
    const commitCount = commitDates.length;

    const activeWeeks = extractActiveWeeks(commitDates);

    const result = buildActivity(lastCommitDate, commitCount, activeWeeks);

    setCache(key, result);
    return result;
  } catch (err) {
    return buildActivity(null, 0, 0);
  }
}

// =========================
// DEPTH (WEEKS)
// =========================

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function extractActiveWeeks(commitDates) {
  const weeks = new Set();

  for (const date of commitDates) {
    const d = new Date(date);
    weeks.add(`${d.getFullYear()}-W${getISOWeek(d)}`);
  }

  return weeks.size;
}

// =========================
// SCORING MODEL (STABLE VERSION)
// =========================

function calculateRecencyScore(daysSince) {
  if (daysSince === null) return 0;

  if (daysSince <= 7) return 40;
  if (daysSince <= 30) return 25;
  if (daysSince <= 90) return 10;
  if (daysSince <= 180) return 5;

  return 0;
}

function calculateFrequencyScore(commitCount) {
  if (!commitCount) return 0;

  if (commitCount >= 30) return 35;
  if (commitCount >= 20) return 30;
  if (commitCount >= 10) return 22;
  if (commitCount >= 5) return 15;
  if (commitCount >= 1) return 5;

  return 0;
}

function calculateDepthScore(activeWeeks) {
  if (!activeWeeks) return 0;

  if (activeWeeks >= 20) return 25;
  if (activeWeeks >= 12) return 20;
  if (activeWeeks >= 8) return 15;
  if (activeWeeks >= 4) return 10;
  if (activeWeeks >= 2) return 6;
  if (activeWeeks >= 1) return 3;

  return 0;
}

// =========================
// STATUS (DERIVED FROM SCORE)
// =========================

function getStatus(score) {
  if (score >= 70) return "active";
  if (score >= 40) return "recent";
  return "dormant";
}

// =========================
// ENGAGEMENT BREAKDOWN (EXPLAINABLE)
// =========================

export function getEngagementBreakdown(activity) {
  if (!activity || activity.engagementScore === 0) {
    return "No activity recorded";
  }

  const parts = [];
  if (activity.recencyScore > 0) parts.push(`+${activity.recencyScore} recent activity`);
  if (activity.frequencyScore > 0) parts.push(`+${activity.frequencyScore} consistent commits`);
  if (activity.depthScore > 0) parts.push(`+${activity.depthScore} distributed over time`);

  return parts.join(", ");
}

// =========================
// CORE BUILDER
// =========================

function buildActivity(lastCommitDate, commitCount, activeWeeks) {
  if (!lastCommitDate) {
    return {
      status: "unknown",
      lastCommitDate: null,
      daysSince: null,
      commitCount: 0,
      activeWeeks: 0,
      engagementScore: 0,
      recencyScore: 0,
      frequencyScore: 0,
      depthScore: 0,
    };
  }

  const now = new Date();
  const commit = new Date(lastCommitDate);

  const daysSince = Math.floor((now - commit) / (1000 * 60 * 60 * 24));

  const recencyScore = calculateRecencyScore(daysSince);
  const frequencyScore = calculateFrequencyScore(commitCount);
  const depthScore = calculateDepthScore(activeWeeks);

  let engagementScore = recencyScore + frequencyScore + depthScore;

  engagementScore = Math.max(0, Math.min(100, engagementScore));

  return {
    status: getStatus(engagementScore),

    lastCommitDate,
    daysSince,
    commitCount,
    activeWeeks,

    engagementScore,
    recencyScore,
    frequencyScore,
    depthScore,
  };
}

// =========================
// BATCH
// =========================

export async function fetchActivityForAllStudents(students) {
  return Promise.all(students.map((s) => fetchActivityForFolder(s.id)));
}
