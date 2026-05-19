// summer-mentorship.js
// Web Ring Badge System — Hybrid: API first, JSON fallback

// ============================================================
// CONFIGURATION
// ============================================================

const REPO_OWNER = "jamesdneufeld";
const REPO_NAME = "ideawebring";

const CACHE_TTL_HOURS = 12;
const PER_PAGE_COMMITS = 100;
const RETURN_GLOW_DAYS = 365;

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

const FOCUS_AREA_LABELS = {
  box_model: "The Box Model",
  media_queries: "Media Queries",
  flexbox: "Flexbox",
  flexbox_layouts: "Flexbox Layouts",
  flexbox_confident: "Confident with Flexbox",
  layout_foundations: "Layout Foundations",
  responsive_design: "Responsive Design",
  debugging_tools: "Debugging Tools",
  inspector: "Browser Inspector",
};

const TOOL_LABELS = {
  inspector: "Chrome Inspector",
  github: "GitHub",
  vs_code: "VS Code",
  codepen: "CodePen",
};

// ============================================================
// END CONFIGURATION
// ============================================================

let studentsData = [];

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
  localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
}

async function loadStudents() {
  try {
    const res = await fetch("./students.json");
    const data = await res.json();
    studentsData = data.students || [];
  } catch {
    studentsData = [];
  }
}

function makeEmptyActivity() {
  return { lastDate: null, firstDate: null, commitCount: 0, commitDates: [], isFromAPI: false };
}

function getStoredActivity(student) {
  if (student?.lastCommitDate) {
    return {
      lastDate: student.lastCommitDate,
      firstDate: student.firstCommitDate,
      commitCount: student.totalPushes || 0,
      isFromAPI: false,
    };
  }
  return null;
}

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
        if (Array.isArray(data)) allCommits.push(...data);
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

async function getActivity(folder, student) {
  const apiActivity = await getActivityFromAPI(folder, student);
  if (apiActivity && apiActivity.lastDate) return apiActivity;
  const storedActivity = getStoredActivity(student);
  if (storedActivity) return storedActivity;
  return makeEmptyActivity();
}

function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function getLastActiveLabel(days) {
  if (days === null) return "No activity";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function formatDateMonthYear(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

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

function getHumanLabel(value, labelMap) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const mapped = value.map((item) => labelMap[item] || item);
    return mapped.filter(Boolean);
  }
  return labelMap[value] || value;
}

function createGridItem(label, value, className = "") {
  const div = document.createElement("div");
  div.className = `grid-item ${className}`;

  const labelSpan = document.createElement("span");
  labelSpan.className = "grid-label";
  labelSpan.textContent = label;

  const valueSpan = document.createElement("span");
  valueSpan.className = "grid-value";
  valueSpan.textContent = value || "—";

  div.appendChild(labelSpan);
  div.appendChild(valueSpan);

  return div;
}

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

    const purpose = getHumanLabel(student?.purpose, PURPOSE_LABELS) || "—";
    const focusAreas = getHumanLabel(student?.focusAreas, FOCUS_AREA_LABELS);
    const focusText = focusAreas ? focusAreas.join(" · ") : "—";

    const lastActiveLabel = getLastActiveLabel(lastSeenDays);

    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");

    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    const container = link.querySelector(".student-badges");
    if (!container) continue;

    container.innerHTML = "";

    // 8 grid items in order:
    // Row 1: STATUS | GOAL
    container.appendChild(createGridItem("STATUS", identityLabel, "status"));
    container.appendChild(createGridItem("GOAL", purpose, "goal"));

    // Row 2: COHORT | FOCUS
    container.appendChild(createGridItem("COHORT", cohort, "cohort"));
    container.appendChild(createGridItem("FOCUS", focusText, "focus"));

    // Row 3: Joined Web Ring | LAST ACTIVE
    container.appendChild(createGridItem("Joined Web Ring", joinedDate || "—", "joined"));
    container.appendChild(createGridItem("LAST ACTIVE", lastActiveLabel, "last-active"));

    // Row 4: FIRST PUSH | TOTAL PUSHES
    container.appendChild(createGridItem("FIRST PUSH", firstCommitFormatted || "—", "first-push"));
    container.appendChild(createGridItem("TOTAL PUSHES", totalPushes.toString(), "total-pushes"));

    const returnGlow = lastSeenDays !== null && lastSeenDays > RETURN_GLOW_DAYS && totalPushes > 0;
    link.classList.toggle("return-glow", returnGlow);
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
