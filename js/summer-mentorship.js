// summer-mentorship.js
// Web Ring Badge System - Populates badges and metadata inside existing <a> tags

const REPO_OWNER = "jamesdneufeld";
const REPO_NAME = "ideawebring";

let studentsData = [];

// Cache helpers (1 hour TTL)
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

// GitHub: commits (activity)
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
    }

    const result = { status, date };
    setCache(cacheKey, result);
    return result;
  } catch {
    return { status: "dormant", date: null };
  }
}

// GitHub: files (page existence)
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

// Load students.json for overrides (resumeRequirementMet, program, year, etc.)
async function loadStudents() {
  try {
    const res = await fetch("./students.json");
    const data = await res.json();
    studentsData = data.students || [];
  } catch (e) {
    studentsData = [];
  }
}

// Create badge element
function createBadge(text, className, title = "") {
  const el = document.createElement("span");
  el.className = `badge ${className}`;
  el.textContent = text;
  if (title) el.title = title;
  el.style.marginLeft = "0.4rem";
  return el;
}

// Format program display (BDes or IxD)
function formatProgram(program) {
  if (!program) return "";
  return program === "BDes" ? "(BDes)" : "(IxD)";
}

// Main: populate badges and metadata into existing <a> tags
async function populateStudentData() {
  await loadStudents();

  // Build map of folder -> student data
  const studentMap = new Map();
  studentsData.forEach((s) => studentMap.set(s.id, s));

  // Find all student links
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    // Get folder from data-folder or href
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();

    const student = studentMap.get(folder);

    // Update program and year spans inside the link
    const programSpan = link.querySelector(".student-program");
    const yearSpan = link.querySelector(".student-year");

    if (programSpan && student?.program) {
      programSpan.textContent = ` ${formatProgram(student.program)}`;
    }

    if (yearSpan && student?.year) {
      yearSpan.textContent = ` ${student.year}`;
    }

    // Clear existing badges (if any)
    const existingBadges = link.querySelectorAll(".badge");
    existingBadges.forEach((badge) => badge.remove());

    // Activity badge
    const activity = await getActivity(folder);
    link.appendChild(createBadge(activity.status, `status-${activity.status}`, activity.date || "No commits"));

    // Page badges
    const files = await getFiles(folder);
    if (files.about) link.appendChild(createBadge("👤", "page", "about.html exists"));
    if (files.playground) link.appendChild(createBadge("🎮", "page", "playground.html exists"));
    if (files.links) link.appendChild(createBadge("🔗", "page", "links.html exists"));
    if (files.event) link.appendChild(createBadge("📅", "page", "event.html exists"));

    // Resume badge
    if (student?.resumeRequirementMet) {
      link.appendChild(createBadge("✓ resume", "resume-ok", "Requirement met from prior course"));
    } else if (files.resume) {
      link.appendChild(createBadge("📄 resume", "page", "resume.html exists"));
    }
  }
}

// Run when page loads
document.addEventListener("DOMContentLoaded", populateStudentData);
