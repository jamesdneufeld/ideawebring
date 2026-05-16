// js/merge/config.js

let CONFIG = {
  repo: { owner: "jamesdneufeld", name: "ideawebring" },
  excludeFolders: [],
  defaults: { program: "BDes", year: "2026", resumeRequirementMet: false },
  options: {
    programs: ["BDes", "IxD"],
    years: ["2026"],
    statuses: ["active", "inactive", "alumni"],
  },
  matchRules: [{ name: "exact", weight: 100 }],
  ui: { title: "Web Ring Admin", subhead: "", excludeHint: "" },
};

export async function loadConfig() {
  try {
    const res = await fetch("./config.json");
    if (res.ok) {
      const json = await res.json();

      CONFIG = {
        ...CONFIG,
        ...json,
        repo: { ...CONFIG.repo, ...json.repo },
        defaults: { ...CONFIG.defaults, ...json.defaults },
        options: { ...CONFIG.options, ...json.options },
        ui: { ...CONFIG.ui, ...json.ui },
        matchRules: json.matchRules || CONFIG.matchRules,
      };
    }
  } catch (err) {
    console.warn("Config load failed, using defaults:", err);
  }

  return CONFIG;
}

export function getConfig() {
  return CONFIG;
}
