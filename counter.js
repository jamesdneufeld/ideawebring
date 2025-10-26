// Part of the IDEA Web Ring Toolkit — shared utilities for learning, collaboration, and open web creativity.
//
// 👁️ IDEA Web Ring Page View Counter
// Displays real-time views using Visitor Badge API, with a localStorage fallback for reliability.

document.addEventListener("DOMContentLoaded", () => {
  const counter = document.getElementById("viewCount");
  if (!counter) return; // Exit if the element is missing

  // Generate a safe page key based on URL path
  const path = window.location.pathname.replace(/^\/|\/$/g, ""); // remove leading/trailing slashes
  const pageKey = path ? path.replace(/\//g, "-") : "home";

  // Fallback function: increment and display localStorage counter
  const fallbackCounter = () => {
    const storageKey = `local-views-${pageKey}`;
    let views = parseInt(localStorage.getItem(storageKey)) || 0;
    views++;
    localStorage.setItem(storageKey, views);
    counter.textContent = views.toLocaleString() + "*"; // * indicates fallback
  };

  // Try fetching Visitor Badge API
  fetch(`https://visitor-badge.laobi.icu/badge?page_id=idea-web-ring-${pageKey}`)
    .then((response) => {
      if (!response.ok) throw new Error("API not available");
      return response.text();
    })
    .then((svgText) => {
      // Parse the number from the SVG returned by Visitor Badge
      const match = svgText.match(/>(\d+)<\/text>/);
      if (match && match[1]) {
        counter.textContent = parseInt(match[1]).toLocaleString(); // show actual number
      } else {
        // If parsing fails, fallback
        fallbackCounter();
      }
    })
    .catch(() => {
      // On any error, fallback to localStorage
      fallbackCounter();
    });
});

// ✅ End of counter.js — real, student-friendly view counter complete!
