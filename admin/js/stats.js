export function computeStats(students) {
  const total = students.length;

  const alumni = students.filter((s) => s.isAlumni).length;

  const activeStudents = students.filter((s) => !s.isAlumni && !s.withdrawn).length;

  const withdrawn = students.filter((s) => s.withdrawn).length;

  const gitHubActive = students.filter((s) => s.activity?.status === "active").length;

  const resumeReady = students.filter((s) => s.resumeRequirementMet).length;

  const missingGithub = students.filter((s) => !s.githubUsername).length;

  return {
    total,
    activeStudents,
    alumni,
    withdrawn,
    resumeReady,
    missingGithub,
    gitHubActive,
  };
}
