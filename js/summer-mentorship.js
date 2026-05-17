// summer-mentorship.js
// Web Ring Badge System - Learning continuity model (stable version)

const REPO_OWNER = "jamesdneufeld";
const REPO_NAME = "ideawebring";

let studentsData = [];

/* ===========================================================
   CACHE
   =========================================================== */

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

/* ===========================================================
   DATE HELPERS
   =========================================================== */

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/* ===========================================================
   GITHUB ACTIVITY
   =========================================================== */

async function getActivity(folder) {
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=50`;
    const res = await fetch(url);

    if (!res.ok) {
      const fallback = {
        days: null,
        commitCount: 0,
        activeYears: 0,
        activeWeeks: 0,
        lastCommitDate: null,
      };
      setCache(cacheKey, fallback);
      return fallback;
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    const lastCommitDate = commits[0]?.commit?.author?.date || null;
    const commitCount = commits.length;

    let days = null;
    if (lastCommitDate) {
      days = Math.floor((new Date() - new Date(lastCommitDate)) / (1000 * 60 * 60 * 24));
    }

    const yearsSet = new Set();
    const weeksSet = new Set();

    commits.forEach((c) => {
      const d = new Date(c?.commit?.author?.date);
      if (!isNaN(d)) {
        yearsSet.add(d.getFullYear());
        weeksSet.add(`${d.getFullYear()}-W${getWeekNumber(d)}`);
      }
    });

    const result = {
      days,
      commitCount,
      activeYears: yearsSet.size,
      activeWeeks: weeksSet.size,
      lastCommitDate,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return {
      days: null,
      commitCount: 0,
      activeYears: 0,
      activeWeeks: 0,
      lastCommitDate: null,
    };
  }
}

/* ===========================================================
   STUDENTS
   =========================================================== */

async function loadStudents() {
  try {
    const res = await fetch("./students.json");
    const data = await res.json();
    studentsData = data.students || [];
  } catch {
    studentsData = [];
  }
}

/* ===========================================================
   MEMBERSHIP (FIXED LOGIC)
   =========================================================== */

function getMembership(activity, student) {
  const commits = activity.commitCount || 0;
  const years = activity.activeYears || 0;

  const hasAccess = student?.githubUsername && student.githubUsername !== "";
  const isGrad = student?.isAlumni === true;

  // Not accepted invite yet
  if (!hasAccess) return "Archive";

  // Accepted but no activity
  if (commits === 0) return "Newcomer";

  // First participation cycle
  if (years <= 1 && commits <= 5) return "Contributor";

  // Returning after first cycle or sustained activity
  if (years === 1 && commits > 5) return "Regular";

  // Multi-year participation OR alumni returning
  if (years >= 2 || isGrad) return "Veteran";

  return "Contributor";
}

/* ===========================================================
   LIFETIME SCORE (STARS 1–5, NEVER DECREASE)
   =========================================================== */

function getLifetimeStars(activity, student) {
  const commits = activity.commitCount || 0;
  const years = activity.activeYears || 0;
  const hasAccess = student?.githubUsername && student.githubUsername !== "";

  // Not accepted invite
  if (!hasAccess) return 0;

  // Accepted but no work yet
  if (commits <= 1) return 1;

  // First real participation
  if (commits <= 5 && years <= 1) return 1;

  // Multiple pushes in first summer
  if (years === 1 && commits > 5) return 2;

  // Second summer returner
  if (years === 2) return 3;

  // Third summer returner
  if (years === 3) return 4;

  // Long-term / veteran system member
  if (years >= 4) return 5;

  return 1;
}

/* ===========================================================
   RENDER HELPERS
   =========================================================== */

function createBadge(className, text = "", title = "") {
  const li = document.createElement("li");
  li.className = `badge ${className}`;
  if (text) li.textContent = text;
  if (title) li.title = title;
  return li;
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/* ===========================================================
   MAIN RENDER
   =========================================================== */

async function populateStudentData() {
  await loadStudents();
  const studentMap = new Map(studentsData.map((s) => [s.id, s]));
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();

    const student = studentMap.get(folder);
    const activity = await getActivity(folder);

    const badges = link.querySelector(".student-badges");
    if (!badges) continue;

    badges.innerHTML = "";

    /* LAST SEEN */
    const lastSeen = activity.days !== null ? `${activity.days} days ago` : "No activity";

    badges.appendChild(createBadge("badge-last-seen", `Last seen: ${lastSeen}`));

    /* MEMBERSHIP */
    const membership = getMembership(activity, student);
    badges.appendChild(createBadge("badge-membership", `Membership: ${membership}`));

    /* LIFETIME SCORE */
    const starCount = getLifetimeStars(activity, student);
    badges.appendChild(createBadge("badge-stars", `Lifetime Score: ${stars(starCount)}`));
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
