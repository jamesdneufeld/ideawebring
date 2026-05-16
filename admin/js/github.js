// js/github.js

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
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=1`;

    const res = await fetch(url);

    if (!res.ok || res.status === 404) {
      return buildActivity(null);
    }

    const data = await res.json();
    const date = data?.[0]?.commit?.author?.date || null;

    const result = buildActivity(date);

    setCache(key, result);
    return result;
  } catch (err) {
    return buildActivity(null);
  }
}

function buildActivity(date) {
  if (!date) {
    return {
      status: "unknown",
      lastCommitDate: null,
      daysSince: null,
      engagementScore: 0,
    };
  }

  const now = new Date();
  const commit = new Date(date);

  const days = (now - commit) / (1000 * 60 * 60 * 24);

  let status = "dormant";
  if (days <= 7) status = "active";
  else if (days <= 30) status = "recent";

  // SAFE engagement model (no inflation)
  const engagementScore = Math.max(0, Math.round(100 - days * 2));

  return {
    status,
    lastCommitDate: date,
    daysSince: Math.floor(days),
    engagementScore,
  };
}

export async function fetchActivityForAllStudents(students) {
  return Promise.all(students.map((s) => fetchActivityForFolder(s.id)));
}
