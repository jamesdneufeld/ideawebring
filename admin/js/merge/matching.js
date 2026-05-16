// js/matching.js
import { getConfig } from "./config.js";

export function normalize(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findBestMatch(folderId, students) {
  const config = getConfig();
  let bestMatch = { student: null, rule: null, weight: 0 };

  for (const student of students) {
    for (const rule of config.matchRules) {
      let matched = false;

      if (rule.name === "exact") {
        matched = student.id === folderId;
      } else if (rule.name === "normalized") {
        matched = normalize(student.id) === normalize(folderId);
      } else if (rule.name === "formerId") {
        matched = student.formerIds && Array.isArray(student.formerIds) && student.formerIds.some((fid) => normalize(fid) === normalize(folderId));
      } else if (rule.name === "github") {
        matched = student.githubUsername && normalize(student.githubUsername) === normalize(folderId);
      }

      if (matched && rule.weight > bestMatch.weight) {
        bestMatch = { student, rule: rule.name, weight: rule.weight };
      }
    }
  }

  return bestMatch;
}

export function getConfidenceLevel(weight) {
  const config = getConfig();
  const maxWeight = Math.max(...config.matchRules.map((r) => r.weight));
  if (weight === maxWeight) return "high";
  if (weight > 0) return "medium";
  return "low";
}

export function getConfidenceBadge(weight, rule, matchedToId) {
  const level = getConfidenceLevel(weight);
  if (level === "high") {
    return `<span class="confidence-badge confidence-high" title="Matched by rule: ${rule}">✅ High (${rule})</span>`;
  } else if (level === "medium") {
    return `<span class="confidence-badge confidence-medium" title="Matched by rule: ${rule} to ${matchedToId}">🟡 Medium (${rule})</span>`;
  } else {
    return `<span class="confidence-badge confidence-low" title="No existing student found">❌ New student</span>`;
  }
}
