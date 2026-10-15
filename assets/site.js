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

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
