// summer-mentorship.js
// Deterministic Membership + Lifetime System (stable + corrected)

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
      return data.value; // 🔥 FIXED (was missing in Deepseek version)
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
   TIME HELPERS
========================= */

function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

/* =========================
   MEMBERSHIP (FIXED LOGIC)
========================= */

function getMembership(activity) {
  const commits = activity.commitCount;
  const days = daysSince(activity.lastDate);

  // ❗ no commits = never actually joined GitHub activity
  if (commits === 0) return "Newcomer";

  // first contribution
  if (commits === 1) return "Newcomer";

  // small participation
  if (commits >= 2 && commits < 10) return "Contributor";

  // steady participation
  if (commits >= 10 && commits < 30) return "Regular";

  // long-term / returning / alumni
  if (commits >= 30) return "Veteran";

  return "Contributor";
}

/* =========================
   LIFETIME SCORE (STABLE 1–5★)
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
   RENDER
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

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    /* Last Seen */
    const lastSeenText = lastSeenDays === null ? "Last seen: No activity" : `Last seen: ${lastSeenDays} days ago`;

    container.appendChild(createBadge("badge-lastseen", lastSeenText));

    /* Membership */
    container.appendChild(createBadge("badge-membership", `Membership: ${membership}`));

    /* Lifetime Score */
    container.appendChild(createBadge("badge-lifetime", `Lifetime Score: ${stars(lifetime)}`));

    /* Return Glow (deterministic rule) */
    if (lastSeenDays !== null && lastSeenDays > 365 && activity.commitCount > 0) {
      link.classList.add("return-glow");
    } else {
      link.classList.remove("return-glow");
    }
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
