// summer-mentorship.js
// Web Ring Badge System — production-safe + reliable GitHub parsing

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
    if (Date.now() - data.timestamp < 60 * 60 * 1000) {
      return data.value;
    }
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
   EMPTY FALLBACK
========================= */

function makeEmptyActivity() {
  return {
    lastDate: null,
    commitCount: 0,
    commitDates: [],
  };
}

/* =========================
   GITHUB ACTIVITY (FIXED)
   - NO path filtering dependency
   - derives folder ownership locally
========================= */

async function getActivity(folder) {
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    // IMPORTANT FIX:
    // fetch global commits instead of path-filtered commits
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=100`;
    const res = await fetch(url);

    if (!res.ok) return makeEmptyActivity();

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    if (!commits.length) {
      const empty = makeEmptyActivity();
      setCache(cacheKey, empty);
      return empty;
    }

    // FILTER commits by folder name appearing in changed files
    const filtered = commits.filter((commit) => {
      const files = commit?.files || [];
      return files.some((f) => f?.filename?.includes(folder));
    });

    if (!filtered.length) return makeEmptyActivity();

    const commitDates = filtered.map((c) => new Date(c?.commit?.author?.date)).filter((d) => !isNaN(d));

    if (!commitDates.length) return makeEmptyActivity();

    const lastDate = new Date(Math.max(...commitDates));

    const result = {
      lastDate: lastDate.toISOString(),
      commitCount: filtered.length,
      commitDates,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return makeEmptyActivity();
  }
}

/* =========================
   TIME HELPERS
========================= */

function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

/* =========================
   MEMBERSHIP (DETERMINISTIC)
========================= */

function getMembership(activity) {
  const commits = activity.commitCount;

  if (commits === 0) return "Newcomer";
  if (commits === 1) return "Newcomer";
  if (commits >= 2 && commits < 10) return "Contributor";
  if (commits >= 10 && commits < 30) return "Regular";
  return "Veteran";
}

/* =========================
   LIFETIME SCORE (STABLE)
========================= */

function getLifetimeScore(activity) {
  const c = activity.commitCount;

  if (c === 0) return 0;
  if (c === 1) return 1;
  if (c < 10) return 2;
  if (c < 25) return 3;
  if (c < 50) return 4;
  return 5;
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/* =========================
   UI
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
    const membership = getMembership(activity);
    const lifetime = getLifetimeScore(activity);

    // Program / Year (unchanged)
    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    /* =========================
       LAST SEEN
    ========================= */

    container.appendChild(createBadge("badge-lastseen", lastSeenDays === null ? "Last seen: No activity" : `Last seen: ${lastSeenDays} days ago`));

    /* =========================
       MEMBERSHIP
    ========================= */

    container.appendChild(createBadge("badge-membership", `Membership: ${membership}`));

    /* =========================
       LIFETIME SCORE
    ========================= */

    container.appendChild(createBadge("badge-lifetime", `Lifetime Score: ${stars(lifetime)}`));

    /* =========================
       RETURN GLOW (alumni return)
    ========================= */

    const returnGlow = lastSeenDays !== null && lastSeenDays > 365 && activity.commitCount > 0;

    link.classList.toggle("return-glow", returnGlow);
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
