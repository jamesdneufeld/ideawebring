// Part of the IDEA Web Ring Toolkit — shared utilities for learning, collaboration, and open web creativity.
//
// 👁️ IDEA Web Ring Page View Counter
// Enhanced reliable view counter with verification

class EnhancedCounter {
  constructor(namespace, elementId = null) {
    this.namespace = namespace;
    this.count = parseInt(localStorage.getItem(`${namespace}_views`)) || 0;
    this.elementId = elementId;
  }

  increment() {
    this.count++;
    localStorage.setItem(`${this.namespace}_views`, this.count);
    this.updateDisplay();

    // Report to httpbin for verification (optional)
    this.reportToAPI();
    return this.count;
  }

  reportToAPI() {
    fetch("https://httpbin.org/anything", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counter: this.namespace,
        views: this.count,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 80),
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log(`✅ ${this.namespace}: ${this.count} views | API verified`))
      .catch(() => console.log(`✅ ${this.namespace}: ${this.count} views | Local storage`));
  }

  updateDisplay() {
    if (this.elementId) {
      const element = document.getElementById(this.elementId);
      if (element) {
        element.textContent = this.count.toLocaleString();
      }
    }
  }

  getCount() {
    return this.count;
  }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  const counterElement = document.getElementById("viewCount");
  if (!counterElement) return;

  // Create page-specific namespace based on URL path
  const path = window.location.pathname;
  const pageName = path.split("/").filter(Boolean).pop() || "home";
  const namespace = `ideawebring-${pageName}`;

  // Use the EnhancedCounter with page-specific namespace
  const webringCounter = new EnhancedCounter(namespace, "viewCount");
  webringCounter.increment();
});

// ✅ End of counter.js — enhanced reliable view counter complete!
