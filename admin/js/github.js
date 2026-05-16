// js/github.js
// Handles all GitHub API calls with caching (Enhanced status system)

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

    if (Date.now() - timestamp < 60 * 60 * 1000) {
      return data;
    }
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

/**
 * Core activity fetcher
 */
export async function fetchActivityForFolder(folder) {
  const cacheKey = getCacheKey(folder);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=1`;
    const res = await fetch(url);

    if (res.status === 404) {
      const result = buildActivityObject(null);
      setCache(cacheKey, result);
      return result;
    }

    const data = await res.json();
    const date = data?.[0]?.commit?.author?.date || null;

    const result = buildActivityObject(date);
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    return buildActivityObject(null);
  }
}

/**
 * Convert raw date → full dashboard activity object
 */
function buildActivityObject(date) {
  if (!date) {
    return {
      status: "unknown",
      lastCommitDate: null,
      lastCommit: null,
      lastSeenLabel: "Never seen",
      daysSinceLastCommit: null,
      engagementScore: 0,
    };
  }

  const now = new Date();
  const commitDate = new Date(date);

  const daysSince = Math.floor((now - commitDate) / (1000 * 60 * 60 * 24));

  // -----------------------------
  // STATUS SYSTEM (clean + stable)
  // -----------------------------
  let status = "dormant";

  if (daysSince <= 7) status = "active";
  else if (daysSince <= 30) status = "recent";
  else status = "dormant";

  // -----------------------------
  // LAST SEEN LABEL (UI FRIENDLY)
  // -----------------------------
  const lastSeenLabel = daysSince === 0 ? "Today" : daysSince === 1 ? "1 day ago" : `${daysSince} days ago`;

  // -----------------------------
  // ENGAGEMENT SCORE (0–100)
  // -----------------------------
  let engagementScore = 0;

  if (daysSince <= 7) {
    engagementScore = 100 - daysSince * 5;
  } else if (daysSince <= 30) {
    engagementScore = 60 - (daysSince - 7) * 1.8;
  } else {
    engagementScore = 30 - daysSince * 0.2;
  }

  engagementScore = Math.max(0, Math.min(100, Math.round(engagementScore)));

  return {
    status,
    lastCommitDate: date,
    lastCommit: commitDate.toLocaleDateString(),
    lastSeenLabel,
    daysSinceLastCommit: daysSince,
    engagementScore,
  };
}

/**
 * Batch fetch
 */
export async function fetchActivityForAllStudents(students) {
  const promises = students.map((s) => fetchActivityForFolder(s.id));

  return Promise.all(promises);
}
