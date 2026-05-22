(function () {
  const key = "prep_runway_theme";
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("theme");
  const saved = localStorage.getItem(key);
  const initial = requested || saved || "light";
  document.documentElement.dataset.theme = initial === "dark" ? "dark" : "light";

  function label(button) {
    button.textContent = document.documentElement.dataset.theme === "dark" ? "Light mode" : "Dark mode";
  }

  window.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector(".doc-nav");
    if (!nav || nav.querySelector(".theme-toggle")) return;

    const button = document.createElement("button");
    button.className = "theme-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Toggle dark theme");
    label(button);
    button.addEventListener("click", function () {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(key, next);
      label(button);
    });
    nav.appendChild(button);
  });
}());
