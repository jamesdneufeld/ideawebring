// js/merge/student.js
import { getConfig } from "./config.js";

export function createStudent(folderId, existing = null) {
  const config = getConfig();

  let tags = existing?.tags || [];
  if (typeof tags === "string" && tags.trim()) {
    tags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return {
    id: folderId,
    displayName: existing?.displayName || toDisplayName(folderId),
    githubUsername: existing?.githubUsername || "",
    status: existing?.status || "student",
    participation: existing?.participation || null,
    returning: existing?.returning || false,
    program: existing?.program || config.defaults.program,
    year: existing?.year || config.defaults.year,
    totalPushes: existing?.totalPushes || 0,
    tags,
    resumeRequirementMet: existing?.resumeRequirementMet ?? config.defaults.resumeRequirementMet,
    notes: existing?.notes || "",
  };
}

export function toDisplayName(folder) {
  return folder
    .split("-")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .filter(Boolean)
    .join(" ");
}

export function cleanForExport(student) {
  const { matchRule, matchWeight, matchedToId, ...clean } = student;
  return clean;
}
