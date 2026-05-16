// js/github.js
// GitHub activity + engagement system (single source of truth)

let REPO_OWNER = "jamesdneufeld";
let REPO_NAME = "ideawebring";

export function setRepoConfig(owner, name) {
  REPO_OWNER = owner;
  REPO_NAME = name;
}

/**
 * -------------------------
 * CACHE
 * -------------------------
 */
function getCacheKey(folder) {
  return `dashboard_activity_${folder}`;
}

function getCached(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  try {
    const { data, timestamp } = JSON.parse(cached);

    // 1 hour cache
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
 * -------------------------
 * CORE FETCH
 * -------------------------
 */
export async function fetchActivityForFolder(folder) {
  const cacheKey = getCacheKey(folder);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=1`;
    const res = await fetch(url);

    if (res.status === 404) {
      const result = buildActivity(null);
      setCache(cacheKey, result);
      return result;
    }

    const data = await res.json();
    const date = data?.[0]?.commit?.author?.date || null;

    const result = buildActivity(date);
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    return buildActivity(null);
  }
}

/**
 * -------------------------
 * SINGLE SOURCE OF TRUTH
 * -------------------------
 */
function buildActivity(date) {
  // No data case
  if (!date) {
    return {
      status: "unknown",
      lastCommitDate: null,
      lastCommit: null,
      daysSinceLastCommit: null,
      engagementScore: 0,
    };
  }

  const now = new Date();
  const commitDate = new Date(date);
  const days = (now - commitDate) / (1000 * 60 * 60 * 24);

  // STATUS SYSTEM (ONLY HERE)
  let status = "dormant";

  if (days <= 7) status = "active";
  else if (days <= 30) status = "recent";
  else status = "dormant";

  // ENGAGEMENT SCORE (0–100)
  let score = 0;

  if (days <= 7) {
    score = 100 - days * 5;
  } else if (days <= 30) {
    score = 60 - (days - 7) * 1.8;
  } else {
    score = Math.max(5, 30 - days * 0.2);
  }

  score = Math.max(0, Math.round(score));

  return {
    status,
    lastCommitDate: date,
    lastCommit: commitDate.toLocaleDateString(),
    daysSinceLastCommit: Math.floor(days),
    engagementScore: score,
  };
}

/**
 * -------------------------
 * BATCH
 * -------------------------
 */
export async function fetchActivityForAllStudents(students) {
  return Promise.all(students.map((s) => fetchActivityForFolder(s.id)));
}
