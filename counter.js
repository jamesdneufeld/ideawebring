// Part of the IDEA Web Ring Toolkit — shared utilities for learning, collaboration, and open web creativity.
//
// 👁️ IDEA Web Ring Page View Counter
// Simple, reliable local view counter - guaranteed to work!

document.addEventListener("DOMContentLoaded", () => {
  const counter = document.getElementById("viewCount");
  if (!counter) return;

  const path = window.location.pathname.replace(/^\/|\/$/g, "");
  const pageKey = path ? path.replace(/\//g, "-") : "home";
  const storageKey = `webring-views-${pageKey}`;

  // Simple, reliable local counter
  let views = parseInt(localStorage.getItem(storageKey)) || 0;
  views++;
  localStorage.setItem(storageKey, views);

  counter.textContent = views.toLocaleString();
});

// ✅ End of counter.js — reliable view counter complete!
