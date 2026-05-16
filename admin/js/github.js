// js/github.js
// Handles all GitHub API calls with caching (Dashboard only)

let REPO_OWNER = "jamesdneufeld";
let REPO_NAME = "ideawebring";

export function setRepoConfig(owner, name) {
  REPO_OWNER = owner;
  REPO_NAME = name;
}

/**
 * -----------------------------
 * SYSTEM FOLDER FILTER (SOURCE OF TRUTH)
 * -----------------------------
 * These folders are NEVER treated as students anywhere in the dashboard.
 */
const SYSTEM_FOLDERS = new Set(["admin", ".github", ".vscode", "node_modules"]);

function isSystemFolder(name = "") {
  if (!name) return true;
  const n = name.toLowerCase();

  return SYSTEM_FOLDERS.has(n) || n.startsWith(".");
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
  const cacheKey = getCacheKey(folder);
  const cached = getCached(cacheKey);

  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=1`;
    const res = await fetch(url);

    if (res.status === 404) {
      const result = { status: "dormant", date: null, lastCommit: null };
      setCache(cacheKey, result);
      return result;
    }

    const data = await res.json();
    const date = data?.[0]?.commit?.author?.date || null;

    let status = "dormant";

    if (date) {
      const days = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);

      if (days <= 7) status = "active";
      else if (days <= 30) status = "recent";
    }

    const result = {
      status,
      date,
      lastCommit: date ? new Date(date).toLocaleDateString() : null,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    return { status: "dormant", date: null, lastCommit: null };
  }
}

/**
 * MAIN SAFETY LAYER
 * This ensures ONLY valid student IDs are ever processed.
 */
export async function fetchActivityForAllStudents(students) {
  const safeStudents = (students || []).filter((s) => {
    if (!s?.id) return false;
    if (isSystemFolder(s.id)) return false;
    return true;
  });

  const results = await Promise.all(safeStudents.map((s) => fetchActivityForFolder(s.id)));

  // Return keyed map for safety (avoids index mismatch bugs)
  const map = {};

  safeStudents.forEach((s, i) => {
    map[s.id] = results[i];
  });

  return map;
}
