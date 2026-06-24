(function () {
  const controls = {
    demandIntercept: document.getElementById("demand-intercept"),
    demandSlope: document.getElementById("demand-slope"),
    supplyIntercept: document.getElementById("supply-intercept"),
    supplySlope: document.getElementById("supply-slope"),
    tax: document.getElementById("tax")
  };

  const outputs = {
    demandIntercept: document.getElementById("demand-intercept-output"),
    demandSlope: document.getElementById("demand-slope-output"),
    supplyIntercept: document.getElementById("supply-intercept-output"),
    supplySlope: document.getElementById("supply-slope-output"),
    tax: document.getElementById("tax-output")
  };

  const defaults = {
    demandIntercept: 120,
    demandSlope: 0.95,
    supplyIntercept: 24,
    supplySlope: 0.75,
    tax: 18,
    taxSide: "sellers"
  };

  const statsGrid = document.getElementById("stats-grid");
  const intuitionBox = document.getElementById("intuition-box");
  const curveEquations = document.getElementById("curve-equations");
  const chart = document.getElementById("market-chart");
  const quizGrid = document.getElementById("quiz-grid");
  const resetButton = document.getElementById("reset-button");

  const fmt = {
    money: (value) => "$" + value.toFixed(2),
    quantity: (value) => value.toFixed(1),
    area: (value) => value.toFixed(0),
    pct: (value) => Math.round(value * 100) + "%"
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function niceCeil(value, step) {
    return Math.ceil(value / step) * step;
  }

  function getState() {
    return {
      demandIntercept: Number(controls.demandIntercept.value),
      demandSlope: Number(controls.demandSlope.value),
      supplyIntercept: Number(controls.supplyIntercept.value),
      supplySlope: Number(controls.supplySlope.value),
      tax: Number(controls.tax.value),
      taxSide: document.querySelector('input[name="tax-side"]:checked').value
    };
  }

  function setState(state) {
    controls.demandIntercept.value = state.demandIntercept;
    controls.demandSlope.value = state.demandSlope;
    controls.supplyIntercept.value = state.supplyIntercept;
    controls.supplySlope.value = state.supplySlope;
    controls.tax.value = state.tax;
    document.querySelectorAll('input[name="tax-side"]').forEach((input) => {
      input.checked = input.value === state.taxSide;
    });
  }

  function loadQueryState() {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return defaults;

    const next = { ...defaults };
    const mapping = {
      a: "demandIntercept",
      b: "demandSlope",
      c: "supplyIntercept",
      d: "supplySlope",
      t: "tax"
    };

    Object.entries(mapping).forEach(([key, prop]) => {
      if (!params.has(key)) return;
      const input = controls[prop];
      const value = Number(params.get(key));
      if (Number.isFinite(value)) {
        next[prop] = clamp(value, Number(input.min), Number(input.max));
      }
    });

    const side = params.get("side");
    if (side === "buyers" || side === "sellers") next.taxSide = side;

    return next;
  }

  function writeQueryState(state) {
    const params = new URLSearchParams();
    params.set("a", state.demandIntercept.toFixed(0));
    params.set("b", state.demandSlope.toFixed(2));
    params.set("c", state.supplyIntercept.toFixed(0));
    params.set("d", state.supplySlope.toFixed(2));
    params.set("t", state.tax.toFixed(0));
    params.set("side", state.taxSide);
    window.history.replaceState({}, "", "?" + params.toString());
  }

  function computeModel(state) {
    const a = state.demandIntercept;
    const b = state.demandSlope;
    const c = state.supplyIntercept;
    const d = state.supplySlope;
    const tax = state.tax;

    const qNoTax = Math.max(0, (a - c) / (b + d));
    const pNoTax = qNoTax > 0 ? a - b * qNoTax : 0;
    const qTax = Math.max(0, (a - c - tax) / (b + d));
    const buyerPrice = qTax > 0 ? a - b * qTax : 0;
    const sellerPrice = qTax > 0 ? buyerPrice - tax : 0;

    const csNoTax = 0.5 * Math.max(0, a - pNoTax) * qNoTax;
    const psNoTax = 0.5 * Math.max(0, pNoTax - c) * qNoTax;
    const totalNoTax = csNoTax + psNoTax;

    const consumerSurplus = 0.5 * Math.max(0, a - buyerPrice) * qTax;
    const producerSurplus = 0.5 * Math.max(0, sellerPrice - c) * qTax;
    const taxRevenue = tax * qTax;
    const totalWithTax = consumerSurplus + producerSurplus + taxRevenue;
    const deadweightLoss = Math.max(0, totalNoTax - totalWithTax);

    const buyerBurden = tax > 0 ? Math.max(0, buyerPrice - pNoTax) : 0;
    const sellerBurden = tax > 0 ? Math.max(0, pNoTax - sellerPrice) : 0;
    const buyerShare = tax > 0 ? buyerBurden / tax : 0;
    const sellerShare = tax > 0 ? sellerBurden / tax : 0;

    const demandElasticity = qNoTax > 0 ? Math.abs(pNoTax / (b * qNoTax)) : 0;
    const supplyElasticity = qNoTax > 0 ? Math.abs(pNoTax / (d * qNoTax)) : 0;

    return {
      ...state,
      qNoTax,
      pNoTax,
      qTax,
      buyerPrice,
      sellerPrice,
      consumerSurplus,
      producerSurplus,
      taxRevenue,
      deadweightLoss,
      totalNoTax,
      totalWithTax,
      buyerBurden,
      sellerBurden,
      buyerShare,
      sellerShare,
      demandElasticity,
      supplyElasticity
    };
  }

  function demandPrice(model, quantity) {
    return model.demandIntercept - model.demandSlope * quantity;
  }

  function supplyPrice(model, quantity) {
    return model.supplyIntercept + model.supplySlope * quantity;
  }

  function adjustedTaxPrice(model, quantity) {
    if (model.taxSide === "sellers") {
      return supplyPrice(model, quantity) + model.tax;
    }
    return demandPrice(model, quantity) - model.tax;
  }

  function pathPoints(points, x, y) {
    return points.map((point) => `${x(point[0]).toFixed(2)},${y(point[1]).toFixed(2)}`).join(" ");
  }

  function renderControls(state) {
    outputs.demandIntercept.value = `P choke price = ${fmt.money(state.demandIntercept)}`;
    outputs.demandSlope.value = `Each extra unit lowers willingness to pay by ${fmt.money(state.demandSlope)}`;
    outputs.supplyIntercept.value = `First unit costs ${fmt.money(state.supplyIntercept)}`;
    outputs.supplySlope.value = `Marginal cost rises by ${fmt.money(state.supplySlope)} per unit`;
    outputs.tax.value = `${fmt.money(state.tax)} per unit`;
  }

  function renderStats(model) {
    const taxLine = model.tax > 0
      ? `${fmt.money(model.buyerPrice)} paid, ${fmt.money(model.sellerPrice)} kept`
      : `${fmt.money(model.pNoTax)} paid and kept`;
    const incidenceLine = model.tax > 0
      ? `${fmt.pct(model.buyerShare)} buyers, ${fmt.pct(model.sellerShare)} sellers`
      : "No tax burden";

    statsGrid.innerHTML = `
      <div class="stat-block">
        <span class="stat-value">${fmt.quantity(model.qNoTax)}</span>
        <span class="stat-label">No-tax quantity at ${fmt.money(model.pNoTax)}</span>
      </div>
      <div class="stat-block">
        <span class="stat-value">${fmt.quantity(model.qTax)}</span>
        <span class="stat-label">Quantity with tax</span>
      </div>
      <div class="stat-block">
        <span class="stat-value">${taxLine}</span>
        <span class="stat-label">Buyer price and seller price</span>
      </div>
      <div class="stat-block">
        <span class="stat-value">${incidenceLine}</span>
        <span class="stat-label">Economic burden of the tax</span>
      </div>
      <div class="stat-block">
        <span class="stat-value">${fmt.area(model.taxRevenue)}</span>
        <span class="stat-label">Tax revenue</span>
      </div>
      <div class="stat-block">
        <span class="stat-value">${fmt.area(model.deadweightLoss)}</span>
        <span class="stat-label">Deadweight loss</span>
      </div>
    `;
  }

  function renderIntuition(model) {
    if (model.tax <= 0) {
      intuitionBox.textContent = `With no tax, the market clears where willingness to pay equals marginal cost: ${fmt.quantity(model.qNoTax)} units at ${fmt.money(model.pNoTax)}. Total surplus is the area between demand and supply up to the traded quantity.`;
      return;
    }

    const payer = model.taxSide === "sellers" ? "sellers" : "buyers";
    const biggerBurden = Math.abs(model.buyerShare - model.sellerShare) < 0.04
      ? "the burden is close to evenly split"
      : model.buyerShare > model.sellerShare
        ? "buyers bear more because demand is less responsive here"
        : "sellers bear more because supply is less responsive here";

    intuitionBox.textContent = `Collecting the ${fmt.money(model.tax)} tax from ${payer} creates a wedge between what buyers pay and sellers keep. Quantity falls from ${fmt.quantity(model.qNoTax)} to ${fmt.quantity(model.qTax)}, and ${biggerBurden}. The statutory side changes the bookkeeping, not the competitive equilibrium.`;
  }

  function renderEquations(model) {
    const adjusted = model.taxSide === "sellers"
      ? `Tax-inclusive supply: P = ${(model.supplyIntercept + model.tax).toFixed(0)} + ${model.supplySlope.toFixed(2)}Q`
      : `Tax-adjusted demand: P = ${(model.demandIntercept - model.tax).toFixed(0)} - ${model.demandSlope.toFixed(2)}Q`;
    curveEquations.textContent = `Demand: P = ${model.demandIntercept.toFixed(0)} - ${model.demandSlope.toFixed(2)}Q. Supply: P = ${model.supplyIntercept.toFixed(0)} + ${model.supplySlope.toFixed(2)}Q. ${adjusted}.`;
  }

  function renderChart(model) {
    const width = 780;
    const height = 520;
    const margin = { left: 70, right: 28, top: 28, bottom: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const xMax = niceCeil(Math.max(70, model.qNoTax * 1.65, model.qTax * 1.9), 20);
    const yAtX = Math.max(
      model.demandIntercept,
      model.supplyIntercept + model.supplySlope * xMax + model.tax,
      model.buyerPrice + model.tax + 10,
      90
    );
    const yMax = niceCeil(yAtX, 25);

    const x = (quantity) => margin.left + (quantity / xMax) * plotWidth;
    const y = (price) => margin.top + ((yMax - price) / yMax) * plotHeight;
    const q0 = model.qNoTax;
    const qt = model.qTax;
    const p0 = model.pNoTax;
    const pb = model.buyerPrice;
    const ps = model.sellerPrice;

    const demandEnd = demandPrice(model, xMax);
    const supplyEnd = supplyPrice(model, xMax);
    const adjustedEnd = adjustedTaxPrice(model, xMax);
    const adjustedStart = adjustedTaxPrice(model, 0);

    const tickX = [0, xMax / 2, xMax];
    const tickY = [0, yMax / 2, yMax];
    const areaParts = [];

    if (qt > 0) {
      areaParts.push(`<polygon class="area-cs" points="${pathPoints([[0, model.demandIntercept], [0, pb], [qt, pb]], x, y)}"></polygon>`);
      areaParts.push(`<polygon class="area-ps" points="${pathPoints([[0, model.supplyIntercept], [0, ps], [qt, ps]], x, y)}"></polygon>`);
      if (model.tax > 0) {
        areaParts.push(`<polygon class="area-tax" points="${pathPoints([[0, pb], [qt, pb], [qt, ps], [0, ps]], x, y)}"></polygon>`);
      }
    }

    if (model.deadweightLoss > 0.01 && q0 > qt) {
      areaParts.push(`<polygon class="area-dwl" points="${pathPoints([[qt, demandPrice(model, qt)], [qt, supplyPrice(model, qt)], [q0, p0]], x, y)}"></polygon>`);
    }

    const taxLabel = model.taxSide === "sellers" ? "S + tax" : "D - tax";
    const taxPriceGuides = model.tax > 0 && qt > 0
      ? `
        <line class="guide-line" x1="${margin.left}" y1="${y(pb)}" x2="${x(qt)}" y2="${y(pb)}"></line>
        <line class="guide-line" x1="${margin.left}" y1="${y(ps)}" x2="${x(qt)}" y2="${y(ps)}"></line>
        <line class="guide-line" x1="${x(qt)}" y1="${y(pb)}" x2="${x(qt)}" y2="${margin.top + plotHeight}"></line>
        <line class="wedge-line" x1="${x(qt)}" y1="${y(pb)}" x2="${x(qt)}" y2="${y(ps)}"></line>
        <circle class="tax-point" cx="${x(qt)}" cy="${y(pb)}" r="5"></circle>
        <circle class="tax-point" cx="${x(qt)}" cy="${y(ps)}" r="5"></circle>
        <text class="point-label" x="${x(qt) + 9}" y="${y(pb) - 8}">P buyers</text>
        <text class="point-label" x="${x(qt) + 9}" y="${y(ps) + 18}">P sellers</text>
        <text class="point-label" x="${x(qt) + 9}" y="${margin.top + plotHeight - 10}">Q with tax</text>
      `
      : `
        <line class="guide-line" x1="${x(q0)}" y1="${y(p0)}" x2="${x(q0)}" y2="${margin.top + plotHeight}"></line>
        <line class="guide-line" x1="${margin.left}" y1="${y(p0)}" x2="${x(q0)}" y2="${y(p0)}"></line>
      `;

    chart.innerHTML = `
      <title id="chart-title">Supply and demand diagram with tax wedge and welfare areas</title>
      <desc id="chart-desc">The chart updates as model inputs change, showing demand, supply, equilibrium quantity, buyer price, seller price, surplus areas, tax revenue, and deadweight loss.</desc>
      <defs>
        <clipPath id="chart-clip">
          <rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}"></rect>
        </clipPath>
      </defs>
      <rect x="${margin.left}" y="${margin.top}" width="${plotWidth}" height="${plotHeight}" fill="#ffffff"></rect>

      ${tickX.map((tick) => `<line class="grid-line" x1="${x(tick)}" y1="${margin.top}" x2="${x(tick)}" y2="${margin.top + plotHeight}"></line>`).join("")}
      ${tickY.map((tick) => `<line class="grid-line" x1="${margin.left}" y1="${y(tick)}" x2="${margin.left + plotWidth}" y2="${y(tick)}"></line>`).join("")}

      <g clip-path="url(#chart-clip)">
        ${areaParts.join("")}
        <line class="demand-line" x1="${x(0)}" y1="${y(model.demandIntercept)}" x2="${x(xMax)}" y2="${y(demandEnd)}"></line>
        <line class="supply-line" x1="${x(0)}" y1="${y(model.supplyIntercept)}" x2="${x(xMax)}" y2="${y(supplyEnd)}"></line>
        ${model.tax > 0 ? `<line class="tax-adjusted-line" x1="${x(0)}" y1="${y(adjustedStart)}" x2="${x(xMax)}" y2="${y(adjustedEnd)}"></line>` : ""}
        <line class="guide-line" x1="${x(q0)}" y1="${y(p0)}" x2="${x(q0)}" y2="${margin.top + plotHeight}"></line>
        <circle class="eq-point" cx="${x(q0)}" cy="${y(p0)}" r="5"></circle>
        ${taxPriceGuides}
      </g>

      <line class="axis" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"></line>
      <line class="axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}"></line>

      ${tickX.map((tick) => `<text class="tick-label" x="${x(tick)}" y="${height - 26}" text-anchor="middle">${tick.toFixed(0)}</text>`).join("")}
      ${tickY.map((tick) => `<text class="tick-label" x="${margin.left - 12}" y="${y(tick) + 4}" text-anchor="end">${tick.toFixed(0)}</text>`).join("")}

      <text class="axis-label" x="${margin.left + plotWidth / 2}" y="${height - 6}" text-anchor="middle">Quantity</text>
      <text class="axis-label" x="18" y="${margin.top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 18 ${margin.top + plotHeight / 2})">Price</text>
      <text class="curve-label" x="${x(Math.min(xMax * 0.74, Math.max(12, xMax * 0.52)))}" y="${y(demandPrice(model, Math.min(xMax * 0.74, Math.max(12, xMax * 0.52)))) - 10}">Demand</text>
      <text class="curve-label" x="${x(xMax * 0.64)}" y="${y(supplyPrice(model, xMax * 0.64)) - 10}">Supply</text>
      ${model.tax > 0 ? `<text class="curve-label" x="${x(xMax * 0.54)}" y="${y(adjustedTaxPrice(model, xMax * 0.54)) + 20}">${taxLabel}</text>` : ""}
      <text class="point-label" x="${x(q0) + 9}" y="${y(p0) + 4}">No-tax equilibrium</text>
    `;
  }

  function burdenAnswer(model) {
    if (model.tax <= 0) return "No one bears tax burden because the tax is zero.";
    if (Math.abs(model.buyerShare - model.sellerShare) < 0.04) return "The burden is approximately split.";
    return model.buyerShare > model.sellerShare ? "Buyers bear more." : "Sellers bear more.";
  }

  function quizItems(model) {
    const burden = burdenAnswer(model);
    const revenueFallsIfTaxRaised = model.tax > 0 && model.qTax > 0 && model.tax > (model.demandIntercept - model.supplyIntercept) / 2;
    const sideText = model.taxSide === "sellers" ? "sellers" : "buyers";

    return [
      {
        title: "Incidence",
        question: "Who bears more of the tax burden in the current market?",
        choices: [
          burden,
          sideText === "sellers" ? "Sellers, because they write the check." : "Buyers, because they write the check.",
          "The side with the flatter curve always bears more.",
          "No burden exists unless quantity falls to zero."
        ],
        correct: 0,
        explain: model.tax <= 0
          ? "A zero tax creates no wedge, so there is no incidence to allocate."
          : `Incidence follows relative responsiveness, not legal assignment. Here the buyer share is ${fmt.pct(model.buyerShare)} and the seller share is ${fmt.pct(model.sellerShare)}.`
      },
      {
        title: "Statutory Side",
        question: `If the same tax were collected from ${sideText === "sellers" ? "buyers" : "sellers"} instead, what would change in this competitive model?`,
        choices: [
          "The graph label changes, but prices, quantity, and total burden do not.",
          "Quantity rises because the other side is now legally responsible.",
          "Deadweight loss disappears.",
          "The full burden shifts to the newly taxed side."
        ],
        correct: 0,
        explain: "With competitive supply and demand, a per-unit tax creates the same wedge either way. Legal assignment changes remittance, not the economic incidence."
      },
      {
        title: "Welfare",
        question: revenueFallsIfTaxRaised
          ? "Why can raising this tax further reduce tax revenue?"
          : "What creates the deadweight loss triangle?",
        choices: revenueFallsIfTaxRaised
          ? [
              "The tax base shrinks as quantity falls.",
              "Consumer surplus is counted twice.",
              "Producer surplus becomes negative by definition.",
              "The demand curve stops sloping downward."
            ]
          : [
              "Mutually beneficial trades between the taxed and no-tax quantities no longer happen.",
              "The government collects revenue.",
              "Buyers pay a higher price.",
              "Sellers receive a lower price."
            ],
        correct: 0,
        explain: revenueFallsIfTaxRaised
          ? "Revenue is tax times quantity. Once the tax is high enough, the lost units can dominate the higher tax per remaining unit."
          : "Deadweight loss is the surplus from trades that would have occurred without the tax but are not worth doing once the wedge is imposed."
      }
    ];
  }

  function renderQuiz(model) {
    const items = quizItems(model);
    quizGrid.innerHTML = items.map((item, itemIndex) => `
      <article class="quiz-card">
        <h3>${item.title}</h3>
        <p>${item.question}</p>
        <div class="choice-list">
          ${item.choices.map((choice, choiceIndex) => `
            <button class="choice-button" type="button" data-item="${itemIndex}" data-choice="${choiceIndex}">${choice}</button>
          `).join("")}
        </div>
        <p class="feedback" id="feedback-${itemIndex}" aria-live="polite"></p>
      </article>
    `).join("");

    quizGrid.querySelectorAll(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        const itemIndex = Number(button.dataset.item);
        const choiceIndex = Number(button.dataset.choice);
        const item = items[itemIndex];
        const card = button.closest(".quiz-card");
        card.querySelectorAll(".choice-button").forEach((choiceButton) => {
          choiceButton.classList.remove("is-correct", "is-incorrect");
        });

        if (choiceIndex === item.correct) {
          button.classList.add("is-correct");
          document.getElementById(`feedback-${itemIndex}`).textContent = item.explain;
        } else {
          button.classList.add("is-incorrect");
          card.querySelector(`[data-choice="${item.correct}"]`).classList.add("is-correct");
          document.getElementById(`feedback-${itemIndex}`).textContent = item.explain;
        }
      });
    });
  }

  function renderAll() {
    const state = getState();
    const model = computeModel(state);
    renderControls(state);
    renderStats(model);
    renderIntuition(model);
    renderEquations(model);
    renderChart(model);
    renderQuiz(model);
    writeQueryState(state);
  }

  Object.values(controls).forEach((input) => input.addEventListener("input", renderAll));
  document.querySelectorAll('input[name="tax-side"]').forEach((input) => input.addEventListener("change", renderAll));
  resetButton.addEventListener("click", () => {
    setState(defaults);
    renderAll();
  });

  setState(loadQueryState());
  renderAll();
})();
