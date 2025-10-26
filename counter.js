// Part of the IDEA Web Ring Toolkit — shared utilities for learning, collaboration, and open web creativity.
//
// 👁️ IDEA Web Ring Page View Counter
// Shows how JavaScript can fetch and display real data using CountAPI.
// Each page gets its own unique, privacy-friendly view count—simple, functional, and alive.

document.addEventListener("DOMContentLoaded", () => {
  const namespace = "idea-web-ring";

  // Create a safe unique key for this path
  const path = window.location.pathname.replace(/^\/|\/$/g, ""); // remove leading/trailing slashes
  const pageKey = path ? path.replace(/\//g, "-") : "home";

  // Use just the pageKey (namespace is already in the URL)
  const key = pageKey;

  // Fetch count and update UI
  fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`)
    .then((res) => res.json())
    .then((data) => {
      const counter = document.getElementById("viewCount");
      if (counter) counter.textContent = data.value.toLocaleString();
    })
    .catch(() => {
      const counter = document.getElementById("viewCount");
      if (counter) counter.textContent = "—";
    });
});

// ✅ End of counter.js — view counter complete!
