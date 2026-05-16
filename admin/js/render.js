// js/render.js
// Rendering logic for dashboard UI

function getDaysAgo(date) {
  if (!date) return null;
  const diff = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

function getEngagementBar(score = 0) {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;

  return `█`.repeat(filled) + `░`.repeat(empty);
}

export function renderStudentGrid(students, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = students
    .map((student) => {
      const daysAgo = getDaysAgo(student.lastCommitDate);
      const activity = student.activity || {};

      const lastSeenBadge =
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
                📁 ${student.displayName}
              </div>

              <div class="student-folder">
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
              <span class="detail-value">
                ${student.program ?? "—"}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Year</span>
              <span class="detail-value">
                ${student.year ?? "—"}
              </span>
            </div>
          </div>

          ${lastSeenBadge}

          <div class="activity-timeline">
            <span class="detail-label">Engagement</span>
          </div>

          <div class="activity-timeline">
            <span>${getEngagementBar(engagement)} ${engagement}/100</span>
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
              Portfolio
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
    <div>Active: ${stats.activeStudents}</div>
    <div>Alumni: ${stats.alumni}</div>
    <div>Resume Ready: ${stats.resumeReady}</div>
    <div>Missing GitHub: ${stats.missingGithub}</div>
    <div>GitHub Active: ${stats.gitHubActive}</div>
  `;
}
