// summer-mentorship.js
// Web Ring Badge System — Composable membership labels

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
   MEMBERSHIP LABEL (COMPOSABLE)
========================= */

function getMembershipLabel(student) {
  // Withdrawn students
  if (student?.withdrawn) {
    return "Archived Member";
  }

  // Alumni
  if (student?.isAlumni) {
    if (student?.isMentor) return "Alumni Mentor";
    if (student?.isReturning && student?.isActive) return "Active Returning Alumni";
    if (student?.isReturning) return "Returning Alumni";
    if (student?.isActive) return "Active Alumni";
    return "Alumni";
  }

  // Current students
  if (student?.isReturning && student?.isActive) return "Active Returning Student";
  if (student?.isReturning) return "Returning Student";
  if (student?.isActive) return "Active Student";

  return "New Student";
}

/* =========================
   MEMBERSHIP (WITH COMPOSABLE FIELDS)
========================= */

function getMembership(activity, student) {
  // Use explicit membership label if available
  if (student?.membershipLabel) {
    return student.membershipLabel;
  }

  // Generate from composable fields
  if (student?.isAlumni !== undefined || student?.isReturning !== undefined || student?.isActive !== undefined) {
    return getMembershipLabel(student);
  }

  // Fallback to Git-based inference (for students without any metadata)
  const commits = activity.commitCount;
  const commitDates = activity.commitDates || [];

  if (commits === 0) return "New Student";
  if (commits === 1) return "New Student";
  if (commitDates.length < 2) return "Contributor";

  const sorted = [...commitDates].sort((a, b) => a - b);
  const firstDate = sorted[0];
  const lastDate = sorted[sorted.length - 1];
  const activeDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
  const lastSeenDays = daysSince(lastDate);

  if (lastSeenDays !== null && lastSeenDays > 365 && commits > 0) {
    return "Archived Member";
  }

  if (commits >= 30 && activeDays >= 60) return "Veteran Contributor";
  if (commits >= 10 && activeDays >= 30) return "Regular Contributor";

  return "Contributor";
}

/* =========================
   LIFETIME SCORE (SUSTAINED ENGAGEMENT)
========================= */

function getLifetimeScore(activity) {
  const commits = activity.commitCount;
  const dates = activity.commitDates || [];

  if (commits === 0) return 0;
  if (dates.length < 2) return 1;

  const validDates = dates.filter((d) => d && d instanceof Date && !isNaN(d.getTime()));

  if (validDates.length < 2) return 1;

  const sorted = [...validDates].sort((a, b) => a - b);
  const firstCommit = sorted[0];
  const lastCommit = sorted[sorted.length - 1];

  const spanDays = Math.ceil((lastCommit - firstCommit) / (1000 * 60 * 60 * 24));

  const activeWeeks = new Set();
  validDates.forEach((d) => {
    if (d instanceof Date) {
      const year = d.getFullYear();
      const weekNum = getWeekNumber(d);
      activeWeeks.add(`${year}-W${weekNum}`);
    }
  });

  const weeksActive = activeWeeks.size;

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
    const membership = getMembership(activity, student);
    const lifetime = getLifetimeScore(activity);

    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    container.appendChild(createBadge("badge-lastseen", lastSeenDays === null ? "Last seen: No activity" : `Last seen: ${lastSeenDays} days ago`));

    container.appendChild(createBadge("badge-membership", `Membership: ${membership}`));

    container.appendChild(createBadge("badge-lifetime", `Lifetime Score: ${stars(lifetime)}`));

    const returnGlow = lastSeenDays !== null && lastSeenDays > 365 && activity.commitCount > 0;

    link.classList.toggle("return-glow", returnGlow);
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
