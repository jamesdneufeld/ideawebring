// js/stats.js
// Canonical dashboard statistics (clean separation of concerns)

export function computeStats(students) {
  const total = students.length;

  // Lifecycle (student state)
  const activeStudents = students.filter((s) => !s.isAlumni && !s.withdrawn).length;

  const alumni = students.filter((s) => s.isAlumni).length;

  const withdrawn = students.filter((s) => s.withdrawn).length;

  // GitHub activity (independent system)
  const gitHubActive = students.filter((s) => s.activity?.status === "active").length;

  const gitHubInactive = students.filter((s) => s.activity?.status === "dormant").length;

  const resumeReady = students.filter((s) => s.resumeRequirementMet).length;

  const missingGithub = students.filter((s) => !s.githubUsername || s.githubUsername.trim() === "").length;

  return {
    total,
    activeStudents,
    alumni,
    withdrawn,
    resumeReady,
    missingGithub,
    gitHubActive,
    gitHubInactive,
  };
}
