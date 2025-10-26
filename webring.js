// Part of the IDEA Web Ring Toolkit — shared utilities for learning, collaboration, and open web creativity.
//
// IDEA Coding Club Webring System — Multi-Webring Edition
// Version 2.1 — Supports multiple webrings with configurable hubs

(function () {
  const normalize = (p) => p.replace(/\/+$/, "").toLowerCase();
  const safeIndex = (i, len) => ((i % len) + len) % len;
  const goto = (members, i) => (location.href = location.origin + members[safeIndex(i, members.length)]);

  async function loadMembers(url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not fetch member list: ${url}`);
      return (await res.json()).map(normalize);
    } catch (err) {
      console.error("webring:", err);
      return [];
    }
  }

  function populate(webring, members, currentIndex) {
    const base = location.origin;
    const prev = webring.querySelector(".webring-previous");
    const next = webring.querySelector(".webring-next");
    const hub = webring.querySelector(".webring-hub");

    if (prev) prev.href = base + members[safeIndex(currentIndex - 1, members.length)];
    if (next) next.href = base + members[safeIndex(currentIndex + 1, members.length)];

    // Use the data-hub attribute if provided, otherwise fallback to root
    const hubUrl = webring.dataset.hub || "/ideawebring/";
    if (hub) hub.href = hubUrl;
  }

  async function initWebring(webring) {
    const membersUrl = webring.dataset.members || "/webring-members.json";
    const members = await loadMembers(membersUrl);
    if (!members.length) return;

    const currentPath = normalize(location.pathname);
    let currentIndex = members.findIndex((m) => currentPath.startsWith(m));
    if (currentIndex === -1) currentIndex = 0;

    populate(webring, members, currentIndex);

    // Optional: keyboard navigation for this ring
    document.addEventListener("keydown", (e) => {
      if (["input", "textarea"].includes(e.target.tagName.toLowerCase())) return;
      if (e.key === "n") goto(members, currentIndex + 1);
      if (e.key === "p") goto(members, currentIndex - 1);
      if (e.key === "r") goto(members, Math.floor(Math.random() * members.length));
    });
  }

  document.querySelectorAll(".webring").forEach(initWebring);
})();

// ✅ End of webring.js — multi-ring navigation complete!
