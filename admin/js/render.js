// js/render.js

function getDaysAgo(date) {
  if (!date) return null;

  const diff = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);

  return Math.floor(diff);
}

function getEngagementBar(score = 0) {
  const totalBars = 10;
  const filled = Math.round((score / 100) * totalBars);

  return "█".repeat(filled) + "░".repeat(totalBars - filled);
}

export function renderStudentGrid(students, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = students
    .map((student) => {
      const activity = student.activity || {};

      const daysAgo = getDaysAgo(activity.lastCommitDate);

      const lastSeen = daysAgo !== null ? `Last seen ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago` : "No activity recorded";

      const engagement = activity.engagementScore ?? 0;

      return `
        <div class="student-card ${student.withdrawn ? "inactive" : ""}">

          <div class="card-header">
            <div>
              <div class="student-name">
                ${student.displayName}
              </div>
              <div class="student-folder">
                ${student.id}
              </div>
            </div>

            <div class="status-badge">
              ${activity.status || "unknown"}
            </div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Program</span>
              <span class="detail-value">${student.program}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Year</span>
              <span class="detail-value">${student.year}</span>
            </div>
          </div>

          <div class="activity-timeline">
            <span class="activity-dot ${activity.status || "unknown"}"></span>
            ${lastSeen}
          </div>

          <div class="activity-timeline">
            Engagement:
            <span style="font-family: monospace;">
              ${getEngagementBar(engagement)} ${engagement}/100
            </span>
          </div>

          <div class="card-actions">
            ${
              student.githubUsername
                ? `<a class="card-link" target="_blank"
                     href="https://github.com/${student.githubUsername}">
                     GitHub
                   </a>`
                : ""
            }
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
    <div>Withdrawn: ${stats.withdrawn}</div>
    <div>Resume Ready: ${stats.resumeReady}</div>
    <div>Missing GitHub: ${stats.missingGithub}</div>
    <div>GitHub Active: ${stats.gitHubActive}</div>
    <div>GitHub Recent: ${stats.gitHubRecent}</div>
    <div>GitHub Dormant: ${stats.gitHubDormant}</div>
  `;
}
