// js/render.js
// Rendering logic for dashboard UI (Site-based system)

function getDaysAgo(date) {
  if (!date) return null;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function getEngagementBar(score) {
  const totalBars = 10;
  const filledBars = Math.round((score / 100) * totalBars);

  return "█".repeat(filledBars) + "░".repeat(totalBars - filledBars);
}

export function renderStudentGrid(students, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = students
    .map((student) => {
      const activity = student.activity || {};
      const daysAgo = getDaysAgo(activity.lastCommitDate);

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

      const engagement = activity.engagementScore ?? 0;

      return `
        <div class="student-card ${student.withdrawn ? "inactive" : ""}">

          <div class="card-header">
            <div>
              <div class="student-name">
                ${student.displayName}
              </div>

              <div class="student-folder">
                <span class="folder-icon">📁</span>
                ${student.id}
              </div>
            </div>

            <div class="status-badge">
              ${student.isAlumni ? "Alumni" : "Student"}
            </div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Program</span>
              <span class="detail-value">${student.program ?? "—"}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Year</span>
              <span class="detail-value">${student.year ?? "—"}</span>
            </div>
          </div>

          ${lastSeen}

          <div class="detail-row">
            <span class="detail-label">Engagement</span>
            <span class="detail-value">
              ${getEngagementBar(engagement)} ${engagement}/100
            </span>
          </div>

          <div class="card-actions">
            ${
              student.githubUsername
                ? `<a class="card-link" target="_blank" href="https://github.com/${student.githubUsername}">
                    GitHub
                   </a>`
                : ""
            }

            <a class="card-link" target="_blank" href="${student.portfolioUrl}">
              🕸️ Site
            </a>
          </div>

        </div>
      `;
    })
    .join("");
}

export function renderStats(stats) {
  const el = document.getElementById("stats");
  if (!el) return;

  el.innerHTML = `
    <div>Total: ${stats.total}</div>
    <div>Active Students: ${stats.activeStudents}</div>
    <div>Alumni: ${stats.alumni}</div>
    <div>Resume Ready: ${stats.resumeReady}</div>
    <div>Missing GitHub: ${stats.missingGithub}</div>
    <div>GitHub Active: ${stats.gitHubActive}</div>
    <div>GitHub Inactive: ${stats.gitHubInactive}</div>
  `;
}
