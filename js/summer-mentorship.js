// summer-mentorship.js
// Web Ring Badge System - Learning continuity model

const REPO_OWNER = "jamesdneufeld";
const REPO_NAME = "ideawebring";

let studentsData = [];

// Cache helpers (1 hour TTL)
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

// ISO week helper (for mentorship “seasons”)
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// ------------------------------
// GITHUB ACTIVITY
// ------------------------------
async function getActivity(folder) {
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=50`;
    const res = await fetch(url);

    if (!res.ok) {
      return fallbackActivity();
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    const lastCommit = commits[0];
    const date = lastCommit?.commit?.author?.date || null;
    const commitCount = commits.length;

    const activeWeeks = new Set();

    commits.forEach((c) => {
      const d = new Date(c?.commit?.author?.date);
      if (!isNaN(d)) {
        const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
        activeWeeks.add(weekKey);
      }
    });

    let days = null;

    if (date) {
      days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    }

    const result = {
      days,
      commitCount,
      activeWeeks: activeWeeks.size,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return fallbackActivity();
  }
}

function fallbackActivity() {
  return {
    days: null,
    commitCount: 0,
    activeWeeks: 0,
  };
}

// ------------------------------
// STUDENTS
// ------------------------------
async function loadStudents() {
  try {
    const res = await fetch("./students.json");
    const data = await res.json();
    studentsData = data.students || [];
  } catch {
    studentsData = [];
  }
}

// ------------------------------
// LAST SEEN (pure metric)
// ------------------------------
function formatLastSeen(days) {
  if (days === null || days === undefined) return "No pushes";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

// ------------------------------
// STATUS SYSTEM (identity tier)
// ------------------------------
function getStatus(activity, student) {
  const commits = activity.commitCount || 0;
  const weeks = activity.activeWeeks || 0;

  // No collaboration yet
  if (commits === 0) return "Newcomer";

  // Early engagement
  if (commits <= 3) return "Contributor";

  // Consistent engagement in one season
  if (weeks <= 6) return "Regular";

  // Multi-season engagement (your key definition)
  if (weeks > 6 && student?.isAlumni) return "Veteran";

  // Long inactive / legacy
  return "Archive";
}

// ------------------------------
// LIFETIME SCORE (5-star irreversible system)
// ------------------------------
function getLifetimeStars(activity, student) {
  const commits = activity.commitCount || 0;
  const weeks = activity.activeWeeks || 0;

  // 0 stars: invited / no real contribution
  if (commits === 0) return 0;

  // 1 star: first contribution
  if (commits <= 1) return 1;

  // 2 stars: early engagement (multiple pushes same season)
  if (commits <= 5) return 2;

  // 3 stars: sustained engagement across one mentorship cycle
  if (weeks <= 6) return 3;

  // 4 stars: returning after graduation / multiple seasons
  if (student?.isAlumni && weeks > 6) return 4;

  // 5 stars: long-term multi-year contributor (rare tier)
  if (student?.isAlumni && commits > 30 && weeks > 12) return 5;

  return 3;
}

function renderStars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ------------------------------
// BADGE CREATION
// ------------------------------
function createBadge(className, text = "", title = "") {
  const li = document.createElement("li");
  li.className = `badge ${className}`;
  if (text) li.textContent = text;
  if (title) li.title = title;
  return li;
}

// ------------------------------
// MAIN RENDER
// ------------------------------
async function populateStudentData() {
  await loadStudents();
  const studentMap = new Map(studentsData.map((s) => [s.id, s]));
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();

    const student = studentMap.get(folder);
    const activity = await getActivity(folder);

    // update meta
    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const badgesContainer = link.querySelector(".student-badges");
    if (!badgesContainer) continue;

    badgesContainer.innerHTML = "";

    // ------------------------------
    // BADGE 1: LAST SEEN
    // ------------------------------
    const lastSeenText = formatLastSeen(activity.days);
    badgesContainer.appendChild(createBadge("badge-last-seen", lastSeenText, activity.days !== null ? `${activity.days} days since last push` : ""));

    // ------------------------------
    // BADGE 2: STATUS (identity tier)
    // ------------------------------
    const status = getStatus(activity, student);
    badgesContainer.appendChild(createBadge(`badge-participation-${status}`, status));

    // ------------------------------
    // BADGE 3: LIFETIME SCORE
    // ------------------------------
    const stars = getLifetimeStars(activity, student);
    badgesContainer.appendChild(createBadge("badge-lifetime badge-lifetime-stars", renderStars(stars), `Lifetime Score: ${stars}/5`));
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
