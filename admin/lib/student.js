// lib/student.js
// Dashboard data pipeline — normalizes raw JSON from students.json, adds computed fields (portfolioUrl), and enriches with GitHub activity data
// NOT used by the merge tool — only used by the public dashboard (summer-coding-mentorship.html and dashboard.html)
// Transforms raw student data into display-ready objects with activity status, last commit date, and engagement scores
//

export function normalizeStudent(raw) {
  return {
    id: raw.id ?? "unknown",
    displayName: raw.displayName ?? formatName(raw.id),

    githubUsername: raw.githubUsername ?? null,

    // lifecycle flags
    isAlumni: Boolean(raw.isAlumni),
    withdrawn: Boolean(raw.withdrawn),

    // academic info (SAFE DEFAULTS FIX)
    program: raw.program ?? "—",
    year: raw.year ?? "—",

    cohort: raw.cohort ?? "Unassigned",
    tags: Array.isArray(raw.tags) ? raw.tags : [],

    resumeRequirementMet: Boolean(raw.resumeRequirementMet),
    notes: raw.notes ?? "",

    // derived
    portfolioUrl: null,

    activity: null,
    activityStatus: "unknown",
    lastCommitDate: null,
  };
}

function formatName(id) {
  if (!id) return "Unknown";

  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function enrichWithUrls(student) {
  return {
    ...student,
    portfolioUrl: `https://jamesdneufeld.github.io/ideawebring/${student.id}/`,
  };
}

export function enrichWithActivity(student, activity) {
  return {
    ...student,
    activity,
    activityStatus: activity?.status ?? "unknown",
    lastCommitDate: activity?.lastCommitDate ?? null,
  };
}
