// js/stats.js

export function computeStats(students) {
  const total = students.length;
  const active = students.filter((s) => s.status === "active").length;
  const inactive = students.filter((s) => s.status === "inactive").length;
  const alumni = students.filter((s) => s.status === "alumni").length;
  const resumeReady = students.filter((s) => s.resumeRequirementMet).length;
  const missingGithub = students.filter((s) => !s.githubUsername || s.githubUsername === "").length;
  const gitHubActive = students.filter((s) => s.activityStatus === "active").length;

  return { total, active, inactive, alumni, resumeReady, missingGithub, gitHubActive };
}
