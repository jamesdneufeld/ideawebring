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
  learning_basics: "Learning HTML & CSS",
  learning_foundations: "Building Core Concepts",
  learning_responsive: "Exploring Responsive Design",
  practice_build: "Building Projects",
  practice_refine: "Refining Skills",
  explorer: "Confident with DevTools",
  indie_web: "Indie Web Explorer",
  portfolio: "Portfolio Building",
  career_prep: "Career Prep",
  coursework: "Required Coursework",
};

const LEARNING_STAGE_LABELS = {
  early: "Early Stage",
  developing: "Developing",
  advanced: "Advanced",
};

const FOCUS_AREA_LABELS = {
  layout_foundations: "Layout Foundations",
  responsive_design: "Responsive Design",
  flexbox_layouts: "Flexbox Layouts",
  flexbox_confident: "Confident with Flexbox",
  css_grid: "CSS Grid",
  positioning: "CSS Positioning",
  flexbox: "Flexbox",
  box_model: "The Box Model",
  media_queries: "Media Queries",
  semantic_html: "Semantic HTML",
  accessibility: "Accessibility",
  debugging_tools: "Debugging Tools",
  inspector: "Browser Inspector",
  dev_tools: "Developer Tools",
  color_theory: "Color Theory",
  typography: "Typography",
  animations: "CSS Animations",
  transitions: "CSS Transitions",
  box_model_unclear: "Learning the Box Model",
  media_queries_confusing: "Exploring Media Queries",
  new_to_html: "New to HTML & CSS",
  inspector_user: "Uses Browser Inspector",
  layout: "Layout Design",
  responsive: "Responsive Design",
  debugging: "Debugging Techniques",
};

const TOOL_LABELS = {
  inspector: "Chrome Inspector",
  figma: "Figma",
  codepen: "CodePen",
  github: "GitHub",
  vs_code: "VS Code",
  vscode: "VS Code",
  git: "Git",
  terminal: "Terminal/Command Line",
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
    firstDate: null,
    commitCount: 0,
    commitDates: [],
    isFromAPI: false,
  };
}

/* =========================
   GET STORED ACTIVITY FROM JSON (FALLBACK)
========================= */

function getStoredActivity(student) {
  if (student?.lastCommitDate) {
    const lastSeenDays = daysSince(student.lastCommitDate);
    return {
      lastDate: student.lastCommitDate,
      firstDate: student.firstCommitDate,
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

  if (!student?.githubUsername || student.githubUsername.trim() === "") {
    return null;
  }

  try {
    const allCommits = [];

    for (const id of allIds) {
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
      firstDate: commitDates[commitDates.length - 1].toISOString(),
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
  const apiActivity = await getActivityFromAPI(folder, student);

  if (apiActivity && apiActivity.lastDate) {
    return apiActivity;
  }

  const storedActivity = getStoredActivity(student);
  if (storedActivity) {
    return storedActivity;
  }

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
  if (days === 0) return "Last active: Today";
  if (days === 1) return "Last active: Yesterday";
  return `Last active: ${days} days ago`;
}

function formatDateMonthYear(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

/* =========================
   IDENTITY LABEL
========================= */

function getIdentityLabel(student) {
  if (student?.status === "alumni") {
    if (student?.entryType === "returning") return "Returning Alumni";
    return "Alumni";
  }
  if (student?.entryType === "returning") return "Returning Participant";
  if (student?.entryType === "coursework") return "Coursework Participant";
  if (student?.entryType === "past") return "Past Participant";
  return "New to Web Ring";
}

/* =========================
   HELPER: GET HUMAN-READABLE LABEL
========================= */

function getHumanLabel(value, labelMap) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const mapped = value.map((item) => labelMap[item] || item);
    return mapped.filter(Boolean);
  }
  return labelMap[value] || value;
}

/* =========================
   CREATE BADGE WITH LABEL + VALUE
========================= */

function createBadge(className, label, value, title = "") {
  const li = document.createElement("li");
  li.className = `badge ${className}`;

  const labelSpan = document.createElement("span");
  labelSpan.className = "label";
  labelSpan.textContent = label + ": ";

  const valueSpan = document.createElement("span");
  valueSpan.className = "value";
  valueSpan.textContent = value || "—";

  li.appendChild(labelSpan);
  li.appendChild(valueSpan);

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

    const activity = await getActivity(folder, student);

    let lastSeenDays = null;
    let totalPushes = 0;
    let firstCommitDate = student?.firstCommitDate;

    if (activity?.isFromAPI || activity?.lastDate) {
      lastSeenDays = daysSince(activity.lastDate);
      totalPushes = activity.commitCount || 0;
      if (activity.firstDate && !firstCommitDate) {
        firstCommitDate = activity.firstDate;
      }
    } else if (activity?.lastSeenDays !== undefined) {
      lastSeenDays = activity.lastSeenDays;
      totalPushes = activity.commitCount || 0;
    }

    const joinedDate = formatDateMonthYear(student?.joinedWebRing);
    const firstCommitFormatted = formatDateMonthYear(firstCommitDate);
    const identityLabel = getIdentityLabel(student);
    const cohort = student?.cohort || "Summer 2026";

    const purpose = getHumanLabel(student?.purpose, PURPOSE_LABELS);
    const focusAreas = getHumanLabel(student?.focusAreas, FOCUS_AREA_LABELS);
    const tools = getHumanLabel(student?.tools, TOOL_LABELS);

    const lastActiveLabel = getLastActiveLabel(lastSeenDays);

    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    // Row 1: Status | Cohort
    container.appendChild(createBadge("status", "Status", identityLabel));
    container.appendChild(createBadge("cohort", "Cohort", cohort));

    // Row 2: Goal | Focus
    container.appendChild(createBadge("goal", "Goal", purpose || "—"));
    container.appendChild(createBadge("focus", "Focus", focusAreas ? focusAreas.join(" · ") : "—"));

    // Row 3: Joined Web Ring | First Push
    container.appendChild(createBadge("joined", "Joined Web Ring", joinedDate || "—"));
    container.appendChild(createBadge("first-push", "First Push", firstCommitFormatted || "—"));

    // Row 4: Last Active | Total Pushes
    container.appendChild(createBadge("last-active", "Last Active", lastActiveLabel));
    container.appendChild(createBadge("total-pushes", "Total Pushes", totalPushes.toString()));

    // Return glow
    const returnGlow = lastSeenDays !== null && lastSeenDays > RETURN_GLOW_DAYS && totalPushes > 0;
    link.classList.toggle("return-glow", returnGlow);
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
