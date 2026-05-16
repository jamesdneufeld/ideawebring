// js/github.js
// Handles all GitHub API calls with caching (Dashboard version)

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
 * Fetch activity for a single student folder
 * Returns a normalized activity object used everywhere in dashboard
 */
export async function fetchActivityForFolder(folder) {
  const cacheKey = getCacheKey(folder);
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=1`;
    const res = await fetch(url);

    // Folder exists but no commits found
    if (res.status === 404) {
      const result = {
        status: "dormant",
        date: null,
        lastCommitDate: null,
        lastCommit: null,
      };

      setCache(cacheKey, result);
      return result;
    }

    const data = await res.json();

    const date = data?.[0]?.commit?.author?.date || null;

    // Compute activity status
    let status = "dormant";

    if (date) {
      const daysSince = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);

      if (daysSince <= 7) status = "active";
      else if (daysSince <= 30) status = "recent";
      else status = "dormant";
    }

    const result = {
      status,

      // raw ISO date from GitHub
      date,

      // IMPORTANT: used by filters/sorting
      lastCommitDate: date,

      // formatted for UI display
      lastCommit: date ? new Date(date).toLocaleDateString() : null,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    const fallback = {
      status: "dormant",
      date: null,
      lastCommitDate: null,
      lastCommit: null,
    };

    return fallback;
  }
}

/**
 * Fetch activity for all students (parallelized)
 */
export async function fetchActivityForAllStudents(students) {
  const promises = students.map((s) => fetchActivityForFolder(s.id));

  return Promise.all(promises);
}
