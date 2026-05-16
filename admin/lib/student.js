// lib/student.js
// Pure data pipeline layer

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

    // lifecycle
    isAlumni: !!raw.isAlumni,
    withdrawn: !!raw.withdrawn,

    program: raw.program || null,
    year: raw.year || null,

    resumeRequirementMet: !!raw.resumeRequirementMet,

    cohort: raw.cohort || "Unassigned",
    tags: raw.tags || [],
    notes: raw.notes || "",

    portfolioUrl: null,
    activity: null,
  };
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
  };
}
