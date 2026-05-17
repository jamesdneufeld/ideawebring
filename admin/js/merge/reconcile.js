// js/merge/reconcile.js
// Core reconciliation engine — takes folder list and existing students, applies matching rules, creates new student objects
// Returns summary counts (high/match/none) for UI feedback

import { getConfig } from "./config.js";
import { findBestMatch } from "./matching.js";
import { createStudent } from "./student.js";

export function reconcile(folders, existingStudents) {
  const config = getConfig();
  const maxWeight = Math.max(...config.matchRules.map((r) => r.weight));

  const students = folders.map((folderId) => {
    const match = findBestMatch(folderId, existingStudents);
    const existing = match.student;

    const student = createStudent(folderId, existing);

    return {
      ...student,
      matchRule: match.rule,
      matchWeight: match.weight,
      matchedToId: existing?.id || null,
    };
  });

  const highCount = students.filter((s) => s.matchWeight === maxWeight).length;
  const matchCount = students.filter((s) => s.matchWeight > 0 && s.matchWeight !== maxWeight).length;
  const noneCount = students.filter((s) => s.matchWeight <= 0).length;

  const rulesList = config.matchRules.map((r) => r.name).join(" → ");

  const summary = {
    highCount,
    matchCount,
    noneCount,
    rulesList,
    hasMissing: noneCount > 0,
  };

  return { students, summary };
}
