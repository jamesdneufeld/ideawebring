function getDaysAgo(date) {
  if (!date) return null;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function renderEngagement(score) {
  const filled = Math.round((score / 100) * 10);
  const empty = 10 - filled;

  return `█`.repeat(filled) + `░`.repeat(empty);
}

export function renderStudentGrid(students, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = students
    .map((s) => {
      const activity = s.activity || {};

      const days = activity.daysSinceLastCommit;

      const lastSeen = days != null ? `Last seen ${days} day${days === 1 ? "" : "s"} ago` : "No activity recorded";

      const engagement = activity.engagementScore ?? 0;

      return `
        <div class="student-card ${s.withdrawn ? "inactive" : ""}">

          <div class="card-header">
            <div>
              <div class="student-name">${s.displayName}</div>
              <div class="student-folder">📁 ${s.id}</div>
            </div>

            <div class="status-badge">
              ${s.isAlumni ? "Alumni" : "Student"}
            </div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">Program</span>
              <span class="detail-value">${s.program}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Year</span>
              <span class="detail-value">${s.year}</span>
            </div>
          </div>

          <div class="activity-timeline">
            <span class="activity-dot ${activity.status}"></span>
            ${lastSeen}
          </div>

          <div class="activity-timeline">
            Engagement
            <span>${renderEngagement(engagement)} ${engagement}/100</span>
          </div>

        </div>
      `;
    })
    .join("");
}
