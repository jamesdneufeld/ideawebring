/// js/filters.js
/// Pure filtering + derived status system (single source of truth)

function getActivityStatus(student) {
  return student.activity?.status || "unknown";
}

function getEngagement(student) {
  return student.activity?.engagementScore ?? 0;
}

function hasGithub(student) {
  return !!student.githubUsername && student.githubUsername.trim() !== "";
}

export function filterStudents(students, state) {
  const { search, statusFilter, selectedCohorts, selectedTags } = state;

  let filtered = [...students];

  // =========================
  // STATUS FILTER (DERIVED SYSTEM)
  // =========================
  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter((s) => {
      const activityStatus = getActivityStatus(s);
      const engagement = getEngagement(s);

      const isAlumni = !!s.isAlumni;
      const isWithdrawn = !!s.withdrawn;

      switch (statusFilter) {
        case "active":
          return !isAlumni && !isWithdrawn && activityStatus === "active";

        case "recent":
          return activityStatus === "recent";

        case "dormant":
        case "at-risk":
          return activityStatus === "dormant" || activityStatus === "unknown";

        case "alumni":
          return isAlumni;

        case "withdrawn":
          return isWithdrawn;

        case "no-github":
          return !hasGithub(s);

        case "resume-ready":
          return !!s.resumeRequirementMet;

        case "low-engagement":
          return engagement < 40;

        default:
          return true;
      }
    });
  }

  // =========================
  // COHORT FILTER
  // =========================
  if (selectedCohorts.size > 0) {
    filtered = filtered.filter((s) => selectedCohorts.has(s.cohort));
  }

  // =========================
  // TAG FILTER
  // =========================
  if (selectedTags.size > 0) {
    filtered = filtered.filter((s) => {
      const studentTags = new Set(s.tags || []);
      for (const tag of selectedTags) {
        if (!studentTags.has(tag)) return false;
      }
      return true;
    });
  }

  // =========================
  // SEARCH FILTER
  // =========================
  if (search) {
    const q = search.toLowerCase();

    filtered = filtered.filter((s) => {
      return s.displayName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.githubUsername && s.githubUsername.toLowerCase().includes(q));
    });
  }

  return filtered;
}

export function sortStudents(students, sortBy, sortDirection) {
  const sorted = [...students];

  sorted.sort((a, b) => {
    let comparison = 0;

    if (sortBy === "name") {
      comparison = a.displayName.localeCompare(b.displayName);
    } else if (sortBy === "status") {
      const order = { active: 0, recent: 1, dormant: 2, unknown: 3 };

      comparison = (order[getActivityStatus(a)] ?? 3) - (order[getActivityStatus(b)] ?? 3);
    } else if (sortBy === "activity") {
      const aDate = a.activity?.lastCommitDate ? new Date(a.activity.lastCommitDate) : 0;

      const bDate = b.activity?.lastCommitDate ? new Date(b.activity.lastCommitDate) : 0;

      comparison = bDate - aDate;
    } else if (sortBy === "engagement") {
      comparison = getEngagement(b) - getEngagement(a);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return sorted;
}

export function computeAvailableCohorts(students) {
  const cohorts = new Set();

  students.forEach((s) => {
    if (s.cohort && s.cohort !== "Unassigned") {
      cohorts.add(s.cohort);
    }
  });

  return Array.from(cohorts).sort();
}

export function computeAvailableTags(students) {
  const tags = new Set();

  students.forEach((s) => {
    if (s.tags) {
      s.tags.forEach((t) => tags.add(t));
    }
  });

  return Array.from(tags).sort();
}
