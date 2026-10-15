// Wires the calculator page to DavCalc (calc.js) and the lead form (Tally).
(function () {
  "use strict";

  const { CHANNELS, breakdown, minimumPrice, parseBRL } = window.DavCalc;
  const config = window.DAV_CONFIG || {};
  const UNLOCK_KEY = "dav_calc_unlocked";
  const $ = (id) => document.getElementById(id);

  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
  const num = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const COST_LABELS = [
    ["product", "Custo do produto", "--c-product"],
    ["commission", "Comissão do canal", "--c-commission"],
    ["fixedFee", "Taxa fixa", "--c-fixed"],
    ["payment", "Taxa de pagamento", "--c-payment"],
    ["shipping", "Frete", "--c-shipping"],
    ["tax", "Imposto", "--c-tax"],
    ["ads", "Anúncio", "--c-ads"],
  ];

  // Booking links
  document.querySelectorAll(".js-cal").forEach((a) => {
    if (config.calUrl) a.href = config.calUrl;
    a.target = "_blank";
    a.rel = "noopener";
  });

  // Channel select
  const channelSelect = $("channel");
  for (const [key, ch] of Object.entries(CHANNELS)) {
    channelSelect.add(new Option(ch.label, key));
  }

  function fillChannelFees(key) {
    const ch = CHANNELS[key];
    $("commission").value = num.format(ch.commissionPct * 100);
    $("payment").value = num.format(ch.paymentPct * 100);
    $("fixedFee").value = num.format(ch.fixedFee);
    $("fixedFeeBelow").value = Number.isFinite(ch.fixedFeeBelow) ? num.format(ch.fixedFeeBelow) : "";
  }

  function readInput() {
    const below = $("fixedFeeBelow").value.trim();
    return {
      price: parseBRL($("price").value),
      cost: parseBRL($("cost").value),
      shipping: parseBRL($("shipping").value),
      adsPerSale: parseBRL($("ads").value),
      taxPct: parseBRL($("tax").value) / 100,
      commissionPct: parseBRL($("commission").value) / 100,
      paymentPct: parseBRL($("payment").value) / 100,
      fixedFee: parseBRL($("fixedFee").value),
      // Empty threshold = the fixed fee applies to every price.
      fixedFeeBelow: below === "" ? Infinity : parseBRL(below),
    };
  }

  function renderResult(input) {
    const r = breakdown(input);
    const profitEl = $("profit");
    profitEl.textContent = brl.format(r.profit);
    profitEl.className = "result-value " + (r.profit >= 0 ? "is-profit" : "is-loss");
    $("margin").textContent = input.price > 0 ? `margem de ${pct.format(r.marginPct)}` : "";

    // Bar scaled to whatever is bigger: the price or the total costs.
    const scale = Math.max(input.price, r.totalCosts) || 1;
    const bar = $("bar");
    const legend = $("legend");
    bar.replaceChildren();
    legend.replaceChildren();

    for (const [key, label, color] of COST_LABELS) {
      const value = r.costs[key];
      if (value <= 0) continue;
      const seg = document.createElement("span");
      seg.style.width = `${(value / scale) * 100}%`;
      seg.style.background = `var(${color})`;
      seg.title = `${label}: ${brl.format(value)}`;
      bar.append(seg);
      legend.append(legendItem(label, value, `var(${color})`));
    }
    if (r.profit > 0) {
      const seg = document.createElement("span");
      seg.style.width = `${(r.profit / scale) * 100}%`;
      seg.style.background = "var(--profit)";
      bar.append(seg);
    } else if (input.price > 0) {
      // Costs run past the price: mark where the price ends.
      const mark = document.createElement("i");
      mark.className = "price-mark";
      mark.style.left = `${(input.price / scale) * 100}%`;
      mark.title = `Preço de venda: ${brl.format(input.price)}`;
      bar.append(mark);
    }
    const total = legendItem(r.profit >= 0 ? "Sobra" : "Prejuízo", r.profit,
      r.profit >= 0 ? "var(--profit)" : "var(--loss)");
    total.classList.add("total");
    legend.append(total);

    const verdict = $("verdict");
    if (input.price <= 0) {
      verdict.textContent = "Informe o preço de venda para começar.";
      verdict.className = "verdict";
    } else if (r.profit < 0) {
      verdict.textContent = `Cada venda tira ${brl.format(-r.profit)} do seu bolso. ` +
        "Quanto mais vende este produto neste canal, mais perde.";
      verdict.className = "verdict is-loss";
    } else {
      const biggest = COST_LABELS.filter(([k]) => k !== "product")
        .sort((a, b) => r.costs[b[0]] - r.costs[a[0]])[0];
      verdict.textContent = `Depois do custo do produto, o que mais pesa é: ${biggest[1].toLowerCase()} ` +
        `(${brl.format(r.costs[biggest[0]])} por venda).`;
      verdict.className = "verdict is-profit";
    }
  }

  function legendItem(label, value, color) {
    const li = document.createElement("li");
    li.innerHTML = '<span class="dot"></span><span class="name"></span><span class="val"></span>';
    li.querySelector(".dot").style.background = color;
    li.querySelector(".name").textContent = label;
    li.querySelector(".val").textContent = brl.format(value);
    return li;
  }

  function renderPro(input) {
    const target = parseBRL($("target").value) / 100;
    const min = minimumPrice(input, target);
    $("min-price").innerHTML = "";
    if (min === null) {
      $("min-price").textContent = "Com essas taxas, nenhum preço chega a essa margem neste canal.";
    } else {
      const strong = document.createElement("strong");
      strong.textContent = brl.format(min);
      $("min-price").append(
        `Preço mínimo para ter ${pct.format(target)} de margem neste canal:`, strong);
    }

    // Same product, same costs, each channel's default fees.
    const rows = Object.entries(CHANNELS)
      .filter(([key]) => key !== "outro")
      .map(([, ch]) => ({ label: ch.label, r: breakdown({ ...input, ...pick(ch) }) }))
      .sort((a, b) => b.r.profit - a.r.profit);
    $("compare").replaceChildren(...rows.map(({ label, r }) => {
      const tr = document.createElement("tr");
      const cls = r.profit >= 0 ? "profit" : "loss";
      tr.innerHTML = `<td></td><td class="num ${cls}"></td><td class="num ${cls}"></td>`;
      tr.cells[0].textContent = label;
      tr.cells[1].textContent = brl.format(r.profit);
      tr.cells[2].textContent = pct.format(r.marginPct);
      return tr;
    }));
  }

  function pick(ch) {
    return {
      commissionPct: ch.commissionPct,
      paymentPct: ch.paymentPct,
      fixedFee: ch.fixedFee,
      fixedFeeBelow: ch.fixedFeeBelow,
    };
  }

  function update() {
    const input = readInput();
    renderResult(input);
    renderPro(input);
  }

  // Lead gate
  function isUnlocked() {
    try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; }
  }

  function unlock() {
    try { localStorage.setItem(UNLOCK_KEY, "1"); } catch { /* private mode: unlock this visit only */ }
    $("pro-content").classList.remove("blurred");
    $("pro-content").removeAttribute("aria-hidden");
    $("gate").hidden = true;
  }

  function openLeadForm() {
    if (!config.tallyFormId) { unlock(); return; }
    const open = () => window.Tally.openPopup(config.tallyFormId, {
      layout: "modal",
      width: 480,
      hiddenFields: {
        origem: "calculadora",
        canal: channelSelect.value,
        preco: $("price").value,
      },
      onSubmit: unlock,
    });
    if (window.Tally) { open(); return; }
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.onload = open;
    script.onerror = unlock; // never leave the visitor stuck if Tally is blocked
    document.head.append(script);
  }

  $("unlock").addEventListener("click", openLeadForm);
  channelSelect.addEventListener("change", () => { fillChannelFees(channelSelect.value); update(); });
  document.querySelectorAll("#calc-form input, #target").forEach((el) => el.addEventListener("input", update));

  fillChannelFees(channelSelect.value);
  if (isUnlocked()) unlock();
  update();
})();
