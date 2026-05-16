/// js/render.js
/// UI rendering layer (activity-aware dashboard)

function getDaysAgo(date) {
  if (!date) return null;
  return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
}

function getActivity(student) {
  return student.activity || {};
}

function renderEngagementBar(score = 0) {
  const totalBars = 10;
  const filled = Math.round((score / 100) * totalBars);

  const bar = "█".repeat(filled) + "░".repeat(totalBars - filled);

  return `${bar} ${score} / 100`;
}

function getStatusLabel(activityStatus) {
  switch (activityStatus) {
    case "active":
      return "Active";
    case "recent":
      return "Recent";
    case "dormant":
      return "At Risk";
    default:
      return "Unknown";
  }
}

export function renderStudentGrid(students, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = students
    .map((student) => {
      const activity = getActivity(student);

      const daysAgo = getDaysAgo(activity.lastCommitDate);

      const status = activity.status || "unknown";

      const engagement = activity.engagementScore ?? 0;

      // =========================
      // LAST SEEN BADGE
      // =========================
      const lastSeenBadge =
        daysAgo !== null
          ? `
            <div class="activity-timeline">
              <span class="activity-dot ${status}"></span>
              Last seen ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago
            </div>
          `
          : `
            <div class="activity-timeline">
              <span class="activity-dot dormant"></span>
              No activity recorded
            </div>
          `;

      // =========================
      // ENGAGEMENT BAR
      // =========================
      const engagementBar = `
        <div class="activity-timeline">
          <span class="activity-dot ${status}"></span>
          Engagement ${renderEngagementBar(engagement)}
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

            <div class="status-badge status-${status}">
              ${getStatusLabel(status)}
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

            <div class="detail-row">
              <span class="detail-label">GitHub</span>
              <span class="detail-value">
                ${student.githubUsername || "—"}
              </span>
            </div>
          </div>

          ${lastSeenBadge}

          ${engagementBar}

          <div class="card-actions">
            ${
              student.githubUsername
                ? `
                <a class="card-link" target="_blank"
                   href="https://github.com/${student.githubUsername}">
                  GitHub
                </a>
              `
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
    <div class="stat-card">
      <div class="stat-number">${stats.total}</div>
      <div class="stat-label">Total</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${stats.activeStudents}</div>
      <div class="stat-label">Active</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${stats.alumni}</div>
      <div class="stat-label">Alumni</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${stats.resumeReady}</div>
      <div class="stat-label">Resume Ready</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${stats.missingGithub}</div>
      <div class="stat-label">Missing GitHub</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">${stats.gitHubActive}</div>
      <div class="stat-label">GitHub Active</div>
    </div>
  `;
}
