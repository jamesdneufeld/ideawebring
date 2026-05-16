// lib/student.js
// Pure data transformations — no DOM, no side effects

export function normalizeStudent(raw) {
  return {
    id: raw.id,
    displayName:
      raw.displayName ||
      raw.id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    githubUsername: raw.githubUsername || null,
    status: raw.status || "active",
    resumeRequirementMet: raw.resumeRequirementMet || false,
    cohort: raw.cohort || "Unassigned",
    tags: raw.tags || [],
    notes: raw.notes || "",
    // Derived fields (set after enrichment)
    portfolioUrl: null,
    activity: null,
    activityStatus: "dormant",
    lastCommitDate: null,
  };
}

export function enrichWithUrls(student) {
  return {
    ...student,
    portfolioUrl: `https://jamesdneufeld.github.io/ideawebring/${student.id}/`,
  };
}

export function enrichWithActivity(student, activityData) {
  return {
    ...student,
    activity: activityData,
    activityStatus: activityData?.status || "dormant",
    lastCommitDate: activityData?.lastCommit || null,
  };
}

export function isResumeReady(student) {
  return student.resumeRequirementMet === true;
}

export function hasGithubLinked(student) {
  return student.githubUsername && student.githubUsername !== "";
}

export function getGithubUrl(student) {
  return student.githubUsername ? `https://github.com/${student.githubUsername}` : null;
}
