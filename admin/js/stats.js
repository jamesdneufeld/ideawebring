// js/stats.js
// Single-source, non-overlapping metrics

export function computeStats(students) {
  const total = students.length;

  // Lifecycle (authoritative from JSON)
  const alumni = students.filter((s) => s.isAlumni === true).length;
  const withdrawn = students.filter((s) => s.withdrawn === true).length;
  const enrolled = total - alumni - withdrawn;

  // Activity status (GitHub-derived, recency-only)
  const active = students.filter((s) => s.activity?.status === "active").length;
  const recent = students.filter((s) => s.activity?.status === "recent").length;
  const dormant = students.filter((s) => s.activity?.status === "dormant").length;
  const unknown = students.filter((s) => !s.activity?.status || s.activity?.status === "unknown").length;

  // Data completeness
  const resumeReady = students.filter((s) => s.resumeRequirementMet === true).length;
  const missingGithub = students.filter((s) => !s.githubUsername || s.githubUsername.trim() === "").length;

  // Engagement presence (any positive engagement score)
  const engaged = students.filter((s) => (s.activity?.engagementScore || 0) > 0).length;
  const disengaged = students.filter((s) => (s.activity?.engagementScore || 0) === 0).length;

  return {
    total,

    // lifecycle
    enrolled,
    alumni,
    withdrawn,

    // activity status (visual only)
    active,
    recent,
    dormant,
    unknown,

    // completeness
    resumeReady,
    missingGithub,

    // engagement presence
    engaged,
    disengaged,
  };
}
