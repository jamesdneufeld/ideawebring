// summer-mentorship.js
// Web Ring Badge System - Learning continuity model

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

// Helper: get ISO week number (1-53)
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// GitHub: commits with depth tracking (active weeks)
async function getActivity(folder) {
  const cacheKey = `activity_${folder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${folder}&per_page=50`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`GitHub API error for ${folder}: ${res.status}`);
      const result = {
        status: "dormant",
        days: null,
        commitCount: 0,
        activeWeeks: 0,
        engagementScore: 0,
        recencyScore: 0,
        frequencyScore: 0,
        depthScore: 0,
      };
      setCache(cacheKey, result);
      return result;
    }

    const data = await res.json();
    const commits = Array.isArray(data) ? data : [];

    const lastCommit = commits[0];
    const date = lastCommit?.commit?.author?.date || null;
    const commitCount = commits.length;

    // Debug log for Apsara
    if (folder === "apsara") {
      console.log(`Apsara - Commits found: ${commitCount}`);
      console.log(`Apsara - Last commit date: ${date}`);
      if (commits[0]) {
        console.log(`Apsara - Commit author: ${commits[0]?.commit?.author?.name}`);
        console.log(`Apsara - Commit message: ${commits[0]?.commit?.message}`);
      }
    }

    // Calculate active weeks (depth) using proper ISO week
    const activeWeeks = new Set();
    commits.forEach((c) => {
      const d = new Date(c?.commit?.author?.date);
      if (!isNaN(d)) {
        const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
        activeWeeks.add(weekKey);
      }
    });

    let status = "dormant";
    let days = null;
    let recencyScore = 0;
    let frequencyScore = 0;
    let depthScore = 0;
    let engagementScore = 0;

    if (date) {
      days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));

      // Recency score (0-40)
      if (days <= 7) recencyScore = 40;
      else if (days <= 30) recencyScore = 25;
      else if (days <= 90) recencyScore = 10;
      else recencyScore = 5;

      // Frequency score (0-35)
      if (commitCount >= 30) frequencyScore = 35;
      else if (commitCount >= 20) frequencyScore = 30;
      else if (commitCount >= 10) frequencyScore = 22;
      else if (commitCount >= 5) frequencyScore = 15;
      else if (commitCount >= 1) frequencyScore = 5;

      // Depth score (0-25) - based on active weeks
      if (activeWeeks.size >= 20) depthScore = 25;
      else if (activeWeeks.size >= 12) depthScore = 20;
      else if (activeWeeks.size >= 8) depthScore = 15;
      else if (activeWeeks.size >= 4) depthScore = 10;
      else if (activeWeeks.size >= 1) depthScore = 5;

      engagementScore = Math.min(100, recencyScore + frequencyScore + depthScore);

      if (days <= 7) status = "active";
      else if (days <= 30) status = "recent";
    }

    const result = {
      status,
      days,
      commitCount,
      activeWeeks: activeWeeks.size,
      engagementScore,
      recencyScore,
      frequencyScore,
      depthScore,
    };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error fetching activity for ${folder}:`, err);
    return {
      status: "dormant",
      days: null,
      commitCount: 0,
      activeWeeks: 0,
      engagementScore: 0,
      recencyScore: 0,
      frequencyScore: 0,
      depthScore: 0,
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

// Engagement level based on multi-factor score (not just recency)
function getEngagementLevel(activity) {
  const score = activity.engagementScore || 0;
  if (score >= 70) return 4; // highly engaged
  if (score >= 50) return 3; // steady
  if (score >= 30) return 2; // emerging
  if (score >= 10) return 1; // low activity
  return 0; // inactive
}

const engagementLabels = ["Inactive", "Low", "Emerging", "Steady", "Active"];

function createBadge(className, text = "", title = "") {
  const li = document.createElement("li");
  li.className = `badge ${className}`;
  if (text) li.textContent = text;
  if (title) li.title = title;
  return li;
}

async function populateStudentData() {
  await loadStudents();
  const studentMap = new Map(studentsData.map((s) => [s.id, s]));
  const links = document.querySelectorAll(".student .navigation-link");

  for (const link of links) {
    const folder = link.dataset.folder || link.getAttribute("href").replace(/\/$/, "").toLowerCase();
    const student = studentMap.get(folder);

    // Update program and year
    const programEl = link.querySelector(".student-program");
    const yearEl = link.querySelector(".student-year");
    if (programEl && student?.program) programEl.textContent = student.program;
    if (yearEl && student?.year) yearEl.textContent = student.year;

    // Clear and rebuild badges
    const badgesContainer = link.querySelector(".student-badges");
    if (!badgesContainer) continue;
    badgesContainer.innerHTML = "";

    const activity = await getActivity(folder);
    const level = getEngagementLevel(activity);
    const levelLabel = engagementLabels[level];

    // Days badge
    const daysText = activity.days !== null ? `${activity.days} days` : "No pushes";
    badgesContainer.appendChild(createBadge("badge-days", daysText, activity.days ? `Last push: ${activity.days} days ago\nActive weeks: ${activity.activeWeeks}\nCommits: ${activity.commitCount}` : ""));

    // Status badge (active/recent/dormant)
    badgesContainer.appendChild(createBadge(`badge-status-${activity.status}`, activity.status));

    // Engagement badge
    badgesContainer.appendChild(createBadge(`badge-engagement-${level}`, levelLabel, `${activity.engagementScore}/100 — recency:${activity.recencyScore} freq:${activity.frequencyScore} depth:${activity.depthScore}`));
  }
}

document.addEventListener("DOMContentLoaded", populateStudentData);
