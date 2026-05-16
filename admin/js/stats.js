// js/stats.js
// Canonical dashboard statistics (stable + non-overlapping definitions)

export function computeStats(students) {
  const total = students.length;

  // -----------------------------
  // LIFECYCLE (immutable identity)
  // -----------------------------
  const alumni = students.filter((s) => s.isAlumni).length;

  const withdrawn = students.filter((s) => s.withdrawn).length;

  const activeStudents = students.filter((s) => !s.isAlumni && !s.withdrawn).length;

  // -----------------------------
  // GITHUB ACTIVITY (behavioral)
  // -----------------------------
  const gitHubActive = students.filter((s) => s.activity?.status === "active").length;

  const gitHubRecent = students.filter((s) => s.activity?.status === "recent").length;

  const gitHubDormant = students.filter((s) => s.activity?.status === "dormant").length;

  const gitHubUnknown = students.filter((s) => s.activity?.status === "unknown").length;

  // -----------------------------
  // ENGAGEMENT SYSTEM (NEW CORE METRIC)
  // -----------------------------
  const highEngagement = students.filter((s) => (s.activity?.engagementScore || 0) >= 70).length;

  const lowEngagement = students.filter((s) => (s.activity?.engagementScore || 0) < 40).length;

  const atRisk = students.filter((s) => {
    const days = s.activity?.daysSinceLastCommit;
    return days !== null && days >= 30;
  }).length;

  // -----------------------------
  // ADMIN / DATA QUALITY
  // -----------------------------
  const missingGithub = students.filter((s) => !s.githubUsername || s.githubUsername.trim() === "").length;

  const resumeReady = students.filter((s) => s.resumeRequirementMet).length;

  return {
    total,

    // lifecycle
    activeStudents,
    alumni,
    withdrawn,

    // github activity
    gitHubActive,
    gitHubRecent,
    gitHubDormant,
    gitHubUnknown,

    // engagement
    highEngagement,
    lowEngagement,
    atRisk,

    // data quality
    resumeReady,
    missingGithub,
  };
}
