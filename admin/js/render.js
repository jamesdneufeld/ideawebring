// js/render.js
// SAFE UI RENDERING with engagement tooltips

import { getEngagementBreakdown } from "./github.js";

function getDaysAgo(date) {
  if (!date) return null;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function getEngagementBar(score) {
  // Clamp score to 0-100 range
  const normalized = Math.min(100, Math.max(0, score));
  const total = 10;
  const filled = Math.round((normalized / 100) * total);
  return "█".repeat(filled) + "░".repeat(total - filled);
}

// Complete HTML escape with quotes and apostrophes
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return m;
    }
  });
}

export function renderStudentGrid(students, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!Array.isArray(students)) {
    container.innerHTML = `<div class="no-results">No data</div>`;
    return;
  }

  if (students.length === 0) {
    container.innerHTML = `<div class="no-results">No students found</div>`;
    return;
  }

  container.innerHTML = students
    .map((student) => {
      // Safe activity object with defaults
      const activity = student.activity || {
        engagementScore: 0,
        status: "unknown",
        lastCommitDate: null,
      };

      const daysAgo = getDaysAgo(activity.lastCommitDate);
      const engagement = activity.engagementScore ?? 0;
      const breakdown = getEngagementBreakdown(activity);
      const portfolioUrl = student.portfolioUrl || "#";

      const lastSeen =
        daysAgo !== null
          ? `
            <div class="activity-timeline">
              <span class="activity-dot ${activity.status}"></span>
              Last seen ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago
            </div>
          `
          : `
            <div class="activity-timeline">
              <span class="activity-dot dormant"></span>
              No activity recorded
            </div>
          `;

      return `
        <div class="student-card ${student.withdrawn ? "inactive" : ""}">

          <div class="card-header">
            <div>
              <div class="student-name">
                ${escapeHtml(student.displayName)}
              </div>

              <div class="student-folder">
                <span class="folder-icon">📁</span>
                ${escapeHtml(student.id)}
              </div>
            </div>

            <div class="status-badge">
              ${student.isAlumni ? "Alumni" : "Student"}
            </div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Program</span>
              <span class="detail-value">${escapeHtml(student.program ?? "—")}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Year</span>
              <span class="detail-value">${escapeHtml(student.year ?? "—")}</span>
            </div>
          </div>

          ${lastSeen}

          <div class="detail-row" title="${escapeHtml(breakdown)}">
            <span class="detail-label">Engagement</span>
            <span class="detail-value">
              ${getEngagementBar(engagement)} ${engagement}/100
            </span>
          </div>

          <div class="card-actions">
            ${
              student.githubUsername
                ? `<a class="card-link" target="_blank"
                    href="https://github.com/${escapeHtml(student.githubUsername)}">
                    GitHub
                   </a>`
                : ""
            }

            <a class="card-link" target="_blank"
               href="${escapeHtml(portfolioUrl)}">
              🕸️ Site
            </a>
          </div>

        </div>
      `;
    })
    .join("");
}

export function renderStats(stats) {
  const el = document.getElementById("statsBar");
  if (!el) return;

  // Safe fallbacks for all stats values
  el.innerHTML = `
    <div>Total: ${stats.total ?? 0}</div>
    <div>Active Students: ${stats.active ?? 0}</div>
    <div>Recent Students: ${stats.recent ?? 0}</div>
    <div>Dormant: ${stats.dormant ?? 0}</div>
    <div>Alumni: ${stats.alumni ?? 0}</div>
    <div>Withdrawn: ${stats.withdrawn ?? 0}</div>
    <div>Resume Ready: ${stats.resumeReady ?? 0}</div>
    <div>Missing GitHub: ${stats.missingGithub ?? 0}</div>
    <div>Has Commits: ${stats.gitHubActive ?? 0}</div>
    <div>No Commits: ${stats.gitHubInactive ?? 0}</div>
  `;
}
