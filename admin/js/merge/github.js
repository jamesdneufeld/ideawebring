// js/merge/github.js (correct version)
import { getConfig } from "./config.js";

export async function fetchStudentsFromGitHub() {
  const config = getConfig();
  const url = `https://raw.githubusercontent.com/${config.repo.owner}/${config.repo.name}/main/students.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { students: json.students || [], lastUpdated: json.lastUpdated };
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

    const folders = data
      .filter((item) => item.type === "dir")
      .map((item) => item.name)
      .filter((name) => {
        if (config.excludeFolders.includes(name)) return false;
        if (name.startsWith(".")) return false;
        return true;
      })
      .sort();

    return { folders, excludedCount: config.excludeFolders.length };
  } catch (err) {
    throw new Error(`Failed to fetch folders: ${err.message}`);
  }
}
