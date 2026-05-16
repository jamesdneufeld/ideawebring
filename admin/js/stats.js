// js/stats.js

export function computeStats(students) {
  const total = students.length;

  const active = students.filter((s) => !s.isAlumni && !s.withdrawn && s.activity?.status === "active").length;

  const inactive = students.filter((s) => !s.isAlumni && !s.withdrawn && s.activity?.status === "dormant").length;

  const alumni = students.filter((s) => s.isAlumni).length;

  const resumeReady = students.filter((s) => s.resumeRequirementMet).length;

  const missingGithub = students.filter((s) => !s.githubUsername || s.githubUsername.trim() === "").length;

  const gitHubActive = students.filter((s) => s.activity?.status === "active").length;

  return {
    total,
    active,
    inactive,
    alumni,
    resumeReady,
    missingGithub,
    gitHubActive,
  };
}
