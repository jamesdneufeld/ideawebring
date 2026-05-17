// js/merge/student.js
// Student object factory — creates new student records from folder names or existing data
// Handles default values (status, participation, returning, program, year, cohort, dates, learning goals, focus areas)
// Preserves formerIds and cleans data for JSON export

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

  let focusAreas = existing?.focusAreas || [];
  if (typeof focusAreas === "string" && focusAreas.trim()) {
    focusAreas = focusAreas
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }

  // Preserve formerIds from existing student
  const formerIds = existing?.formerIds || [];

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
    lastCommitDate: existing?.lastCommitDate || null,
    formerIds: formerIds,
    // New fields
    cohort: existing?.cohort || "Summer 2026",
    joinedWebRing: existing?.joinedWebRing || null,
    joinedMentorship: existing?.joinedMentorship || null,
    learningGoal: existing?.learningGoal || null,
    focusAreas: focusAreas,
    selectedForFetch: false,
    tags,
    resumeRequirementMet: existing?.resumeRequirementMet ?? config.defaults.resumeRequirementMet,
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
  // Remove internal match fields and selectedForFetch, but KEEP all data fields
  const { matchRule, matchWeight, matchedToId, selectedForFetch, ...clean } = student;
  return clean;
}
