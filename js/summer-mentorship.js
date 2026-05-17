// summer-mentorship.js
// Web Ring Badge System — Hybrid: API first, JSON fallback
// Only counts commits made by the student's own GitHub username

// ============================================================
// CONFIGURATION
// ============================================================

// GitHub repository settings
const REPO_OWNER = "jamesdneufeld";
const REPO_NAME = "ideawebring";

// Cache settings
const CACHE_TTL_HOURS = 12; // How long to cache GitHub data (hours)
const PER_PAGE_COMMITS = 100; // Number of commits to fetch per API call

// UI thresholds
const RETURN_GLOW_DAYS = 365; // Days after which a returning student gets the glow effect

// Lookup tables for human-readable labels
const PURPOSE_LABELS = {
  practice: "Here for More Practice",
  portfolio: "Portfolio Building",
  indie_web: "Indie Web Explorer",
  career_prep: "Career Prep",
  returning_practice: "Returning for Practice",
  learning_html_css: "Learning HTML & CSS",
};

const FOCUS_AREA_LABELS = {
  layout_foundations: "Layout Foundations",
  responsive_design: "Responsive Design",
  debugging_tools: "Debugging Tools",
  flexbox_layouts: "Flexbox Layouts",
  box_model: "The Box Model",
  media_queries: "Media Queries",
};

// ============================================================
// END CONFIGURATION
// ============================================================

let studentsData = [];

/* =========================
   CACHE HELPERS
========================= */

function getCache(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp < CACHE_TTL_HOURS * 60 * 60 * 1000) {
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
    isFromAPI: false,
  };
}

/* =========================
   GET STORED ACTIVITY FROM JSON (FALLBACK)
========================= */

function getStoredActivity(student) {
  if (student?.latestPushDate) {
    const lastSeenDays = daysSince(student.latestPushDate);
    return {
      lastDate: student.latestPushDate,
      lastSeenDays: lastSeenDays,
      commitCount: student.totalPushes || 0,
      isFromAPI: false,
    };
  }
  return null;
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
   GITHUB ACTIVITY (WITH AUTHOR FILTERING)
========================= */

async function getActivityFromAPI(folder, student) {
  const allIds = [folder, ...(student?.formerIds || [])].filter(Boolean);
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // If no GitHub username, skip API call (can't filter by author)
  if (!student?.githubUsername || student.githubUsername.trim() === "") {
    return null;
  }

  try {
    const allCommits = [];

    for (const id of allIds) {
      // IMPORTANT: Filter by author to only count the student's own commits
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${id}&author=${student.githubUsername}&per_page=${PER_PAGE_COMMITS}`;
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
      isFromAPI: true,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`GitHub fetch failed for ${folder}:`, err);
    return null;
  }
}

/* =========================
   GET ACTIVITY (HYBRID: API FIRST, FALLBACK TO STORED)
========================= */

async function getActivity(folder, student) {
  // Try API first (only if student has GitHub username)
  const apiActivity = await getActivityFromAPI(folder, student);

  // If API returned valid data, use it
  if (apiActivity && apiActivity.lastDate) {
    return apiActivity;
  }

  // If API failed or returned no data, fall back to stored data from students.json
  const storedActivity = getStoredActivity(student);
  if (storedActivity) {
    return storedActivity;
  }

  // If all fails, return empty
  return makeEmptyActivity();
}

/* =========================
   TIME HELPERS
========================= */

function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function getLastActiveLabel(days) {
  if (days === null) return "No activity";
  if (days === 0) return "Active today";
  if (days === 1) return "Active yesterday";
  if (days < 7) return `Active this week (${days} days ago)`;
  if (days < 14) return "Active within 2 weeks";
  if (days < 30) return "Active this month";
  if (days < 60) return "Active last month";
  if (days < 90) return "Active 2 months ago";
  if (days < 180) return "Active 3+ months ago";
  if (days < 365) return "Active 6+ months ago";
  return "Active over a year ago";
}

/* =========================
   MEMBERSHIP LABEL (COMPOSABLE)
========================= */

function getIdentityLabel(student) {
  if (student?.status === "alumni" && student?.returning) return "Returning Alumni";
  if (student?.status === "alumni") return "Alumni";
  if (student?.returning) return "Returning Student";
  return "New Student";
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
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

    // Get activity (API first with author filtering, fallback to stored)
    const activity = await getActivity(folder, student);

    // Use API data if available, otherwise stored
    let lastSeenDays = null;
    let totalPushes = 0;

    if (activity?.isFromAPI || activity?.lastDate) {
      lastSeenDays = daysSince(activity.lastDate);
      totalPushes = activity.commitCount || 0;
    } else if (activity?.lastSeenDays !== undefined) {
      lastSeenDays = activity.lastSeenDays;
      totalPushes = activity.commitCount || 0;
    }

    const joinedDate = formatDate(student?.joinedWebRing);
    const identityLabel = getIdentityLabel(student);

    const purpose = student?.purpose ? PURPOSE_LABELS[student.purpose] || student.purpose : null;
    const focusArea = student?.focusArea ? FOCUS_AREA_LABELS[student.focusArea] || student.focusArea : null;

    const lastActiveLabel = getLastActiveLabel(lastSeenDays);

    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    // Identity badge
    container.appendChild(createBadge("badge-identity", identityLabel));

    // Purpose (why they joined)
    if (purpose) {
      container.appendChild(createBadge("badge-purpose", purpose));
    }

    // Focus area (what they're working on)
    if (focusArea) {
      container.appendChild(createBadge("badge-focus", focusArea));
    }

    // Joined Web Ring
    if (joinedDate) {
      container.appendChild(createBadge("badge-joined", `Joined Web Ring: ${joinedDate}`));
    }

    // Activity (Last Active + Contributions)
    let activityText = lastActiveLabel;
    if (totalPushes > 0) {
      activityText += ` · ${totalPushes} contribution${totalPushes !== 1 ? "s" : ""}`;
    }
    container.appendChild(createBadge("badge-activity", activityText));

    // Return glow
    const returnGlow = lastSeenDays !== null && lastSeenDays > RETURN_GLOW_DAYS && totalPushes > 0;
    link.classList.toggle("return-glow", returnGlow);
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
