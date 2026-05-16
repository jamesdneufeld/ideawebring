// summer-mentorship.js
// Web Ring Badge System - Learning continuity model

const REPO_OWNER = "jamesdneufeld";
const REPO_NAME = "ideawebring";

let studentsData = [];

/* =========================
   CACHE
========================= */

function getCache(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp < 60 * 60 * 1000) return data.value;
  } catch {}
  return null;
}

function setCache(key, value) {
  localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
}

/* =========================
   WEEK HELPER
========================= */

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/* =========================
   GITHUB ACTIVITY
========================= */

async function getActivity(folder) {
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=100`;
    const res = await fetch(url);

    if (!res.ok) {
      return {
        days: null,
        commitCount: 0,
        activeYears: 0,
        activeWeeks: 0,
        commits: [],
      };
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    const lastCommit = commits[0];
    const lastDate = lastCommit?.commit?.author?.date || null;

    let days = null;
    if (lastDate) {
      days = Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
    }

    /* =========================
       ACTIVITY ANALYTICS
    ========================= */

    const years = new Set();
    const weeks = new Set();

    commits.forEach((c) => {
      const d = new Date(c?.commit?.author?.date);
      if (!isNaN(d)) {
        years.add(d.getFullYear());
        weeks.add(`${d.getFullYear()}-W${getWeekNumber(d)}`);
      }
    });

    const result = {
      days,
      commitCount: commits.length,
      activeYears: years.size,
      activeWeeks: weeks.size,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return {
      days: null,
      commitCount: 0,
      activeYears: 0,
      activeWeeks: 0,
    };
  }
}

/* =========================
   MEMBERSHIP MODEL
========================= */

function getMembership(activity) {
  const commits = activity.commitCount;
  const years = activity.activeYears;
  const gaps = activity.activeWeeks;

  // Core idea:
  // - commits = intensity
  // - years = longevity
  // - weeks = continuity

  if (years === 0 && commits === 0) return "Archive";

  if (years === 1 && commits <= 3) return "Newcomer";

  if (years <= 1 && commits <= 15) return "Contributor";

  if (years <= 2 && commits > 15) return "Regular";

  if (years >= 2 && commits > 30 && gaps > 8) return "Veteran";

  if (years >= 3) return "Veteran";

  return "Contributor";
}

/* =========================
   LIFETIME SCORE (0–5 stars, never decreases conceptually)
========================= */

function getLifetimeScore(activity) {
  let score = 0;

  if (activity.commitCount >= 1) score = 1;
  if (activity.commitCount >= 5) score = 2;
  if (activity.commitCount >= 15) score = 3;
  if (activity.commitCount >= 30) score = 4;
  if (activity.activeYears >= 2 && activity.commitCount >= 20) score = 5;

  return score;
}

/* =========================
   LOAD STUDENTS
========================= */

async function loadStudents() {
  try {
    const res = await fetch("./students.json");
    const data = await res.json();
    studentsData = data.students || [];
  } catch {
    studentsData = [];
  }
}

/* =========================
   UI HELPERS
========================= */

function createLine(text) {
  const li = document.createElement("li");
  li.className = "student-line";
  li.textContent = text;
  return li;
}

/* =========================
   MAIN RENDER
========================= */

async function populateStudentData() {
  await loadStudents();

  const studentMap = new Map(studentsData.map((s) => [s.id, s]));
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();

    const student = studentMap.get(folder);
    const container = link.querySelector(".student-badges");

    if (!container) continue;
    container.innerHTML = "";

    const activity = await getActivity(folder);

    const membership = getMembership(activity);
    const lifetime = getLifetimeScore(activity);

    const stars = "★".repeat(lifetime) + "☆".repeat(5 - lifetime);

    /* =========================
       REQUIRED OUTPUT (ONLY 3 LINES)
    ========================= */

    container.appendChild(createLine(activity.days !== null ? `Last seen: ${activity.days} days ago` : "Last seen: No activity"));

    container.appendChild(createLine(`Membership: ${membership}`));

    container.appendChild(createLine(`Lifetime Score: ${stars}`));
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
