// summer-mentorship.js
// Web Ring Badge System - Learning continuity model (clean UI version)

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

// ISO week helper
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

    if (!res.ok) return fallbackActivity();

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
// DISPLAY HELPERS (TEXT ONLY)
// ------------------------------
function formatLastSeen(days) {
  if (days === null || days === undefined) return "No pushes yet";
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function getMembershipStatus(activity) {
  const commits = activity.commitCount || 0;
  const weeks = activity.activeWeeks || 0;

  if (commits === 0) return "Newcomer";
  if (commits <= 3) return "Contributor";
  if (weeks <= 6) return "Regular";
  if (weeks > 6) return "Veteran";
  return "Archive";
}

// ------------------------------
// LIFETIME SCORE (5 STAR SYSTEM)
// ------------------------------
function getLifetimeStars(activity, student) {
  const commits = activity.commitCount || 0;
  const weeks = activity.activeWeeks || 0;

  if (commits === 0) return 0;
  if (commits <= 1) return 1;
  if (commits <= 5) return 2;
  if (weeks <= 6) return 3;
  if (student?.isAlumni && weeks > 6) return 4;
  if (student?.isAlumni && commits > 30 && weeks > 12) return 5;

  return 3;
}

function renderStars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ------------------------------
// UI HELPERS
// ------------------------------
function setLine(container, label, value) {
  const div = document.createElement("div");
  div.className = "student-line";
  div.textContent = `${label}: ${value}`;
  container.appendChild(div);
}

// ------------------------------
// MAIN
// ------------------------------
async function populateStudentData() {
  await loadStudents();

  const studentMap = new Map(studentsData.map((s) => [s.id, s]));
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();

    const student = studentMap.get(folder);
    const activity = await getActivity(folder);

    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    // ------------------------------
    // FINAL CARD STRUCTURE
    // ------------------------------
    setLine(container, "Name", student?.displayName || folder);

    setLine(container, "Program", `${student?.program || ""} ${student?.year || ""}`.trim());

    setLine(container, "Last seen", formatLastSeen(activity.days));

    setLine(container, "Membership", getMembershipStatus(activity));

    setLine(container, "Lifetime Score", renderStars(getLifetimeStars(activity, student)));
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
