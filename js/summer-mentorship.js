// summer-mentorship.js
// Web Ring Badge System for Summer Coding Mentorship page

const REPO_OWNER = "jamesdneufeld";
const REPO_NAME = "ideawebring";

let studentsData = [];

// ----------------------------
// CACHE HELPERS (1 hour TTL)
// ----------------------------
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

// ----------------------------
// GITHUB: COMMITS (activity)
// ----------------------------
async function getActivity(folder) {
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=1`);

    const data = await res.json();
    const date = data?.[0]?.commit?.author?.date || null;

    let status = "dormant";

    if (date) {
      const days = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);

      if (days <= 7) status = "active";
      else if (days <= 30) status = "recent";
      else status = "dormant";
    }

    const result = { status, date };
    setCache(cacheKey, result);
    return result;
  } catch {
    return { status: "dormant", date: null };
  }
}

// ----------------------------
// GITHUB: FILES (page existence)
// ----------------------------
async function getFiles(folder) {
  const cacheKey = `files_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`);

    const data = await res.json();
    const files = (data || []).map((f) => f.name);

    const result = {
      about: files.includes("about.html"),
      playground: files.includes("playground.html"),
      links: files.includes("links.html"),
      event: files.includes("event.html"),
      resume: files.includes("resume.html"),
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return {
      about: false,
      playground: false,
      links: false,
      event: false,
      resume: false,
    };
  }
}

// ----------------------------
// LOAD STUDENTS.JSON
// ----------------------------
async function loadStudents() {
  try {
    const res = await fetch("./students.json");
    const data = await res.json();
    studentsData = data.students;
  } catch (e) {
    console.warn("No students.json found, using defaults");
    studentsData = [];
  }
}

// ----------------------------
// CREATE BADGE ELEMENT
// ----------------------------
function createBadge(text, className, title = "") {
  const el = document.createElement("span");
  el.className = `badge ${className}`;
  el.textContent = text;
  if (title) el.title = title;
  return el;
}

// ----------------------------
// ADD BADGES TO EXISTING STUDENT LIST
// ----------------------------
async function addBadgesToExistingList() {
  await loadStudents();

  // Get all existing student list items
  const studentItems = document.querySelectorAll(".student-group .student");

  if (studentItems.length === 0) {
    console.warn("No student items found");
    return;
  }

  // Create a map from folder name to student override data
  const overrideMap = new Map();
  if (studentsData.length) {
    studentsData.forEach((s) => {
      overrideMap.set(s.id, s);
    });
  }

  // Process each student item
  for (const item of studentItems) {
    const link = item.querySelector("a");
    if (!link) continue;

    // Extract folder name from href (e.g., "alexia-sogai/")
    const href = link.getAttribute("href");
    const folder = href.replace(/\/$/, "").toLowerCase();

    // Get override data if exists
    const override = overrideMap.get(folder);

    // Create badges container if it doesn't exist
    let badgesContainer = item.querySelector(".badges");
    if (!badgesContainer) {
      badgesContainer = document.createElement("div");
      badgesContainer.className = "badges";
      item.appendChild(badgesContainer);
    } else {
      // Clear existing badges
      badgesContainer.innerHTML = "";
    }

    // 1. Activity badge (from GitHub commits)
    const activity = await getActivity(folder);
    badgesContainer.appendChild(createBadge(activity.status, `status-${activity.status}`, activity.date || "No commits"));

    // 2. Page badges (from GitHub contents)
    const files = await getFiles(folder);

    if (files.about) badgesContainer.appendChild(createBadge("👤", "page", "about.html exists"));
    if (files.playground) badgesContainer.appendChild(createBadge("🎮", "page", "playground.html exists"));
    if (files.links) badgesContainer.appendChild(createBadge("🔗", "page", "links.html exists"));
    if (files.event) badgesContainer.appendChild(createBadge("📅", "page", "event.html exists"));

    // 3. Resume badge (override-aware)
    if (override?.resumeRequirementMet) {
      badgesContainer.appendChild(createBadge("✓ resume", "resume-ok", "Requirement met from prior course"));
    } else if (files.resume) {
      badgesContainer.appendChild(createBadge("📄 resume", "page", "resume.html exists"));
    }
  }
}

// Run when page loads
document.addEventListener("DOMContentLoaded", addBadgesToExistingList);
