// lib/system.js
// System folder definitions — central list of folders that should NEVER be treated as students
// Used ONLY by merge tool (js/merge/github.js and js/merge/main.js) to filter out admin, js, css, lib, etc. when fetching folder lists from GitHub
// NOT used by dashboard — dashboard only works with already-identified student folders from students.json, so it doesn't need system folder filtering

export const SYSTEM_FOLDERS = new Set(["admin", "js", "css", "lib", ".github", ".vscode", "assets", "blank-bdes", "blank-ixd", "ixd", "james", "james-in-class", "learning", "log"]);

export function isSystemFolder(name) {
  if (!name) return false;
  return SYSTEM_FOLDERS.has(name.toLowerCase());
}
