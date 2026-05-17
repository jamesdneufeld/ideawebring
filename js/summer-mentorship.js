// summer-mentorship.js
// Deterministic Membership + Lifetime System (stable model)

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
  localStorage.setItem(
    key,
    JSON.stringify({
      value,
      timestamp: Date.now(),
    }),
  );
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
      return makeEmptyActivity();
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    if (!commits.length) {
      const empty = makeEmptyActivity();
      setCache(cacheKey, empty);
      return empty;
    }

    const lastDate = commits[0]?.commit?.author?.date || null;

    const commitDates = commits.map((c) => new Date(c?.commit?.author?.date)).filter((d) => !isNaN(d));

    const commitCount = commits.length;

    const result = {
      lastDate,
      commitCount,
      commitDates,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return makeEmptyActivity();
  }
}

function makeEmptyActivity() {
  return {
    lastDate: null,
    commitCount: 0,
    commitDates: [],
  };
}

/* =========================
   CORE DERIVED VALUES
========================= */

function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

/* =========================
   MEMBERSHIP (DETERMINISTIC)
========================= */

function getMembership(student, activity) {
  const commits = activity.commitCount;
  const hasGithub = commits > 0;

  // 1. Not yet active (invited / no commits)
  if (!hasGithub) {
    if (student?.githubUsername) return "Newcomer";
    return "Archive";
  }

  // 2. First contribution
  if (commits === 1) return "Newcomer";

  // 3. Regular activity
  if (commits >= 2 && commits < 10) return "Contributor";

  // 4. Active recurring participant
  if (commits >= 10 && commits < 30) return "Regular";

  // 5. Veteran threshold (graduated or long-term return)
  if (commits >= 30) return "Veteran";

  return "Contributor";
}

/* =========================
   LIFETIME SCORE (5★)
   NEVER DECREASES
========================= */

function getLifetimeScore(activity) {
  const commits = activity.commitCount;

  if (commits === 0) return 0;
  if (commits === 1) return 1;
  if (commits >= 2 && commits < 10) return 2;
  if (commits >= 10 && commits < 25) return 3;
  if (commits >= 25 && commits < 50) return 4;
  return 5;
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/* =========================
   UI RENDER HELPERS
========================= */

function createBadge(className, text = "", title = "") {
  const li = document.createElement("li");
  li.className = `badge ${className}`;
  if (text) li.textContent = text;
  if (title) li.title = title;
  return li;
}

/* =========================
   MAIN RENDER LOOP
========================= */

async function populateStudentData() {
  await loadStudents();

  const studentMap = new Map(studentsData.map((s) => [s.id, s]));
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();

    const student = studentMap.get(folder);
    const activity = await getActivity(folder);

    const lastSeenDays = daysSince(activity.lastDate);
    const membership = getMembership(student || {}, activity);
    const lifetime = getLifetimeScore(activity);

    // Update program and year
    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");
    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    // Last Seen
    const lastSeenText = lastSeenDays === null ? "Last seen: No activity" : `Last seen: ${lastSeenDays} days ago`;

    container.appendChild(createBadge("badge-lastseen", lastSeenText));

    // Membership
    container.appendChild(createBadge("badge-membership", `Membership: ${membership}`));

    // Lifetime Score
    container.appendChild(createBadge("badge-lifetime", `Lifetime Score: ${stars(lifetime)}`));

    // Return glow (optional CSS hook)
    if (lastSeenDays !== null && lastSeenDays > 365 && activity.commitCount > 0) {
      link.classList.add("return-glow");
    } else {
      link.classList.remove("return-glow");
    }
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
