// js/merge/student.js
import { getConfig } from "./config.js";

export function createStudent(folderId, existing = null) {
  const config = getConfig();
  const defaults = config.defaults || {};

  let tags = existing?.tags || [];
  if (typeof tags === "string" && tags.trim()) {
    tags = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  let formerIds = existing?.formerIds || [];
  if (typeof formerIds === "string" && formerIds.trim()) {
    formerIds = formerIds
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  }

  return {
    id: folderId,
    displayName: existing?.displayName || toDisplayName(folderId),
    githubUsername: existing?.githubUsername || "",
    program: existing?.program || defaults.program,
    year: existing?.year || defaults.year,
    isAlumni: existing?.isAlumni || false,
    withdrawn: existing?.withdrawn || false,
    formerIds,
    tags,
    resumeRequirementMet: existing?.resumeRequirementMet ?? defaults.resumeRequirementMet,
    notes: existing?.notes || "",
  };
}

export function toDisplayName(folder) {
  return folder
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getCohortDisplay(program, year, isAlumni, withdrawn) {
  if (withdrawn) return "Withdrawn";
  if (!program || !year) return "Unassigned";
  const suffix = isAlumni ? " (Alumni)" : "";
  return `${program} ${year}${suffix}`;
}

export function cleanForExport(student) {
  const { matchRule, matchWeight, matchedToId, ...clean } = student;
  return clean;
}
