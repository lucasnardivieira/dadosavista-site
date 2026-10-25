// UTM capture, cookie consent and the Meta pixel (loaded only after consent).
// Pure helpers live in DavTracking so they can be tested without a DOM.
(function (root) {
  "use strict";

  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  const UTM_STORE = "dav_utm";
  const CONSENT_STORE = "dav_consent";

  // First-touch UTMs of the visit: an ad lands on the home page, the form opens on /teste.
  function parseUtms(search) {
    const params = new URLSearchParams(search || "");
    const utms = {};
    for (const key of UTM_KEYS) {
      const value = (params.get(key) || "").trim().slice(0, 100);
      if (value) utms[key] = value;
    }
    return utms;
  }

  // Keep what we already have unless the new URL brings UTMs of its own.
  function mergeUtms(stored, fresh) {
    return Object.keys(fresh).length ? fresh : stored || {};
  }

  // Tally hidden fields always get every UTM key (empty string when unknown).
  function utmFields(utms) {
    const out = {};
    for (const key of UTM_KEYS) out[key] = (utms && utms[key]) || "";
    return out;
  }

  // The banner only makes sense when there is something to consent to (the pixel).
  function needsBanner(pixelId, choice) {
    return Boolean(pixelId) && choice !== "granted" && choice !== "denied";
  }

  root.DavTracking = { UTM_KEYS, parseUtms, mergeUtms, utmFields, needsBanner };

  if (typeof document === "undefined") return; // tests

  const config = root.DAV_CONFIG || {};
  const store = {
    get(area, key) {
      try { return root[area].getItem(key); } catch { return null; }
    },
    set(area, key, value) {
      try { root[area].setItem(key, value); } catch { /* private mode: keep it for this page */ }
    },
  };

  // UTMs, per browser session
  let utms = {};
  try { utms = JSON.parse(store.get("sessionStorage", UTM_STORE) || "{}"); } catch { utms = {}; }
  utms = mergeUtms(utms, parseUtms(root.location.search));
  store.set("sessionStorage", UTM_STORE, JSON.stringify(utms));
  root.DavTracking.currentUtms = () => utmFields(utms);

  // Meta pixel, only after "Aceitar"
  const pending = [];
  function loadPixel() {
    if (!config.metaPixelId || root.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(root,document,
    'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    root.fbq("init", config.metaPixelId);
    root.fbq("track", "PageView");
    pending.splice(0).forEach((event) => root.fbq("track", event));
  }

  // Lead (form sent) and Schedule (/agendado): sent only if the visitor accepted.
  root.DavTracking.track = (event) => {
    if (store.get("localStorage", CONSENT_STORE) !== "granted") return;
    if (root.fbq) root.fbq("track", event); else pending.push(event);
  };

  function choose(choice) {
    store.set("localStorage", CONSENT_STORE, choice);
    const banner = document.getElementById("cookie-banner");
    if (banner) banner.remove();
    if (choice === "granted") loadPixel();
  }

  function showBanner() {
    if (document.getElementById("cookie-banner")) return;
    const banner = document.createElement("div");
    banner.id = "cookie-banner";
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Preferências de cookies");
    banner.innerHTML =
      '<p>Usamos cookies da Meta para medir os nossos anúncios. Eles só são ativados se você aceitar. ' +
      '<a href="/privacidade/">Política de privacidade</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-choice="denied">Recusar</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-choice="granted">Aceitar</button>' +
      "</div>";
    banner.addEventListener("click", (e) => {
      const choice = e.target.getAttribute && e.target.getAttribute("data-choice");
      if (choice) choose(choice);
    });
    document.body.append(banner);
  }

  // Footer link "Preferências de cookies" reopens the banner
  root.DavTracking.reopen = () => {
    try { root.localStorage.removeItem(CONSENT_STORE); } catch { /* ignore */ }
    showBanner();
  };

  function start() {
    const choice = store.get("localStorage", CONSENT_STORE);
    if (choice === "granted") loadPixel();
    if (needsBanner(config.metaPixelId, choice)) showBanner();
    document.querySelectorAll("[data-cookie-prefs]").forEach((el) => {
      if (!config.metaPixelId) return; // nothing to manage yet
      el.hidden = false;
      el.addEventListener("click", (e) => { e.preventDefault(); root.DavTracking.reopen(); });
    });
    const event = document.body.getAttribute("data-track");
    if (event) root.DavTracking.track(event);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof window !== "undefined" ? window : globalThis);
