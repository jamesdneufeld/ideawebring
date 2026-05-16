// summer-mentorship.js
// Web Ring Badge System with Gamified Engagement - Semantic HTML version

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

// GitHub: commits (activity with commit count for fun stats)
async function getActivity(folder) {
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=10`);
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

// Gamified engagement message
function getEngagementMessage(activity) {
  if (!activity.date) {
    return "🌱 Just getting started!";
  }

  const days = activity.days;
  const count = activity.commitCount;

  if (days <= 1) return "🔥 On fire! Pushed today!";
  if (days <= 3) return "⚡ Super fresh!";
  if (days <= 7) return "💪 Active this week!";
  if (days <= 14) return "👍 Still warming up";
  if (days <= 30) return "😴 Been a few weeks";
  if (days <= 60) return "🦥 Taking a break?";
  return "💤 Dormant — time to push!";
}

// Get fun commit streak emoji
function getCommitEmoji(count) {
  if (count >= 50) return "🏆";
  if (count >= 30) return "🔥";
  if (count >= 20) return "⚡";
  if (count >= 10) return "📈";
  if (count >= 5) return "🌱";
  if (count >= 1) return "✨";
  return "🍃";
}

// Format last push date nicely
function formatLastPush(date) {
  if (!date) return "Never";
  const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// Format program display
function formatProgram(program) {
  if (!program) return "";
  return program === "BDes" ? "(BDes)" : "(IxD)";
}

// Main: populate everything into semantic HTML
async function populateStudentData() {
  await loadStudents();

  const studentMap = new Map();
  studentsData.forEach((s) => studentMap.set(s.id, s));

  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();
    const student = studentMap.get(folder);

    // Update program and year in meta list
    const programLi = link.querySelector(".student-program");
    const yearLi = link.querySelector(".student-year");

    if (programLi && student?.program) {
      programLi.textContent = formatProgram(student.program);
    }
    if (yearLi && student?.year) {
      yearLi.textContent = student.year;
    }

    // Clear existing badges list
    const badgesUl = link.querySelector(".student-badges");
    if (badgesUl) {
      badgesUl.innerHTML = "";
    } else {
      // Fallback: create badges container if missing
      const newBadgesUl = document.createElement("ul");
      newBadgesUl.className = "student-badges";
      link.appendChild(newBadgesUl);
    }

    const badgesContainer = link.querySelector(".student-badges");
    if (!badgesContainer) continue;

    // Get activity data
    const activity = await getActivity(folder);
    const files = await getFiles(folder);

    // Activity badge with fun emoji
    const statusEmoji = activity.status === "active" ? "🟢" : activity.status === "recent" ? "🟡" : "⚫";
    const commitEmoji = getCommitEmoji(activity.commitCount);
    badgesContainer.appendChild(createBadge(`${statusEmoji} ${activity.status} ${commitEmoji}`, `status-${activity.status}`, `${activity.commitCount} commits · last push ${formatLastPush(activity.date)}`));

    // Engagement message (gamified tooltip)
    const engagementMsg = getEngagementMessage(activity);
    badgesContainer.appendChild(createBadge("✨", "engagement", engagementMsg));

    // Page badges
    if (files.about) badgesContainer.appendChild(createBadge("👤", "page", "about.html exists"));
    if (files.playground) badgesContainer.appendChild(createBadge("🎮", "page", "playground.html exists"));
    if (files.links) badgesContainer.appendChild(createBadge("🔗", "page", "links.html exists"));
    if (files.event) badgesContainer.appendChild(createBadge("📅", "page", "event.html exists"));

    // Resume badge
    if (student?.resumeRequirementMet) {
      badgesContainer.appendChild(createBadge("✓ resume", "resume-ok", "Requirement met from prior course"));
    } else if (files.resume) {
      badgesContainer.appendChild(createBadge("📄 resume", "page", "resume.html exists"));
    }
  }
}

// Run when page loads
document.addEventListener("DOMContentLoaded", populateStudentData);
