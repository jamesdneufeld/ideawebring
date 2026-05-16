// js/merge/config.js
let CONFIG = {
  repo: { owner: "jamesdneufeld", name: "ideawebring" },
  excludeFolders: [],
  defaults: { program: "BDes", year: "2026", resumeRequirementMet: false },
  options: { programs: ["BDes", "IxD"], years: ["2026"], statuses: ["active", "inactive", "alumni"] },
  matchRules: [{ name: "exact", weight: 100 }],
  ui: { title: "Web Ring Admin", subhead: "", excludeHint: "" },
};

export async function loadConfig() {
  try {
    const res = await fetch("../../config.json"); // ✅ Correct path to /admin/config.json
    if (res.ok) {
      CONFIG = await res.json();
    }
  } catch (err) {
    console.log("Using default config");
  }
  return CONFIG;
}

export function getConfig() {
  return CONFIG;
}
