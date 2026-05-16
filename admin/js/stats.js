// js/stats.js

export function computeStats(students) {
  const total = students.length;

  const active = students.filter((s) => s.state?.isActiveParticipant).length;

  const engaged = students.filter((s) => s.state?.isEngaged).length;

  const alumni = students.filter((s) => s.state?.lifecycle === "alumni").length;

  const studentsOnly = students.filter((s) => s.state?.lifecycle === "student").length;

  const withdrawn = students.filter((s) => s.state?.lifecycle === "withdrawn").length;

  const resumeReady = students.filter((s) => s.resumeRequirementMet).length;

  const missingGithub = students.filter((s) => !s.githubUsername || s.githubUsername.trim() === "").length;

  const gitHubActive = students.filter((s) => s.state?.activity === "active").length;

  return {
    total,
    active,
    engaged,
    alumni,
    studentsOnly,
    withdrawn,
    resumeReady,
    missingGithub,
    gitHubActive,
  };
}
