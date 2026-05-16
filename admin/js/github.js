// js/github.js
// Handles GitHub API + 3-factor engagement scoring (Recency + Frequency + Depth)

let REPO_OWNER = "jamesdneufeld";
let REPO_NAME = "ideawebring";

export function setRepoConfig(owner, name) {
  REPO_OWNER = owner;
  REPO_NAME = name;
}

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

export async function fetchActivityForFolder(folder) {
  const key = getCacheKey(folder);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    // Fetch last 50 commits to calculate frequency and depth
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=50`;
    const res = await fetch(url);

    if (!res.ok || res.status === 404) {
      const result = buildActivity(null, 0);
      setCache(key, result);
      return result;
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    // Extract commit dates
    const commitDates = commits.map((c) => c?.commit?.author?.date).filter((d) => d);

    const lastCommitDate = commitDates[0] || null;
    const commitCount = commitDates.length;

    const result = buildActivity(lastCommitDate, commitCount);
    setCache(key, result);
    return result;
  } catch (err) {
    return buildActivity(null, 0);
  }
}

// 3-Factor Engagement Model
function calculateRecencyScore(daysSince) {
  // 0-50 points based on days since last commit
  if (daysSince === null) return 0;
  if (daysSince <= 7) return 50;
  if (daysSince <= 30) return 30;
  if (daysSince <= 90) return 10;
  return 0;
}

function calculateFrequencyScore(commitCount) {
  // 0-30 points based on total commits
  if (!commitCount || commitCount === 0) return 0;
  if (commitCount >= 20) return 30;
  if (commitCount >= 10) return 25;
  if (commitCount >= 5) return 18;
  if (commitCount >= 3) return 12;
  if (commitCount >= 1) return 6;
  return 0;
}

function calculateDepthScore(commitCount) {
  // 0-20 points for meaningful activity
  if (!commitCount || commitCount === 0) return 0;
  if (commitCount >= 30) return 20;
  if (commitCount >= 15) return 15;
  if (commitCount >= 8) return 10;
  if (commitCount >= 3) return 5;
  return 2;
}

function buildActivity(lastCommitDate, commitCount) {
  if (!lastCommitDate) {
    return {
      status: "unknown",
      lastCommitDate: null,
      daysSince: null,
      commitCount: 0,
      engagementScore: 0,
      recencyScore: 0,
      frequencyScore: 0,
      depthScore: 0,
    };
  }

  const now = new Date();
  const commit = new Date(lastCommitDate);
  const daysSince = Math.floor((now - commit) / (1000 * 60 * 60 * 24));

  // Status based on recency only (for quick visual)
  let status = "dormant";
  if (daysSince <= 7) status = "active";
  else if (daysSince <= 30) status = "recent";

  // 3-Factor scores
  const recencyScore = calculateRecencyScore(daysSince);
  const frequencyScore = calculateFrequencyScore(commitCount);
  const depthScore = calculateDepthScore(commitCount);

  // Total engagement score (0-100)
  const engagementScore = recencyScore + frequencyScore + depthScore;

  return {
    status,
    lastCommitDate,
    daysSince,
    commitCount,
    engagementScore,
    recencyScore,
    frequencyScore,
    depthScore,
  };
}

export async function fetchActivityForAllStudents(students) {
  return Promise.all(students.map((s) => fetchActivityForFolder(s.id)));
}
