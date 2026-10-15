// Margin math for the "Calculadora de margem real". Pure functions, no DOM, so it can be tested.
(function (root) {
  "use strict";

  // Approximate public fees; the page tells the seller to confirm them in their own account.
  const CHANNELS = {
    mercado_livre: {
      label: "Mercado Livre (clássico)",
      commissionPct: 0.14,
      fixedFee: 6.75,
      fixedFeeBelow: 79,
      paymentPct: 0,
    },
    shopee: {
      label: "Shopee",
      commissionPct: 0.14,
      fixedFee: 4,
      fixedFeeBelow: Infinity,
      paymentPct: 0,
    },
    nuvemshop: {
      label: "Loja própria (Nuvemshop)",
      commissionPct: 0,
      fixedFee: 0,
      fixedFeeBelow: 0,
      paymentPct: 0.0499,
    },
    outro: { label: "Outro canal", commissionPct: 0, fixedFee: 0, fixedFeeBelow: 0, paymentPct: 0 },
  };

  // Every value is per unit sold; percentages are fractions (0.14 = 14%).
  function breakdown(input) {
    const price = input.price;
    const costs = {
      product: input.cost,
      commission: price * input.commissionPct,
      fixedFee: price < input.fixedFeeBelow ? input.fixedFee : 0,
      payment: price * input.paymentPct,
      shipping: input.shipping,
      tax: price * input.taxPct,
      ads: input.adsPerSale,
    };
    const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
    const profit = price - totalCosts;
    return { costs, totalCosts, profit, marginPct: price > 0 ? profit / price : 0 };
  }

  // Lowest price (rounded up to the cent) that keeps `targetPct` of the price as profit.
  // Returns null when percentage costs alone already eat the whole price.
  function minimumPrice(input, targetPct) {
    const variablePct = input.commissionPct + input.paymentPct + input.taxPct + targetPct;
    if (variablePct >= 1) return null;
    const fixedCosts = input.cost + input.shipping + input.adsPerSale;
    const ceilCents = (x) => Math.ceil(x * 100 - 1e-9) / 100;

    const withoutFee = fixedCosts / (1 - variablePct);
    if (input.fixedFee === 0 || withoutFee >= input.fixedFeeBelow) return ceilCents(withoutFee);

    const withFee = (fixedCosts + input.fixedFee) / (1 - variablePct);
    // Above the threshold the fixed fee disappears, so the threshold itself already hits the target.
    return withFee < input.fixedFeeBelow ? ceilCents(withFee) : input.fixedFeeBelow;
  }

  // Accepts "1.234,56", "1234,56", "1234.56", "R$ 39,90". Empty or invalid -> 0.
  function parseBRL(text) {
    let s = String(text ?? "").replace(/[R$\s%]/g, "");
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  root.DavCalc = { CHANNELS, breakdown, minimumPrice, parseBRL };
})(typeof window !== "undefined" ? window : globalThis);
