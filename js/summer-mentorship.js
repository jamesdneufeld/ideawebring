// summer-mentorship.js
// Web Ring Badge System - Clean & Simple

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
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=5`);
    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    const lastCommit = commits[0];
    const date = lastCommit?.commit?.author?.date || null;
    const commitCount = commits.length;

    let status = "dormant";
    let days = null;

    if (date) {
      days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
      if (days <= 7) status = "active";
      else if (days <= 30) status = "recent";
    }

    const result = { status, date, days, commitCount };
    setCache(cacheKey, result);
    return result;
  } catch {
    return { status: "dormant", date: null, days: null, commitCount: 0 };
  }
}

// Load students.json for overrides
async function loadStudents() {
  try {
    const res = await fetch("./students.json");
    const data = await res.json();
    studentsData = data.students || [];
  } catch (e) {
    studentsData = [];
  }
}

// Create badge LI element
function createBadge(text, className, title = "") {
  const li = document.createElement("li");
  li.className = `badge ${className}`;
  li.textContent = text;
  if (title) li.title = title;
  return li;
}

// Calculate star rating (1-5) based on commit recency and frequency
function getStarRating(activity) {
  if (!activity.date) return 0;

  const days = activity.days;
  const count = activity.commitCount;

  // Base stars on recency
  let stars = 0;
  if (days <= 1) stars = 5;
  else if (days <= 3) stars = 4;
  else if (days <= 7) stars = 3;
  else if (days <= 14) stars = 2;
  else if (days <= 30) stars = 1;
  else stars = 0;

  // Boost stars for commit frequency (max 5)
  if (count >= 10 && stars < 5) stars = Math.min(5, stars + 1);
  if (count >= 20 && stars < 5) stars = Math.min(5, stars + 1);

  return stars;
}

// Format program display
function formatProgram(program) {
  if (!program) return "";
  return program === "BDes" ? "(BDes)" : "(IxD)";
}

// Main: populate everything
async function populateStudentData() {
  await loadStudents();

  const studentMap = new Map();
  studentsData.forEach((s) => studentMap.set(s.id, s));

  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();
    const student = studentMap.get(folder);

    // Update program and year
    const programSpan = link.querySelector(".student-program");
    const yearSpan = link.querySelector(".student-year");

    if (programSpan && student?.program) {
      programSpan.textContent = formatProgram(student.program);
    }
    if (yearSpan && student?.year) {
      yearSpan.textContent = student.year;
    }

    // Clear existing badges
    const badgesUl = link.querySelector(".student-badges");
    if (badgesUl) {
      badgesUl.innerHTML = "";
    }

    const badgesContainer = link.querySelector(".student-badges");
    if (!badgesContainer) continue;

    // Get activity data
    const activity = await getActivity(folder);

    // Days since last push (tooltip shows date)
    const daysText = activity.days !== null ? `${activity.days} days` : "No pushes yet";
    badgesContainer.appendChild(createBadge(`📅 ${daysText}`, "days", activity.date ? `Last push: ${new Date(activity.date).toLocaleDateString()}` : ""));

    // Status badge (active/recent/dormant)
    const statusIcon = activity.status === "active" ? "🟢" : activity.status === "recent" ? "🟡" : "⚫";
    badgesContainer.appendChild(createBadge(`${statusIcon} ${activity.status}`, `status-${activity.status}`));

    // Star rating (1-5)
    const stars = getStarRating(activity);
    const starDisplay = stars > 0 ? "★".repeat(stars) + "☆".repeat(5 - stars) : "☆☆☆☆☆";
    badgesContainer.appendChild(createBadge(starDisplay, "stars", `${stars}/5 stars based on recency + frequency`));
  }
}

// Run when page loads
document.addEventListener("DOMContentLoaded", populateStudentData);
