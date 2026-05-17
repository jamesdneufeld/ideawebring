// js/merge/github.js
// Fetches students.json from GitHub repo, fetches folder list from repo contents, and fetches commit counts (total pushes) for all students
// Uses batch processing to avoid GitHub API rate limits

import { getConfig } from "./config.js";
import { isSystemFolder } from "../../lib/system.js";

export async function fetchStudentsFromGitHub() {
  const config = getConfig();
  const branch = config.repo?.branch || "main";

  const url = `https://raw.githubusercontent.com/${config.repo.owner}/${config.repo.name}/${branch}/students.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    return {
      students: json.students || [],
      lastUpdated: json.lastUpdated,
    };
  } catch (err) {
    throw new Error(`Failed to fetch students.json: ${err.message}`);
  }
}

export async function fetchFoldersFromGitHub() {
  const config = getConfig();
  const url = `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/contents/`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid GitHub API response");
    }

    const folders = data
      .filter((item) => item.type === "dir")
      .map((item) => item.name)
      .filter((name) => {
        // Check system folders first
        if (isSystemFolder(name)) return false;
        if (name.startsWith(".")) return false;
        if (config.excludeFolders.includes(name)) return false;
        return true;
      })
      .sort();

    return {
      folders,
      excludedCount: config.excludeFolders.length,
    };
  } catch (err) {
    throw new Error(`Failed to fetch folders: ${err.message}`);
  }
}

export async function fetchCommitCountsForAllStudents(students) {
  const config = getConfig();
  const results = [];

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (student) => {
        try {
          const url = `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/commits?path=${student.id}&per_page=100`;
          const res = await fetch(url);

          if (!res.ok) {
            return { id: student.id, commitCount: 0 };
          }

          const data = await res.json();
          const commitCount = Array.isArray(data) ? data.length : 0;

          return { id: student.id, commitCount };
        } catch (err) {
          console.warn(`Failed to fetch commit count for ${student.id}:`, err);
          return { id: student.id, commitCount: 0 };
        }
      }),
    );
    results.push(...batchResults);

    // Delay between batches
    if (i + batchSize < students.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
