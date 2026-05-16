// js/render.js
// Only renders — no logic, no fetching

export function renderStats(stats, onStatClick) {
  const statsBar = document.getElementById("statsBar");
  statsBar.innerHTML = `
    <div class="stat-card" data-filter="all"><div class="stat-number">${stats.total}</div><div class="stat-label">Total Students</div></div>
    <div class="stat-card" data-filter="active"><div class="stat-number" style="color: #3fb950;">${stats.active}</div><div class="stat-label">Status: Active</div></div>
    <div class="stat-card" data-filter="inactive"><div class="stat-number" style="color: #6e7681;">${stats.inactive}</div><div class="stat-label">Status: Inactive</div></div>
    <div class="stat-card" data-filter="alumni"><div class="stat-number" style="color: #d29922;">${stats.alumni}</div><div class="stat-label">Alumni</div></div>
    <div class="stat-card" data-filter="resume-ready"><div class="stat-number" style="color: #58a6ff;">${stats.resumeReady}</div><div class="stat-label">Resume Ready</div></div>
    <div class="stat-card" data-filter="no-github"><div class="stat-number" style="color: #f85149;">${stats.missingGithub}</div><div class="stat-label">Missing GitHub</div></div>
    <div class="stat-card"><div class="stat-number" style="color: #3fb950;">${stats.gitHubActive}</div><div class="stat-label">GitHub Active</div></div>
  `;

  // Attach click handlers
  document.querySelectorAll(".stat-card").forEach((card) => {
    card.addEventListener("click", () => {
      const filter = card.dataset.filter;
      if (filter) onStatClick(filter);
    });
  });
}

export function renderStudentGrid(students, containerId) {
  const container = document.getElementById(containerId);

  if (students.length === 0) {
    container.innerHTML = '<div class="no-results">🔍 No students match your filters</div>';
    return;
  }

  container.innerHTML = "";
  students.forEach((student) => {
    container.appendChild(createStudentCard(student));
  });
}

function createStudentCard(student) {
  const card = document.createElement("div");
  card.className = `student-card ${student.status === "inactive" ? "inactive" : ""}`;

  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="student-name">${escapeHtml(student.displayName)}</div>
        <div class="student-folder">📁 ${student.id}</div>
      </div>
      <span class="status-badge status-${student.status}">${student.status}</span>
    </div>
    <div class="activity-timeline">
      <span class="activity-dot ${student.activityStatus}"></span>
      <span>${student.activityStatus === "active" ? "Active" : student.activityStatus === "recent" ? "Recent activity" : "Dormant"}</span>
      ${student.lastCommitDate ? `<span>· last commit ${student.lastCommitDate}</span>` : ""}
    </div>
    <div class="card-details">
      <div class="detail-row">
        <span class="detail-label">GitHub:</span>
        <span class="detail-value">${student.githubUsername ? "@" + escapeHtml(student.githubUsername) : "❌ Not linked"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Resume:</span>
        <span class="detail-value">
          <span class="resume-badge ${student.resumeRequirementMet ? "resume-yes" : "resume-no"}">
            ${student.resumeRequirementMet ? "✓ Requirement Met" : "○ Not Started"}
          </span>
        </span>
      </div>
      ${student.cohort && student.cohort !== "Unassigned" ? `<div class="detail-row"><span class="detail-label">Cohort:</span><span class="detail-value">${escapeHtml(student.cohort)}</span></div>` : ""}
      ${student.notes ? `<div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${escapeHtml(student.notes)}</span></div>` : ""}
    </div>
    ${
      student.tags && student.tags.length
        ? `
      <div class="tags">
        ${student.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
    `
        : ""
    }
    <div class="card-actions">
      <a href="${student.portfolioUrl}" target="_blank" class="card-link">🌐 Portfolio</a>
      ${student.githubUsername ? `<a href="https://github.com/${student.githubUsername}" target="_blank" class="card-link">🐙 GitHub</a>` : ""}
    </div>
  `;

  return card;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}
