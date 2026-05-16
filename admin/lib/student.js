/// lib/student.js
/// SAFE PURE TRANSFORMATIONS (IMMUTABLE + NO FIELD LOSS)

// =========================
// 1. NORMALIZE (SAFE BASE OBJECT)
// =========================
export function normalizeStudent(raw) {
  return {
    // CORE IDENTITY (NEVER TOUCH IN ENRICHERS)
    id: raw.id,
    displayName:
      raw.displayName ||
      raw.id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),

    // STUDENT DATA
    githubUsername: raw.githubUsername || null,
    program: raw.program || "Unknown",
    year: raw.year || "Unknown",
    cohort: raw.cohort || "Unassigned",

    isAlumni: !!raw.isAlumni,
    withdrawn: !!raw.withdrawn,

    tags: raw.tags || [],
    notes: raw.notes || "",

    resumeRequirementMet: !!raw.resumeRequirementMet,

    // =========================
    // DERIVED / PLACEHOLDER FIELDS
    // =========================
    portfolioUrl: null,

    activity: {
      status: "unknown",
      lastCommitDate: null,
      lastCommit: null,
      daysSinceLastCommit: null,
      engagementScore: 0,
    },
  };
}

// =========================
// 2. URL ENRICHMENT (PURE MERGE)
// =========================
export function enrichWithUrls(student) {
  return {
    ...student,
    portfolioUrl: `https://jamesdneufeld.github.io/ideawebring/${student.id}/`,
  };
}

// =========================
// 3. ACTIVITY ENRICHMENT (SINGLE SOURCE OF TRUTH)
// =========================
export function enrichWithActivity(student, activityData) {
  return {
    ...student,

    activity: {
      status: activityData?.status || "unknown",
      lastCommitDate: activityData?.lastCommitDate || null,
      lastCommit: activityData?.lastCommit || null,
      daysSinceLastCommit: activityData?.daysSinceLastCommit ?? null,
      engagementScore: activityData?.engagementScore ?? 0,
    },
  };
}

// =========================
// 4. HELPERS (SAFE)
// =========================
export function isResumeReady(student) {
  return student.resumeRequirementMet === true;
}

export function hasGithubLinked(student) {
  return !!student.githubUsername && student.githubUsername.trim() !== "";
}

export function getGithubUrl(student) {
  return hasGithubLinked(student) ? `https://github.com/${student.githubUsername}` : null;
}
