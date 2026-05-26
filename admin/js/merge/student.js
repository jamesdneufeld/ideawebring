// js/merge/student.js
// Student object factory — creates new student records from folder names or existing data
// Handles default values (status, entryType, program, year, cohort, dates, purpose, learning goals, focus areas, tools)
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

  let tools = existing?.tools || [];
  if (typeof tools === "string" && tools.trim()) {
    tools = tools
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Preserve formerIds from existing student
  const formerIds = existing?.formerIds || [];

  return {
    id: folderId,
    displayName: existing?.displayName || toDisplayName(folderId),
    githubUsername: existing?.githubUsername || null,
    status: existing?.status || "student",
    entryType: existing?.entryType || "new",
    program: existing?.program || config.defaults.program,
    year: existing?.year || config.defaults.year,
    cohort: existing?.cohort || "Summer 2026",
    purpose: existing?.purpose || null,
    joinedWebRing: existing?.joinedWebRing || null,
    joinedMentorship: existing?.joinedMentorship || null,
    firstCommitDate: existing?.firstCommitDate || null,
    lastCommitDate: existing?.lastCommitDate || null,
    lastActiveSource: existing?.lastActiveSource || null,
    totalPushes: existing?.totalPushes || 0,
    learningGoal: existing?.learningGoal || null,
    focusAreas: focusAreas,
    tools: tools,
    formerIds: formerIds,
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
