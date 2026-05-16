// js/merge/reconcile.js - CORRECTED
import { getConfig } from "./config.js";
import { findBestMatch, getConfidenceLevel } from "./matching.js";
import { createStudent } from "./student.js"; // ← fixed: local merge version

export function reconcile(folders, existingStudents) {
  const config = getConfig();
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

  const highCount = students.filter((s) => getConfidenceLevel(s.matchWeight) === "high").length;
  const mediumCount = students.filter((s) => getConfidenceLevel(s.matchWeight) === "medium").length;
  const lowCount = students.filter((s) => s.matchWeight === 0).length;

  const rulesList = config.matchRules.map((r) => r.name).join(" → ");
  const summary = {
    highCount,
    mediumCount,
    lowCount,
    rulesList,
    hasMissing: lowCount > 0,
  };

  return { students, summary };
}
