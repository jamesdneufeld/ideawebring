// js/merge/github.js
// Fetches students.json from GitHub repo, fetches folder list from repo contents, and fetches commit counts (total pushes) for all students
// Uses batch processing to avoid GitHub API rate limits
// Commit counts check both current folder and all formerIds (for renamed folders)
// Also fetches last commit date for each student

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
    await new Promise((r) => setTimeout(r, 1000));

    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error("GitHub API rate limit exceeded. Please wait a few minutes and try again, or paste folders manually.");
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid GitHub API response");
    }

    const folders = data
      .filter((item) => item.type === "dir")
      .map((item) => item.name)
      .filter((name) => {
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

  const batchSize = 3;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (student) => {
        try {
          if (!student.githubUsername || student.githubUsername.trim() === "") {
            return { id: student.id, commitCount: 0, lastCommitDate: null };
          }

          const allPaths = [student.id, ...(student.formerIds || [])];
          let totalCommits = 0;
          let latestCommitDate = null;

          for (const path of allPaths) {
            const url = `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/commits?path=${path}&author=${student.githubUsername}&per_page=100`;
            const res = await fetch(url);

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                totalCommits += data.length;

                const commitDate = data[0]?.commit?.author?.date;
                if (commitDate) {
                  const thisDate = new Date(commitDate);
                  if (!latestCommitDate || thisDate > new Date(latestCommitDate)) {
                    latestCommitDate = commitDate;
                  }
                }
              }
            }

            await new Promise((r) => setTimeout(r, 200));
          }

          return { id: student.id, commitCount: totalCommits, lastCommitDate: latestCommitDate };
        } catch (err) {
          console.warn(`Failed to fetch commit count for ${student.id}:`, err);
          return { id: student.id, commitCount: 0, lastCommitDate: null };
        }
      }),
    );
    results.push(...batchResults);

    if (i + batchSize < students.length) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return results;
}

export async function fetchLastCommitDatesForStudents(students) {
  const config = getConfig();
  const results = [];

  const batchSize = 5;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (student) => {
        try {
          if (!student.githubUsername || student.githubUsername.trim() === "") {
            return { id: student.id, lastCommitDate: null };
          }

          const allPaths = [student.id, ...(student.formerIds || [])];
          let latestCommitDate = null;

          for (const path of allPaths) {
            const url = `https://api.github.com/repos/${config.repo.owner}/${config.repo.name}/commits?path=${path}&author=${student.githubUsername}&per_page=1`;
            const res = await fetch(url);

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                const commitDate = data[0]?.commit?.author?.date;
                if (commitDate) {
                  const thisDate = new Date(commitDate);
                  if (!latestCommitDate || thisDate > new Date(latestCommitDate)) {
                    latestCommitDate = commitDate;
                  }
                }
              }
            }

            await new Promise((r) => setTimeout(r, 200));
          }

          return { id: student.id, lastCommitDate: latestCommitDate };
        } catch (err) {
          console.warn(`Failed to fetch last commit for ${student.id}:`, err);
          return { id: student.id, lastCommitDate: null };
        }
      }),
    );
    results.push(...batchResults);

    if (i + batchSize < students.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
