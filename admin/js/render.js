// js/render.js
// Rendering logic for dashboard UI

function getDaysAgo(date) {
  if (!date) return null;

  const diff = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);

  return Math.floor(diff);
}

export function renderStudentGrid(students, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = students
    .map((student) => {
      const daysAgo = getDaysAgo(student.activity?.lastCommitDate);

      const lastSeenBadge =
        daysAgo !== null
          ? `
            <div class="activity-timeline">
              <span class="activity-dot ${student.activity?.status}"></span>
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
                ${student.displayName}
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
                ${student.program}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Year</span>
              <span class="detail-value">
                ${student.year}
              </span>
            </div>
          </div>

          ${lastSeenBadge}

          <div class="card-actions">
            ${
              student.githubUsername
                ? `<a class="card-link" target="_blank" href="https://github.com/${student.githubUsername}">
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
    <div>Active: ${stats.activeStudents}</div>
    <div>Alumni: ${stats.alumni}</div>
    <div>Resume Ready: ${stats.resumeReady}</div>
    <div>Missing GitHub: ${stats.missingGithub}</div>
    <div>GitHub Active: ${stats.gitHubActive}</div>
  `;
}
