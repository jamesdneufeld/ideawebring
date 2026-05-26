// js/merge/matching.js
// Identity matching logic for reconciling folder names with existing student records
// Uses ranked rules (exact match, normalized match, github username match) to find best match with confidence levels

import { getConfig } from "./config.js";

export function normalize(str) {
  if (typeof str !== "string") return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findBestMatch(folderId, students) {
  const config = getConfig();

  let bestMatch = {
    student: null,
    rule: null,
    weight: 0,
    matchedToId: null,
  };

  for (const student of students) {
    for (const rule of config.matchRules) {
      let matched = false;

      if (rule.name === "exact") {
        matched = student.id === folderId;
      } else if (rule.name === "normalized") {
        matched = normalize(student.id) === normalize(folderId);
      } else if (rule.name === "github") {
        matched = student.githubUsername && normalize(student.githubUsername) === normalize(folderId);
      }

      if (matched && rule.weight > bestMatch.weight) {
        bestMatch = {
          student,
          rule: rule.name,
          weight: rule.weight,
          matchedToId: student.id,
        };
      }
    }
  }

  return bestMatch;
}

export function getConfidenceLevel(weight) {
  const config = getConfig();
  const maxWeight = Math.max(...config.matchRules.map((r) => r.weight));

  if (weight === maxWeight) return "high";
  return weight > 0 ? "match" : "none";
}

export function getConfidenceBadge(weight, rule, matchedToId) {
  const level = getConfidenceLevel(weight);

  if (level === "high") {
    return `<span class="confidence-badge confidence-high" title="Matched by rule: ${rule}">✅ High (${rule})</span>`;
  }

  if (level === "match") {
    return `<span class="confidence-badge confidence-match" title="Matched by rule: ${rule} to ${matchedToId || "unknown"}">🟡 Match (${rule})</span>`;
  }

  return `<span class="confidence-badge confidence-none" title="No existing student found">❌ New student</span>`;
}
