// summer-mentorship.js
// Web Ring Badge System — Two-axis deterministic membership with formerIds support

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
   FALLBACK
========================= */

function makeEmptyActivity() {
  return {
    lastDate: null,
    commitCount: 0,
    commitDates: [],
  };
}

/* =========================
   ISO WEEK HELPER
========================= */

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/* =========================
   GITHUB ACTIVITY (WITH FORMERIDS SUPPORT)
========================= */

async function getActivity(folder, formerIds = []) {
  const allIds = [folder, ...formerIds].filter(Boolean);
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const allCommits = [];

    for (const id of allIds) {
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${id}&per_page=100`;
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          allCommits.push(...data);
        }
      }
    }

    if (allCommits.length === 0) {
      const empty = makeEmptyActivity();
      setCache(cacheKey, empty);
      return empty;
    }

    const uniqueCommits = new Map();
    for (const commit of allCommits) {
      if (commit?.sha && !uniqueCommits.has(commit.sha)) {
        uniqueCommits.set(commit.sha, commit);
      }
    }

    const commits = Array.from(uniqueCommits.values());

    const commitDates = commits
      .map((c) => c?.commit?.author?.date)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => b - a);

    if (commitDates.length === 0) {
      const empty = makeEmptyActivity();
      setCache(cacheKey, empty);
      return empty;
    }

    const result = {
      lastDate: commitDates[0].toISOString(),
      commitCount: commits.length,
      commitDates,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`GitHub fetch failed for ${folder}:`, err);
    const empty = makeEmptyActivity();
    setCache(cacheKey, empty);
    return empty;
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
   MEMBERSHIP (TWO-AXIS + ARCHIVE STATE)
========================= */

function getMembership(activity) {
  const commits = activity.commitCount;
  const commitDates = activity.commitDates || [];

  if (commits === 0) return "Newcomer";
  if (commits === 1) return "Newcomer";

  if (commitDates.length < 2) return "Contributor";

  const sorted = [...commitDates].sort((a, b) => a - b);

  const firstDate = sorted[0];
  const lastDate = sorted[sorted.length - 1];

  const activeDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));

  const lastSeenDays = daysSince(lastDate);

  // 1. ARCHIVE override (inactive for long time)
  if (lastSeenDays !== null && lastSeenDays > 365 && commits > 0) {
    return "Archive";
  }

  // 2. Veteran (multi-cycle participation signal)
  if (commits >= 30 && activeDays >= 60) {
    return "Veteran";
  }

  // 3. Regular
  if (commits >= 10 && activeDays >= 30) {
    return "Regular";
  }

  // 4. Default active participant
  return "Contributor";
}

/* =========================
   LIFETIME SCORE (SUSTAINED ENGAGEMENT, NOT RAW COMMITS)
========================= */

function getLifetimeScore(activity) {
  const commits = activity.commitCount;
  const dates = activity.commitDates || [];

  if (commits === 0) return 0;

  if (dates.length < 2) return 1;

  // Filter out invalid dates first
  const validDates = dates.filter((d) => d && !isNaN(d.getTime()));

  if (validDates.length < 2) return 1;

  const sorted = [...validDates].sort((a, b) => a - b);
  const firstCommit = sorted[0];
  const lastCommit = sorted[sorted.length - 1];

  const spanDays = Math.ceil((lastCommit - firstCommit) / (1000 * 60 * 60 * 24));

  // Use ISO week numbers with safety check
  const activeWeeks = new Set();
  validDates.forEach((d) => {
    const year = d.getFullYear();
    const weekNum = getWeekNumber(d);
    activeWeeks.add(`${year}-W${weekNum}`);
  });

  const weeksActive = activeWeeks.size;

  // SUSTAINED ENGAGEMENT MODEL (not raw commit count)

  if (spanDays === 0) return 1;
  if (spanDays < 7) return 1;

  if (spanDays < 30) {
    if (weeksActive >= 2) return 3;
    return 2;
  }

  if (spanDays < 90) {
    if (weeksActive >= 6) return 4;
    return 3;
  }

  if (spanDays >= 90) {
    if (weeksActive >= 12) return 5;
    if (weeksActive >= 8) return 4;
    return 4;
  }

  return 3;
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
   RENDER
========================= */

async function populateStudentData() {
  await loadStudents();

  const studentMap = new Map(studentsData.map((s) => [s.id, s]));
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();

    const student = studentMap.get(folder);
    const activity = await getActivity(folder, student?.formerIds || []);

    const lastSeenDays = daysSince(activity.lastDate);
    const membership = getMembership(activity);
    const lifetime = getLifetimeScore(activity);

    // Program / Year
    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    /* LAST SEEN */
    container.appendChild(createBadge("badge-lastseen", lastSeenDays === null ? "Last seen: No activity" : `Last seen: ${lastSeenDays} days ago`));

    /* MEMBERSHIP */
    container.appendChild(createBadge("badge-membership", `Membership: ${membership}`));

    /* LIFETIME SCORE */
    container.appendChild(createBadge("badge-lifetime", `Lifetime Score: ${stars(lifetime)}`));

    /* RETURN GLOW */
    const returnGlow = lastSeenDays !== null && lastSeenDays > 365 && activity.commitCount > 0;

    link.classList.toggle("return-glow", returnGlow);
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
