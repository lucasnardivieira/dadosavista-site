// Wires the quiz page to DavTeste (teste.js) and the lead form (Tally).
(function () {
  "use strict";

  const { QUESTIONS, score, band, tips, leadFields } = window.DavTeste;
  const config = window.DAV_CONFIG || {};
  const STORE_KEY = "dav_teste";
  const $ = (id) => document.getElementById(id);

  const answers = {};
  let step = 0;

  // Booking links
  document.querySelectorAll(".js-cal").forEach((a) => {
    if (config.calUrl) a.href = config.calUrl;
    a.target = "_blank";
    a.rel = "noopener";
  });

  // Saved answers (per browser, best effort): someone who already sent the form sees the result again.
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; }
  }
  function save(unlocked) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ answers, unlocked })); } catch { /* private mode */ }
  }

  function show(id) {
    for (const panel of ["quiz", "gate", "result"]) $(panel).hidden = panel !== id;
  }

  function renderQuestion(focus = true) {
    const q = QUESTIONS[step];
    $("q-progress").textContent = `Pergunta ${step + 1} de ${QUESTIONS.length}`;
    $("q-meter").style.width = `${(step / QUESTIONS.length) * 100}%`;
    $("q-text").textContent = q.text;
    $("q-back").hidden = step === 0;
    const list = $("q-options");
    list.replaceChildren(...q.options.map(([label, points]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = label;
      btn.setAttribute("aria-pressed", String(answers[q.key] === points));
      btn.addEventListener("click", () => choose(q.key, points));
      return btn;
    }));
    if (focus) list.firstChild.focus({ preventScroll: true });
  }

  function choose(key, points) {
    answers[key] = points;
    if (step < QUESTIONS.length - 1) {
      step += 1;
      renderQuestion();
    } else {
      save(false);
      show("gate");
      $("gate-open").focus({ preventScroll: true });
    }
  }

  function renderResult() {
    const total = score(answers);
    const b = band(total);
    $("r-score").textContent = String(total);
    $("r-meter").style.width = `${(total / 10) * 100}%`;
    $("r-meter-wrap").setAttribute("aria-label", `Nota ${total} de 10`);
    $("r-band").textContent = b.name;
    $("r-text").textContent = b.text;
    $("r-tips").replaceChildren(...tips(answers).map(([title, text], i) => {
      const li = document.createElement("li");
      li.className = "card tip";
      li.innerHTML = '<span class="tip-n"></span><h3></h3><p></p>';
      li.querySelector(".tip-n").textContent = String(i + 1);
      li.querySelector("h3").textContent = title;
      li.querySelector("p").textContent = text;
      return li;
    }));
    show("result");
  }

  function unlock() {
    save(true);
    renderResult();
    $("result").scrollIntoView({ block: "start" });
  }

  function openLeadForm() {
    if (!config.tallyFormId) { unlock(); return; }
    const open = () => window.Tally.openPopup(config.tallyFormId, {
      layout: "modal",
      width: 480,
      hiddenFields: {
        ...leadFields(answers),
        ...(window.DavTracking ? window.DavTracking.currentUtms() : {}),
      },
      onSubmit: () => {
        if (window.DavTracking) window.DavTracking.track("Lead");
        unlock();
      },
    });
    if (window.Tally) { open(); return; }
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.onload = open;
    script.onerror = unlock; // never leave the visitor stuck if Tally is blocked
    document.head.append(script);
  }

  function restart() {
    for (const key of Object.keys(answers)) delete answers[key];
    step = 0;
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    show("quiz");
    renderQuestion();
  }

  $("q-back").addEventListener("click", () => { step -= 1; renderQuestion(); });
  $("gate-open").addEventListener("click", openLeadForm);
  $("gate-back").addEventListener("click", () => { show("quiz"); renderQuestion(); });
  $("r-restart").addEventListener("click", restart);

  const saved = load();
  if (saved && saved.answers && score(saved.answers) !== null) {
    Object.assign(answers, saved.answers);
    step = QUESTIONS.length - 1;
    if (saved.unlocked) { renderResult(); return; }
    show("gate");
    return;
  }
  show("quiz");
  renderQuestion(false);
})();
