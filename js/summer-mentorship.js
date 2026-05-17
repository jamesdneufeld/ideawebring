// summer-mentorship.js
// Web Ring Badge System - Deterministic Membership Model

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
        commitCount: 0,
        lastSeenDays: null,
        firstSeenYear: null,
        yearsActive: 0,
      };
      setCache(cacheKey, fallback);
      return fallback;
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    const commitCount = commits.length;

    const dates = commits.map((c) => new Date(c?.commit?.author?.date)).filter((d) => !isNaN(d));

    let lastSeenDays = null;

    if (dates.length) {
      const last = dates[0];
      lastSeenDays = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
    }

    // deterministic: years active from commit timestamps
    const years = new Set();
    for (const d of dates) {
      years.add(d.getFullYear());
    }

    const result = {
      commitCount,
      lastSeenDays,
      yearsActive: years.size,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return {
      commitCount: 0,
      lastSeenDays: null,
      yearsActive: 0,
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
   MEMBERSHIP (DETERMINISTIC RULES)
   =========================================================== */
function getMembership(activity, student) {
  const commits = activity.commitCount || 0;
  const years = activity.yearsActive || 0;
  const invitedButNoAccess = commits === 0 && !student?.githubUsername;

  // 1. not yet in system
  if (invitedButNoAccess) return "Archive";

  // 2. never contributed
  if (commits === 0) return "Newcomer";

  // 3. first summer
  if (years === 1) {
    if (commits < 3) return "Contributor";
    return "Regular";
  }

  // 4. returning students
  if (years === 2) return "Regular";
  if (years >= 3) return "Veteran";

  return "Contributor";
}

/* ===========================================================
   LIFETIME SCORE (STARS - STABLE)
   =========================================================== */
function getLifetimeStars(activity, student) {
  const commits = activity.commitCount || 0;
  const years = activity.yearsActive || 0;

  if (commits === 0) return 0;
  if (commits < 2) return 1;
  if (years === 1) return 2;
  if (years === 2) return 3;
  if (years === 3) return 4;
  if (years >= 4) return 5;

  return 1;
}

function renderStars(n) {
  return "★★★★★"
    .split("")
    .map((_, i) => (i < n ? "★" : "☆"))
    .join("");
}

/* ===========================================================
   BADGE CREATION
   =========================================================== */
function createBadge(className, text = "", title = "") {
  const li = document.createElement("li");
  li.className = `badge ${className}`;
  if (text) li.textContent = text;
  if (title) li.title = title;
  return li;
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

    /* =======================================================
       LAST SEEN (ONLY METRIC, NO STATUS LOGIC)
    ======================================================= */
    const lastSeen = activity.lastSeenDays != null ? `Last seen: ${activity.lastSeenDays} days ago` : "Last seen: no activity";

    badges.appendChild(createBadge("badge-lastseen", lastSeen));

    /* =======================================================
       MEMBERSHIP (DETERMINISTIC)
    ======================================================= */
    const membership = getMembership(activity, student);

    badges.appendChild(createBadge("badge-membership", `Membership: ${membership}`));

    /* =======================================================
       LIFETIME SCORE (STARS)
    ======================================================= */
    const stars = getLifetimeStars(activity, student);

    badges.appendChild(createBadge("badge-lifetime", `Lifetime Score: ${renderStars(stars)}`));
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
