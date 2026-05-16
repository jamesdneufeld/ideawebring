// js/github.js
// GitHub activity engine (recency + frequency + depth + engagement)

let REPO_OWNER = "jamesdneufeld";
let REPO_NAME = "ideawebring";

export function setRepoConfig(owner, name) {
  REPO_OWNER = owner;
  REPO_NAME = name;
}

function cacheKey(folder) {
  return `dashboard_activity_${folder}`;
}

function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
      return parsed.data;
    }
  } catch {}
  return null;
}

function setCached(key, data) {
  localStorage.setItem(
    key,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    }),
  );
}

// -----------------------------
// CORE FETCH (single student)
// -----------------------------
export async function fetchActivityForFolder(folder) {
  const key = cacheKey(folder);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    // 1) last commit
    const lastRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=1`);

    const lastData = await lastRes.json();
    const lastCommitDate = lastData?.[0]?.commit?.author?.date || null;

    // 2) commit history (for frequency + depth)
    const histRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=100`);

    const histData = await histRes.json();
    const commits = Array.isArray(histData) ? histData : [];

    const now = new Date();

    // -----------------------------
    // STRICT RECENCY
    // -----------------------------
    let daysSinceLastCommit = null;
    let recencyScore = 0;
    let status = "unknown";

    if (lastCommitDate) {
      const d = (now - new Date(lastCommitDate)) / (1000 * 60 * 60 * 24);
      daysSinceLastCommit = Math.floor(d);

      if (d <= 7) {
        status = "active";
        recencyScore = 50 - d * 3;
      } else if (d <= 30) {
        status = "recent";
        recencyScore = 25 - (d - 7) * 0.8;
      } else {
        status = "dormant";
        recencyScore = 0;
      }
    }

    // -----------------------------
    // FREQUENCY (last 30 days)
    // -----------------------------
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const recentCommits = commits.filter((c) => {
      const date = new Date(c?.commit?.author?.date);
      return date >= cutoff;
    }).length;

    let frequencyScore = 0;
    if (recentCommits === 0) frequencyScore = 0;
    else if (recentCommits <= 3) frequencyScore = 10;
    else if (recentCommits <= 10) frequencyScore = 20;
    else frequencyScore = 30;

    // -----------------------------
    // DEPTH (total commits cap 100)
    // -----------------------------
    const totalCommits = commits.length;

    let depthScore = 0;
    if (totalCommits >= 50) depthScore = 20;
    else if (totalCommits >= 20) depthScore = 15;
    else if (totalCommits >= 6) depthScore = 10;
    else if (totalCommits >= 1) depthScore = 5;

    // -----------------------------
    // FINAL ENGAGEMENT (STRICT)
    // -----------------------------
    const engagementScore = Math.max(0, Math.min(100, Math.round(recencyScore + frequencyScore + depthScore)));

    const result = {
      status,
      lastCommitDate,
      lastCommit: lastCommitDate ? new Date(lastCommitDate).toLocaleDateString() : null,
      daysSinceLastCommit,
      recentCommits,
      totalCommits,
      engagementScore,
    };

    setCached(key, result);
    return result;
  } catch (e) {
    return {
      status: "unknown",
      lastCommitDate: null,
      lastCommit: null,
      daysSinceLastCommit: null,
      recentCommits: 0,
      totalCommits: 0,
      engagementScore: 0,
    };
  }
}

// -----------------------------
export async function fetchActivityForAllStudents(students) {
  return Promise.all(students.map((s) => fetchActivityForFolder(s.id)));
}
