// Shared wiring for the sales pages: booking links and company details from config.js.
(function () {
  "use strict";

  const config = window.DAV_CONFIG || {};

  document.querySelectorAll(".js-cal").forEach((a) => {
    if (config.calUrl) a.href = config.calUrl;
    a.target = "_blank";
    a.rel = "noopener";
  });

  // <x data-config="cnpj">: fills the text (or href for links) and unhides the element,
  // so nothing half-empty shows up before Lucas fills config.js.
  document.querySelectorAll("[data-config]").forEach((el) => {
    const value = config[el.dataset.config];
    if (!value) return;
    if (el.tagName === "A") {
      el.href = el.dataset.config === "email" ? "mailto:" + value : value;
      if (!el.textContent.trim()) el.textContent = value;
    } else {
      el.textContent = value;
    }
    el.hidden = false;
    const group = el.closest("[data-config-group]");
    if (group) group.hidden = false;
  });

  // Sticky header: show the bottom border once the page scrolls
  const header = document.querySelector(".site-header.is-sticky");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Muted loops (.js-loop): play only while on screen, never with reduced motion (the poster
  // stays), and always with a pause button. A visitor's pause sticks until they press play again.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("video.js-loop").forEach((video) => {
    const toggle = video.parentElement.querySelector(".loop-toggle");
    let paused = reduceMotion;
    let visible = false;
    const sync = () => {
      if (!paused && visible) video.play().catch(() => {});
      else video.pause();
      if (toggle) toggle.textContent = paused ? "Ver animação" : "Pausar animação";
    };
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener("click", () => { paused = !paused; sync(); });
    }
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(video);
  });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
