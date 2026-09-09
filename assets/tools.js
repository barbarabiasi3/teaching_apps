(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const topicList = [
    ["reservation-prices-demand", "Reservation Prices to Demand", "Build a demand curve from willingness-to-pay data."],
    ["consumer-surplus", "Consumer Surplus", "Move price and see who buys and how much surplus remains."],
    ["market-equilibrium-welfare", "Market Equilibrium and Welfare", "Shift supply and demand and track surplus."],
    ["elasticity-explorer", "Elasticity Explorer", "Compare slope, elasticity, and revenue along demand."],
    ["tax-incidence", "Tax Incidence", "Compare per-unit and percent taxes, burden, revenue, and deadweight loss."],
    ["externalities-pigouvian-taxes", "Externalities and Pigouvian Taxes", "Compare private incentives with the social optimum."],
    ["gains-from-trade", "Gains from Trade", "Use opportunity costs to find comparative advantage and trade terms."],
    ["tariffs-trade-policy", "Tariffs and Trade Policy", "Show how tariffs create winners, losers, revenue, and deadweight loss."],
    ["cost-curves-firm-supply", "Cost Curves and Firm Supply", "Connect cost curves to output, profit, and shutdown logic."],
    ["cost-minimization", "Cost Minimization", "Choose labor and capital while comparing marginal product per dollar."],
    ["perfect-competition-entry", "Perfect Competition and Entry", "See short-run profit and long-run entry pressure."],
    ["monopoly-pricing", "Monopoly Pricing", "Choose quantity against demand, marginal revenue, and marginal cost."],
    ["inverse-elasticity-pricing", "Inverse Elasticity Pricing Rule", "Translate elasticity into optimal markup intuition."],
    ["single-unit-price-discrimination", "Demographic Price Discrimination", "Compare segment demand curves and monopoly prices."],
    ["two-part-tariffs", "Two-Part Tariffs", "Set usage and membership fees to extract surplus."],
    ["quantity-screening-menu-pricing", "Quantity Screening and Menu Pricing", "Design menus that make types self-select."],
    ["self-selection-price-discrimination", "Self-Selection Price Discrimination", "Use a golf-course menu to test participation and incentive compatibility."],
    ["risk-aversion-insurance", "Uncertainty and Risk Preferences", "Compare expected value, certainty equivalent, and willingness to pay to avoid risk."],
    ["adverse-selection-lemons", "Adverse Selection and Lemons", "Change price and watch hidden types enter or exit."],
    ["signaling-screening", "Signaling and Screening", "Use warranties or deductibles to separate hidden types."],
    ["moral-hazard-principal-agent", "Moral Hazard and Principal-Agent", "Set incentives and predict hidden effort."],
    ["dominant-strategies", "Dominant Strategies", "Highlight dominant and dominated strategies in payoff matrices."],
    ["nash-equilibrium-finder", "Nash Equilibrium Finder", "Mark best responses and find Nash equilibria."],
    ["coordination-games", "Coordination Games", "Explore multiple equilibria and coordination failure."],
    ["sequential-games-backward-induction", "Sequential Games and Backward Induction", "Solve a game tree from the end backward."],
    ["price-competition-games", "Price Competition Games", "Let two firms choose prices and compare best responses."]
  ];

  const fmt = {
    money: (v) => "$" + Number(v).toFixed(2),
    wholeMoney: (v) => "$" + Number(v).toFixed(0),
    number: (v, d = 1) => Number(v).toFixed(d),
    int: (v) => Math.round(Number(v)).toString(),
    pct: (v) => Math.round(Number(v) * 100) + "%"
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function safePositive(value) {
    return Math.max(0, Number(value));
  }

  function html(strings, ...values) {
    return strings.reduce((out, str, i) => out + str + (values[i] ?? ""), "");
  }

  function range(id, label, min, max, step, value, help) {
    return { type: "range", id, label, min, max, step, value, help };
  }

  function select(id, label, value, options) {
    return { type: "select", id, label, value, options };
  }

  function segmented(id, label, value, options) {
    return { type: "segmented", id, label, value, options };
  }

  function makeStat(value, label) {
    return { value, label };
  }

  const chartScales = {
    demand: { xMax: 350, yMax: 200 },
    market: { xMax: 200, yMax: 250 },
    tax: { xMax: 200, yMax: 300 },
    externality: { xMax: 200, yMax: 300 },
    tradePolicy: { xMax: 200, yMax: 250 },
    firm: { xMax: 140, yMax: 180 },
    monopoly: { xMax: 360, yMax: 200 },
    twoPart: { xMax: 250, yMax: 160 },
    risk: { xMax: 1200, yMax: 1 },
    trade: { xMax: 700, yMax: 3200 },
    costMin: { xMax: 140, yMax: 180 },
    signaling: { xMax: 5, yMax: 4000 },
    priceGame: { xMax: 130, yMax: 130 }
  };

  function chart(width, height, body, extraClass = "") {
    return `<svg class="market-chart mini-chart ${extraClass}" viewBox="0 0 ${width} ${height}" role="img">${body}</svg>`;
  }

  function niceTicks(max, targetCount = 5) {
    const rawStep = max / targetCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
    const ticks = [];
    for (let value = 0; value <= max + 1e-6; value += step) {
      ticks.push(Number(value.toFixed(6)));
    }
    if (ticks[ticks.length - 1] !== max && max / step <= targetCount + 1) ticks.push(max);
    return ticks;
  }

  function axisNumber(value) {
    if (Number.isInteger(value)) return String(value);
    return Number(value).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  function frame(width, height, xMax, yMax, options = {}) {
    const margin = { l: 58, r: 22, t: 24, b: 42 };
    const w = width - margin.l - margin.r;
    const h = height - margin.t - margin.b;
    const x = (v) => clamp(margin.l + (v / xMax) * w, margin.l, margin.l + w);
    const y = (v) => clamp(margin.t + ((yMax - v) / yMax) * h, margin.t, margin.t + h);
    const xTicks = options.xTicks || niceTicks(xMax, 5);
    const yTicks = options.yTicks || niceTicks(yMax, 5);
    const tickMarks = html`
      ${xTicks.map((tick) => html`
        <line class="grid-line" x1="${x(tick)}" y1="${margin.t}" x2="${x(tick)}" y2="${margin.t + h}"></line>
        <line class="tick-mark" x1="${x(tick)}" y1="${margin.t + h}" x2="${x(tick)}" y2="${margin.t + h + 5}"></line>
        <text class="tick-label" x="${x(tick)}" y="${margin.t + h + 20}" text-anchor="middle">${axisNumber(tick)}</text>
      `).join("")}
      ${yTicks.map((tick) => html`
        <line class="grid-line" x1="${margin.l}" y1="${y(tick)}" x2="${margin.l + w}" y2="${y(tick)}"></line>
        <line class="tick-mark" x1="${margin.l - 5}" y1="${y(tick)}" x2="${margin.l}" y2="${y(tick)}"></line>
        <text class="tick-label" x="${margin.l - 10}" y="${y(tick) + 4}" text-anchor="end">${axisNumber(tick)}</text>
      `).join("")}
    `;
    const axis = html`
      ${tickMarks}
      <line class="axis" x1="${margin.l}" y1="${margin.t + h}" x2="${margin.l + w}" y2="${margin.t + h}"></line>
      <line class="axis" x1="${margin.l}" y1="${margin.t}" x2="${margin.l}" y2="${margin.t + h}"></line>
      <text class="axis-label" x="${margin.l + w / 2}" y="${height - 8}" text-anchor="middle">${options.xLabel || "Quantity"}</text>
      <text class="axis-label" x="16" y="${margin.t + h / 2}" text-anchor="middle" transform="rotate(-90 16 ${margin.t + h / 2})">${options.yLabel || "Price"}</text>
    `;
    return { margin, w, h, x, y, axis, xMax, yMax };
  }

  function domainFrame(width, height, xMin, xMax, yMin, yMax, options = {}) {
    const margin = { l: 58, r: 22, t: 24, b: 42 };
    const w = width - margin.l - margin.r;
    const h = height - margin.t - margin.b;
    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;
    const x = (v) => clamp(margin.l + ((v - xMin) / xSpan) * w, margin.l, margin.l + w);
    const y = (v) => clamp(margin.t + ((yMax - v) / ySpan) * h, margin.t, margin.t + h);
    const xTicks = options.xTicks || niceTicks(xMax, 5).filter((tick) => tick >= xMin);
    const yTicks = options.yTicks || niceTicks(yMax, 5).filter((tick) => tick >= yMin);
    const tickMarks = html`
      ${xTicks.map((tick) => html`
        <line class="grid-line" x1="${x(tick)}" y1="${margin.t}" x2="${x(tick)}" y2="${margin.t + h}"></line>
        <line class="tick-mark" x1="${x(tick)}" y1="${margin.t + h}" x2="${x(tick)}" y2="${margin.t + h + 5}"></line>
        <text class="tick-label" x="${x(tick)}" y="${margin.t + h + 20}" text-anchor="middle">${axisNumber(tick)}</text>
      `).join("")}
      ${yTicks.map((tick) => html`
        <line class="grid-line" x1="${margin.l}" y1="${y(tick)}" x2="${margin.l + w}" y2="${y(tick)}"></line>
        <line class="tick-mark" x1="${margin.l - 5}" y1="${y(tick)}" x2="${margin.l}" y2="${y(tick)}"></line>
        <text class="tick-label" x="${margin.l - 10}" y="${y(tick) + 4}" text-anchor="end">${axisNumber(tick)}</text>
      `).join("")}
    `;
    const axis = html`
      ${tickMarks}
      <line class="axis" x1="${margin.l}" y1="${margin.t + h}" x2="${margin.l + w}" y2="${margin.t + h}"></line>
      <line class="axis" x1="${margin.l}" y1="${margin.t}" x2="${margin.l}" y2="${margin.t + h}"></line>
      <text class="axis-label" x="${margin.l + w / 2}" y="${height - 8}" text-anchor="middle">${options.xLabel || "Quantity"}</text>
      <text class="axis-label" x="16" y="${margin.t + h / 2}" text-anchor="middle" transform="rotate(-90 16 ${margin.t + h / 2})">${options.yLabel || "Price"}</text>
    `;
    return { margin, w, h, x, y, axis, xMin, xMax, yMin, yMax };
  }

  function linePath(points, f) {
    return points.map((p) => `${f.x(p[0]).toFixed(2)},${f.y(p[1]).toFixed(2)}`).join(" ");
  }

  function sampledPath(xMin, xMax, count, yValue, f) {
    return Array.from({ length: count }, (_, i) => {
      const x = xMin + (xMax - xMin) * i / (count - 1);
      return `${i === 0 ? "M" : "L"}${f.x(x).toFixed(2)} ${f.y(yValue(x)).toFixed(2)}`;
    }).join(" ");
  }

  function chartKey(items) {
    return html`
      <div class="chart-key">
        ${items.map((item) => `<span><i class="key-swatch ${item.className}" aria-hidden="true"></i>${item.label}</span>`).join("")}
      </div>
    `;
  }

  function linearDemand(a, b, q) {
    return a - b * q;
  }

  function linearSupply(c, d, q) {
    return c + d * q;
  }

  function solveLinearMarket(a, b, c, d) {
    const q = Math.max(0, (a - c) / (b + d));
    const p = a - b * q;
    return { q, p };
  }

  function linearAreas(a, b, c, d) {
    const eq = solveLinearMarket(a, b, c, d);
    return {
      ...eq,
      cs: 0.5 * Math.max(0, a - eq.p) * eq.q,
      ps: 0.5 * Math.max(0, eq.p - c) * eq.q,
      total: 0.5 * Math.max(0, a - c) * eq.q
    };
  }

  function linearSupplyDemandChart(a, b, c, d, extras = "") {
    const eq = solveLinearMarket(a, b, c, d);
    const { xMax, yMax } = chartScales.market;
    const f = frame(760, 420, xMax, yMax);
    const demandEnd = Math.min(xMax, a / b);
    const csPoints = linePath([[0, a], [0, eq.p], [eq.q, eq.p]], f);
    const psPoints = linePath([[0, c], [0, eq.p], [eq.q, eq.p]], f);
    const demandLabelQ = Math.min(demandEnd * 0.72, xMax * 0.72);
    const supplyLabelQ = xMax * 0.56;
    return chart(760, 420, html`
      ${f.axis}
      <polygon class="area-cs" points="${csPoints}"></polygon>
      <polygon class="area-ps" points="${psPoints}"></polygon>
      <line class="demand-line" x1="${f.x(0)}" y1="${f.y(a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(a, b, demandEnd)))}"></line>
      <line class="supply-line" x1="${f.x(0)}" y1="${f.y(c)}" x2="${f.x(xMax)}" y2="${f.y(linearSupply(c, d, xMax))}"></line>
      <line class="guide-line" x1="${f.x(eq.q)}" y1="${f.y(eq.p)}" x2="${f.x(eq.q)}" y2="${f.margin.t + f.h}"></line>
      <line class="guide-line" x1="${f.margin.l}" y1="${f.y(eq.p)}" x2="${f.x(eq.q)}" y2="${f.y(eq.p)}"></line>
      <circle class="eq-point" cx="${f.x(eq.q)}" cy="${f.y(eq.p)}" r="5"></circle>
      <text class="curve-label" x="${f.x(demandLabelQ)}" y="${f.y(linearDemand(a, b, demandLabelQ)) - 8}">Demand</text>
      <text class="curve-label" x="${f.x(supplyLabelQ)}" y="${f.y(linearSupply(c, d, supplyLabelQ)) - 8}">Supply</text>
      ${extras}
    `);
  }

  function demandOnlyChart(a, b, price, extras = "") {
    const q = Math.max(0, (a - price) / b);
    const { xMax, yMax } = chartScales.demand;
    const f = frame(720, 380, xMax, yMax);
    const csPoints = linePath([[0, a], [0, price], [q, price]], f);
    const revenuePoints = linePath([[0, 0], [q, 0], [q, price], [0, price]], f);
    const demandEnd = Math.min(xMax, a / b);
    const demandLabelQ = Math.min(demandEnd * 0.72, xMax * 0.72);
    return chart(720, 380, html`
      ${f.axis}
      <polygon class="area-revenue" points="${revenuePoints}"></polygon>
      <polygon class="area-cs" points="${csPoints}"></polygon>
      <line class="demand-line" x1="${f.x(0)}" y1="${f.y(a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(a, b, demandEnd)))}"></line>
      <line class="guide-line" x1="${f.margin.l}" y1="${f.y(price)}" x2="${f.x(q)}" y2="${f.y(price)}"></line>
      <line class="guide-line" x1="${f.x(q)}" y1="${f.y(price)}" x2="${f.x(q)}" y2="${f.margin.t + f.h}"></line>
      <circle class="eq-point" cx="${f.x(q)}" cy="${f.y(price)}" r="5"></circle>
      <text class="curve-label" x="${f.x(demandLabelQ)}" y="${f.y(linearDemand(a, b, demandLabelQ)) - 8}">Demand</text>
      ${extras}
    `);
  }

  function payoffMatrix(title, rowLabels, colLabels, cells, highlights = []) {
    const highlightSet = new Set(highlights);
    return html`
      <div class="matrix-wrap">
        <h3>${title}</h3>
        <table class="payoff-matrix">
          <thead><tr><th></th>${colLabels.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>
            ${rowLabels.map((r, i) => `
              <tr>
                <th>${r}</th>
                ${colLabels.map((c, j) => `<td class="${highlightSet.has(`${i}-${j}`) ? "is-highlighted" : ""}">${cells[i][j][0]}, ${cells[i][j][1]}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function bestResponses(cells) {
    const rows = cells.length;
    const cols = cells[0].length;
    const rowBest = [];
    const colBest = [];
    for (let j = 0; j < cols; j += 1) {
      const max = Math.max(...cells.map((row) => row[j][0]));
      for (let i = 0; i < rows; i += 1) if (cells[i][j][0] === max) rowBest.push(`${i}-${j}`);
    }
    for (let i = 0; i < rows; i += 1) {
      const max = Math.max(...cells[i].map((cell) => cell[1]));
      for (let j = 0; j < cols; j += 1) if (cells[i][j][1] === max) colBest.push(`${i}-${j}`);
    }
    const rowSet = new Set(rowBest);
    return colBest.filter((key) => rowSet.has(key));
  }

  function renderQuiz(items, container) {
    container.innerHTML = items.map((item, i) => html`
      <article class="quiz-card">
        <h3>${item.title}</h3>
        <p>${item.question}</p>
        <div class="choice-list">
          ${item.choices.map((choice, j) => `<button class="choice-button" type="button" data-item="${i}" data-choice="${j}">${choice}</button>`).join("")}
        </div>
        <p class="feedback" id="feedback-${i}" aria-live="polite"></p>
      </article>
    `).join("");
    container.querySelectorAll(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        const itemIndex = Number(button.dataset.item);
        const choiceIndex = Number(button.dataset.choice);
        const item = items[itemIndex];
        const card = button.closest(".quiz-card");
        card.querySelectorAll(".choice-button").forEach((b) => b.classList.remove("is-correct", "is-incorrect"));
        const correctButton = card.querySelector(`[data-choice="${item.correct}"]`);
        correctButton.classList.add("is-correct");
        if (choiceIndex !== item.correct) button.classList.add("is-incorrect");
        document.getElementById(`feedback-${itemIndex}`).textContent = item.explain;
      });
    });
  }

  function commonQuiz(answer, contrast, explain) {
    return [
      {
        title: "Core Idea",
        question: "What should you watch first in this tool?",
        choices: [answer, contrast, "Only the largest number on the screen", "Whether the graph uses dollars"],
        correct: 0,
        explain
      }
    ];
  }

  const tools = {
    "reservation-prices-demand": {
      title: "Reservation Prices to Demand",
      subtitle: "Demand starts as a list of people with different maximum willingness to pay.",
      controls: [
        range("price", "Ticket price", 1000, 9000, 250, 5000),
        select("market", "Sample market", "vacation", [["vacation", "MBA vacation"], ["precheck", "TSA PreCheck"], ["software", "Software license"]])
      ],
      render(s) {
        const samples = {
          vacation: [9000, 8500, 7400, 7000, 6100, 5600, 5000, 4600, 3900, 3100, 2500, 1500],
          precheck: [190, 165, 150, 140, 125, 110, 95, 80, 70, 55, 40, 25],
          software: [600, 540, 500, 430, 390, 350, 300, 260, 210, 160, 120, 80]
        };
        const values = samples[s.market];
        const price = Number(s.price);
        const scale = s.market === "vacation" ? 1 : s.market === "precheck" ? 45 : 14;
        const adjustedPrice = price / scale;
        const buyers = values.filter((v) => v >= adjustedPrice);
        const cs = buyers.reduce((sum, v) => sum + v - adjustedPrice, 0) * scale;
        const max = Math.max(...values);
        const lineY = 270 - 220 * adjustedPrice / max;
        const bars = values.map((v, i) => {
          const h = 220 * v / max;
          const x = 62 + i * 47;
          if (v < adjustedPrice) return `<rect class="bar-out" x="${x}" y="${270 - h}" width="28" height="${h}"></rect>`;
          const top = 270 - h;
          const surplusHeight = Math.max(0, lineY - top);
          const revenueHeight = Math.max(0, 270 - lineY);
          return html`
            <rect class="area-revenue" x="${x}" y="${lineY}" width="28" height="${revenueHeight}"></rect>
            <rect class="area-cs" x="${x}" y="${top}" width="28" height="${surplusHeight}"></rect>
            <rect class="bar-outline" x="${x}" y="${top}" width="28" height="${h}"></rect>
          `;
        }).join("");
        return {
          visualTitle: "Sorted Willingness to Pay",
          visualNote: "Each bar is one potential buyer. Bars above the price line buy.",
          visual: chart(700, 330, html`
            <line class="axis" x1="45" y1="270" x2="650" y2="270"></line>
            <line class="axis" x1="45" y1="40" x2="45" y2="270"></line>
            ${bars}
            <line class="tax-adjusted-line" x1="45" y1="${lineY}" x2="650" y2="${lineY}"></line>
            <text class="point-label" x="52" y="${lineY - 8}">Price</text>
          `),
          stats: [makeStat(buyers.length, "Buyers"), makeStat(values.length - buyers.length, "Non-buyers"), makeStat(fmt.wholeMoney(cs), "Consumer surplus"), makeStat(fmt.wholeMoney(adjustedPrice * buyers.length * scale), "Revenue")],
          intuition: "A demand curve is just sorted willingness to pay. Lower the price and more people clear their personal cutoff.",
          quiz: commonQuiz("Which bars sit above the price line", "The names of the consumers", "Demand is built from buyers whose reservation prices exceed the market price.")
        };
      }
    },

    "consumer-surplus": {
      title: "Consumer Surplus",
      subtitle: "Consumer surplus is the gap between willingness to pay and the price actually paid.",
      controls: [range("a", "Maximum willingness to pay", 80, 160, 5, 120), range("b", "Demand slope", 0.6, 2.0, 0.1, 1.0), range("price", "Price", 10, 110, 5, 50)],
      render(s) {
        const q = Math.max(0, (s.a - s.price) / s.b);
        const cs = 0.5 * Math.max(0, s.a - s.price) * q;
        return {
          visualTitle: "Consumer Surplus Area",
          visualNote: "Blue area is value buyers keep after paying the market price.",
          visual: demandOnlyChart(s.a, s.b, s.price),
          stats: [makeStat(fmt.number(q), "Units sold"), makeStat(fmt.money(s.price), "Price"), makeStat(fmt.wholeMoney(cs), "Consumer surplus"), makeStat(fmt.wholeMoney(s.price * q), "Revenue")],
          intuition: "Raising price collects more per buyer but excludes low-value buyers and shrinks the surplus area.",
          quiz: commonQuiz("The area below demand and above price", "The whole rectangle of revenue", "Consumer surplus is value above the price, not total spending.")
        };
      }
    },

    "market-equilibrium-welfare": {
      title: "Market Equilibrium and Welfare",
      subtitle: "Equilibrium finds the price where quantity demanded equals quantity supplied.",
      controls: [range("a", "Demand intercept", 80, 160, 5, 120), range("b", "Demand slope", 0.5, 1.8, 0.1, 1.0), range("c", "Supply intercept", 0, 60, 5, 25), range("d", "Supply slope", 0.4, 1.6, 0.1, 0.8)],
      render(s) {
        const m = linearAreas(s.a, s.b, s.c, s.d);
        return {
          visualTitle: "Competitive Equilibrium",
          visualNote: "The intersection determines price, quantity, and the surplus split.",
          visual: linearSupplyDemandChart(s.a, s.b, s.c, s.d),
          stats: [makeStat(fmt.money(m.p), "Equilibrium price"), makeStat(fmt.number(m.q), "Equilibrium quantity"), makeStat(fmt.wholeMoney(m.cs), "Consumer surplus"), makeStat(fmt.wholeMoney(m.ps), "Producer surplus")],
          intuition: "At the competitive price, every mutually beneficial trade occurs: willingness to pay is at least marginal cost up to Q*.",
          quiz: commonQuiz("The intersection of supply and demand", "The highest point on demand", "Equilibrium is where buyers and sellers agree on the quantity traded.")
        };
      }
    },

    "elasticity-explorer": {
      title: "Elasticity Explorer",
      subtitle: "Slope and elasticity are related, but not the same object.",
      controls: [range("a", "Demand intercept", 100, 180, 5, 140), range("b", "Demand slope", 0.5, 2.0, 0.1, 1.0), range("price", "Current price", 20, 120, 5, 70)],
      render(s) {
        const q = Math.max(0.1, (s.a - s.price) / s.b);
        const e = Math.abs(s.price / (s.b * q));
        const revenue = s.price * q;
        const region = e > 1 ? "elastic" : e < 1 ? "inelastic" : "unit elastic";
        const revenueEffect = e > 1.05
          ? "lowers revenue locally because quantity responds strongly"
          : e < 0.95
            ? "raises revenue locally because quantity does not respond much"
            : "leaves revenue roughly unchanged because the percentage effects offset";
        return {
          visualTitle: "Point Elasticity on Demand",
          visualNote: "Move price along the same line and elasticity changes.",
          visual: demandOnlyChart(s.a, s.b, s.price),
          stats: [makeStat(fmt.number(q), "Quantity"), makeStat(fmt.number(e, 2), "Elasticity magnitude"), makeStat(region, "Region"), makeStat(fmt.wholeMoney(revenue), "Revenue")],
          intuition: `At this point demand is ${region}. A price increase ${revenueEffect}.`,
          quiz: commonQuiz("The percentage response of quantity to price", "The visual steepness alone", "Elasticity depends on both slope and the point on the curve.")
        };
      }
    },

    "tax-incidence": {
      title: "Tax Incidence",
      subtitle: "A tax creates a wedge between what buyers pay and sellers keep.",
      controls: [
        range("a", "Maximum willingness to pay", 95, 150, 1, 120),
        range("b", "Demand slope", 0.45, 1.7, 0.05, 0.95),
        range("c", "Supply intercept", 0, 45, 1, 24),
        range("d", "Supply slope", 0.35, 1.6, 0.05, 0.75),
        segmented("taxType", "Tax type", "unit", [["unit", "Per-unit"], ["percent", "Percent"]]),
        range("tax", "Tax amount", 0, 45, 1, 18),
        segmented("side", "Tax collected from", "sellers", [["sellers", "Sellers"], ["buyers", "Buyers"]])
      ],
      render(s) {
        const base = linearAreas(s.a, s.b, s.c, s.d);
        const isPercent = s.taxType === "percent";
        const tau = isPercent ? s.tax / 100 : 0;
        const unit = isPercent ? 0 : s.tax;
        let qTax;
        if (isPercent) qTax = Math.max(0, (s.a - (1 + tau) * s.c) / (s.b + (1 + tau) * s.d));
        else qTax = Math.max(0, (s.a - s.c - unit) / (s.b + s.d));
        const pb = s.a - s.b * qTax;
        const ps = isPercent ? pb / (1 + tau || 1) : pb - unit;
        const wedge = Math.max(0, pb - ps);
        const cs = 0.5 * Math.max(0, s.a - pb) * qTax;
        const psur = 0.5 * Math.max(0, ps - s.c) * qTax;
        const rev = wedge * qTax;
        const dwl = Math.max(0, base.total - cs - psur - rev);
        const buyerShare = wedge > 0 ? Math.max(0, pb - base.p) / wedge : 0;
        const sellerShare = wedge > 0 ? Math.max(0, base.p - ps) / wedge : 0;
        const label = isPercent ? (s.side === "sellers" ? "S x (1 + tax)" : "D / (1 + tax)") : (s.side === "sellers" ? "S + tax" : "D - tax");
        const { xMax, yMax } = chartScales.tax;
        const f = frame(760, 420, xMax, yMax);
        const adjustedY0 = isPercent ? (s.side === "sellers" ? (1 + tau) * s.c : s.a / (1 + tau || 1)) : (s.side === "sellers" ? s.c + unit : s.a - unit);
        const adjustedY1 = isPercent ? (s.side === "sellers" ? (1 + tau) * linearSupply(s.c, s.d, xMax) : linearDemand(s.a, s.b, xMax) / (1 + tau || 1)) : (s.side === "sellers" ? linearSupply(s.c, s.d, xMax) + unit : linearDemand(s.a, s.b, xMax) - unit);
        const body = html`
          ${f.axis}
          <polygon class="area-cs" points="${linePath([[0, s.a], [0, pb], [qTax, pb]], f)}"></polygon>
          <polygon class="area-ps" points="${linePath([[0, s.c], [0, ps], [qTax, ps]], f)}"></polygon>
          <polygon class="area-tax" points="${linePath([[0, pb], [qTax, pb], [qTax, ps], [0, ps]], f)}"></polygon>
          <polygon class="area-dwl" points="${linePath([[qTax, pb], [qTax, ps], [base.q, base.p]], f)}"></polygon>
          <line class="demand-line" x1="${f.x(0)}" y1="${f.y(s.a)}" x2="${f.x(xMax)}" y2="${f.y(linearDemand(s.a, s.b, xMax))}"></line>
          <line class="supply-line" x1="${f.x(0)}" y1="${f.y(s.c)}" x2="${f.x(xMax)}" y2="${f.y(linearSupply(s.c, s.d, xMax))}"></line>
          <line class="tax-adjusted-line" x1="${f.x(0)}" y1="${f.y(adjustedY0)}" x2="${f.x(xMax)}" y2="${f.y(adjustedY1)}"></line>
          <line class="wedge-line" x1="${f.x(qTax)}" y1="${f.y(pb)}" x2="${f.x(qTax)}" y2="${f.y(ps)}"></line>
          <circle class="tax-point" cx="${f.x(qTax)}" cy="${f.y(pb)}" r="5"></circle>
          <circle class="tax-point" cx="${f.x(qTax)}" cy="${f.y(ps)}" r="5"></circle>
          <circle class="eq-point" cx="${f.x(base.q)}" cy="${f.y(base.p)}" r="5"></circle>
          <text class="curve-label" x="${f.x(58)}" y="${f.y(adjustedY0 + (adjustedY1 - adjustedY0) * 0.58) - 8}">${label}</text>
        `;
        return {
          visualTitle: "Tax Wedge and Welfare",
          visualNote: isPercent ? "A percent tax multiplies the relevant curve instead of shifting it by a fixed dollar amount." : "A per-unit tax shifts the relevant curve by the same dollar amount at every quantity.",
          visual: chart(760, 420, body),
          stats: [makeStat(fmt.number(base.q), "No-tax quantity"), makeStat(fmt.number(qTax), "Quantity with tax"), makeStat(`${fmt.money(pb)} paid, ${fmt.money(ps)} kept`, "Buyer price and seller price"), makeStat(`${fmt.pct(buyerShare)} buyers, ${fmt.pct(sellerShare)} sellers`, "Economic burden"), makeStat(fmt.wholeMoney(rev), "Tax revenue"), makeStat(fmt.wholeMoney(dwl), "Deadweight loss")],
          intuition: `${isPercent ? "The percent tax" : "The per-unit tax"} creates a wedge of ${fmt.money(wedge)} at the traded quantity. The side that is less responsive bears more of the burden; legal collection changes remittance, not incidence.`,
          quiz: [
            { title: "Tax Type", question: "What is different about a percent tax?", choices: ["It multiplies the relevant curve by the tax factor.", "It always creates zero deadweight loss.", "It puts the full burden on whoever pays the bill.", "It has no effect on quantity."], correct: 0, explain: "A percent tax is ad valorem: the wedge grows with price, so the curve is scaled rather than shifted by a constant amount." }
          ]
        };
      }
    }
  };

  function addRemainingTools() {
    Object.assign(tools, {
      "externalities-pigouvian-taxes": simpleExternalityTool(),
      "gains-from-trade": tradeTool(),
      "tariffs-trade-policy": tariffTool(),
      "cost-curves-firm-supply": costCurveTool(),
      "cost-minimization": costMinTool(),
      "perfect-competition-entry": perfectCompetitionTool(),
      "monopoly-pricing": monopolyTool(),
      "inverse-elasticity-pricing": ieprTool(),
      "single-unit-price-discrimination": singleUnitPdTool(),
      "two-part-tariffs": twoPartTool(),
      "quantity-screening-menu-pricing": menuPricingTool(),
      "self-selection-price-discrimination": selfSelectionPdTool(),
      "risk-aversion-insurance": riskTool(),
      "adverse-selection-lemons": lemonsTool(),
      "signaling-screening": signalingTool(),
      "moral-hazard-principal-agent": moralHazardTool(),
      "dominant-strategies": dominantTool(),
      "nash-equilibrium-finder": nashTool(),
      "coordination-games": coordinationTool(),
      "sequential-games-backward-induction": sequentialTool(),
      "price-competition-games": priceCompetitionTool()
    });
  }

  function simpleExternalityTool() {
    return {
      title: "Externalities and Pigouvian Taxes",
      subtitle: "Private decisions miss costs or benefits imposed on others.",
      controls: [range("a", "Demand intercept", 100, 180, 5, 140), range("c", "Private supply intercept", 5, 60, 5, 25), range("mec", "External cost per unit", 0, 50, 5, 25), range("tax", "Policy tax", 0, 50, 5, 20)],
      render(s) {
        const b = 1, d = 0.8;
        const privateEq = solveLinearMarket(s.a, b, s.c, d);
        const socialEq = solveLinearMarket(s.a, b, s.c + s.mec, d);
        const policyEq = solveLinearMarket(s.a, b, s.c + s.tax, d);
        const overproduction = Math.max(0, privateEq.q - socialEq.q);
        const dwl = 0.5 * s.mec * overproduction;
        const { xMax, yMax } = chartScales.externality;
        const f = frame(760, 420, xMax, yMax);
        const demandEnd = Math.min(xMax, s.a / b);
        const demandLabelQ = Math.min(demandEnd * 0.72, xMax * 0.72);
        const dwlShape = dwl > 0 ? `<polygon class="area-dwl" points="${linePath([[socialEq.q, socialEq.p], [privateEq.q, privateEq.p], [privateEq.q, privateEq.p + s.mec]], f)}"></polygon>` : "";
        const visual = chart(760, 420, html`
          ${f.axis}
          ${dwlShape}
          <line class="demand-line" x1="${f.x(0)}" y1="${f.y(s.a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(s.a, b, demandEnd)))}"></line>
          <line class="supply-line" x1="${f.x(0)}" y1="${f.y(s.c)}" x2="${f.x(xMax)}" y2="${f.y(linearSupply(s.c, d, xMax))}"></line>
          <line class="tax-adjusted-line" x1="${f.x(0)}" y1="${f.y(s.c + s.mec)}" x2="${f.x(xMax)}" y2="${f.y(s.c + s.mec + d * xMax)}"></line>
          <line class="policy-line" x1="${f.x(0)}" y1="${f.y(s.c + s.tax)}" x2="${f.x(xMax)}" y2="${f.y(s.c + s.tax + d * xMax)}"></line>
          <circle class="eq-point" cx="${f.x(privateEq.q)}" cy="${f.y(privateEq.p)}" r="5"></circle>
          <circle class="tax-point" cx="${f.x(socialEq.q)}" cy="${f.y(socialEq.p)}" r="5"></circle>
          <circle class="tax-point" cx="${f.x(policyEq.q)}" cy="${f.y(policyEq.p)}" r="4"></circle>
          <text class="curve-label" x="${f.x(demandLabelQ)}" y="${f.y(linearDemand(s.a, b, demandLabelQ)) - 8}">Demand</text>
          <text class="curve-label" x="${f.x(xMax * 0.48)}" y="${f.y(linearSupply(s.c, d, xMax * 0.48)) - 8}">Private MC</text>
          <text class="curve-label" x="${f.x(xMax * 0.52)}" y="${f.y(s.c + s.mec + d * xMax * 0.52) - 8}">Social MC</text>
          <text class="curve-label" x="${f.x(xMax * 0.18)}" y="${f.y(s.c + s.tax + d * xMax * 0.18) - 8}">Policy tax</text>
        `);
        return { visualTitle: "Private vs Social Cost", visualNote: "The Pigouvian tax tries to move private choices to the social-cost curve.", visual, stats: [makeStat(fmt.number(privateEq.q), "Private quantity"), makeStat(fmt.number(socialEq.q), "Social optimum"), makeStat(fmt.number(policyEq.q), "Quantity with policy"), makeStat(fmt.wholeMoney(dwl), "Overproduction DWL"), makeStat(fmt.money(Math.abs(s.tax - s.mec)), "Tax gap from Pigouvian rate")], intuition: "When production creates external costs, the private market trades too much. A tax equal to the marginal external cost aligns private and social incentives.", quiz: commonQuiz("Compare private marginal cost with social marginal cost", "Only compare consumer surplus with revenue", "Externalities are about costs or benefits outside the buyer-seller transaction.") };
      }
    };
  }

  function tradeTool() {
    return {
      title: "Gains from Trade",
      subtitle: "Comparative advantage depends on opportunity cost, not absolute advantage.",
      controls: [range("hs", "Home syrup max", 200, 800, 50, 600), range("ho", "Home oil max", 1000, 3500, 100, 3000), range("fs", "Foreign syrup max", 100, 600, 50, 400), range("fo", "Foreign oil max", 100, 1000, 50, 400), range("homeShare", "Home autarky syrup share", 0, 100, 5, 35), range("foreignShare", "Foreign autarky syrup share", 0, 100, 5, 50), range("terms", "Oil per syrup in trade", 0.5, 6, 0.1, 3), range("trade", "Syrup traded", 0, 600, 25, 200)],
      render(s) {
        const homeOcS = s.ho / s.hs;
        const foreignOcS = s.fo / s.fs;
        const homeSyrupAdv = homeOcS < foreignOcS;
        const syrupExporter = homeSyrupAdv ? "home" : "foreign";
        const oilExporter = homeSyrupAdv ? "foreign" : "home";
        const goodTerms = s.terms > Math.min(homeOcS, foreignOcS) && s.terms < Math.max(homeOcS, foreignOcS);
        const maxTrade = syrupExporter === "home" ? Math.min(s.hs, s.fo / s.terms) : Math.min(s.fs, s.ho / s.terms);
        const traded = clamp(s.trade, 0, Math.max(0, maxTrade));
        const homeAutarky = { syrup: s.hs * s.homeShare / 100, oil: s.ho * (1 - s.homeShare / 100) };
        const foreignAutarky = { syrup: s.fs * s.foreignShare / 100, oil: s.fo * (1 - s.foreignShare / 100) };
        const homeProd = syrupExporter === "home" ? { syrup: s.hs, oil: 0 } : { syrup: 0, oil: s.ho };
        const foreignProd = syrupExporter === "foreign" ? { syrup: s.fs, oil: 0 } : { syrup: 0, oil: s.fo };
        const homeCons = syrupExporter === "home"
          ? { syrup: s.hs - traded, oil: traded * s.terms }
          : { syrup: traded, oil: s.ho - traded * s.terms };
        const foreignCons = syrupExporter === "foreign"
          ? { syrup: s.fs - traded, oil: traded * s.terms }
          : { syrup: traded, oil: s.fo - traded * s.terms };
        const ownOilAt = (bundle, syrupMax, oilMax) => oilMax * Math.max(0, 1 - bundle.syrup / syrupMax);
        const homeOutside = homeCons.oil > ownOilAt(homeCons, s.hs, s.ho) + 1;
        const foreignOutside = foreignCons.oil > ownOilAt(foreignCons, s.fs, s.fo) + 1;
        const { xMax, yMax } = chartScales.trade;
        const f = frame(760, 420, xMax, yMax, { xLabel: "Maple syrup", yLabel: "Oil", xTicks: [0, 200, 400, 600], yTicks: [0, 800, 1600, 2400, 3200] });
        const drawBundle = (point, cls, label, dx = 8, dy = -10) => html`
          <circle class="${cls}" cx="${f.x(point.syrup)}" cy="${f.y(point.oil)}" r="5"></circle>
          <text class="point-label" x="${f.x(point.syrup) + dx}" y="${f.y(point.oil) + dy}">${label}</text>
        `;
        const homeLine = linePath([[0, s.ho], [s.hs, 0]], f);
        const foreignLine = linePath([[0, s.fo], [s.fs, 0]], f);
        const homeTradeLine = syrupExporter === "home"
          ? linePath([[s.hs, 0], [Math.max(0, s.hs - maxTrade), maxTrade * s.terms]], f)
          : linePath([[0, s.ho], [maxTrade, Math.max(0, s.ho - maxTrade * s.terms)]], f);
        const foreignTradeLine = syrupExporter === "foreign"
          ? linePath([[s.fs, 0], [Math.max(0, s.fs - maxTrade), maxTrade * s.terms]], f)
          : linePath([[0, s.fo], [maxTrade, Math.max(0, s.fo - maxTrade * s.terms)]], f);
        const visual = chart(760, 420, html`
          ${f.axis}
          <polyline class="demand-line no-fill" points="${homeLine}"></polyline>
          <polyline class="supply-line no-fill" points="${foreignLine}"></polyline>
          <polyline class="trade-line no-fill" points="${homeTradeLine}"></polyline>
          <polyline class="trade-line no-fill" points="${foreignTradeLine}"></polyline>
          ${drawBundle(homeAutarky, "eq-point", "Home autarky")}
          ${drawBundle(foreignAutarky, "good-point", "Foreign autarky", 8, 12)}
          ${drawBundle(homeProd, "tax-point", "Home production", 8, homeProd.oil > yMax * 0.82 ? 18 : -10)}
          ${drawBundle(foreignProd, "tax-point", "Foreign production", 8, foreignProd.oil > yMax * 0.82 ? 18 : -10)}
          ${drawBundle(homeCons, "eq-point", "Home consumes", 8, -18)}
          ${drawBundle(foreignCons, "good-point", "Foreign consumes", 8, -20)}
          <text class="curve-label" x="${f.x(Math.min(s.hs * 0.55, xMax * 0.7))}" y="${f.y(s.ho * (1 - Math.min(s.hs * 0.55, xMax * 0.7) / s.hs)) - 8}">Home PPF</text>
          <text class="curve-label" x="${f.x(Math.min(s.fs * 0.2, xMax * 0.25))}" y="${f.y(s.fo * 0.82) - 8}">Foreign PPF</text>
        `);
        return {
          visualTitle: "PPFs and Post-Trade Consumption",
          visualNote: "The dashed trade lines show what each country can consume after specializing and trading.",
          visual,
          stats: [makeStat(fmt.number(homeOcS, 2), "Home OC of syrup"), makeStat(fmt.number(foreignOcS, 2), "Foreign OC of syrup"), makeStat(`${syrupExporter === "home" ? "Home" : "Foreign"}: syrup`, "Comparative advantage"), makeStat(goodTerms ? "Mutually attractive" : "Not between OCs", "Terms of trade"), makeStat(fmt.number(traded), "Syrup actually traded"), makeStat(homeOutside && foreignOutside ? "Both outside" : homeOutside ? "Home only" : foreignOutside ? "Foreign only" : "No", "Consumes outside own PPF")],
          intuition: `${syrupExporter === "home" ? "Home" : "Foreign"} gives up less oil to make syrup, so it specializes in syrup while ${oilExporter === "home" ? "Home" : "Foreign"} specializes in oil. Trade is powerful when the exchange rate sits between their opportunity costs.`,
          quiz: commonQuiz("Opportunity cost and post-trade consumption", "Absolute advantage alone", "The central question is what each side gives up to produce one more unit, then whether trade lets them consume beyond autarky.")
        };
      }
    };
  }

  function tariffTool() {
    return {
      title: "Tariffs and Trade Policy",
      subtitle: "A tariff raises domestic price and reallocates surplus.",
      controls: [range("a", "Domestic demand intercept", 100, 180, 5, 140), range("c", "Domestic supply intercept", 0, 70, 5, 30), range("world", "World price", 20, 100, 5, 55), range("tariff", "Tariff", 0, 50, 5, 20)],
      render(s) {
        const b = 1, d = 0.8;
        const p = s.world + s.tariff;
        const qd = Math.max(0, (s.a - p) / b);
        const qs = Math.max(0, (p - s.c) / d);
        const qdWorld = Math.max(0, (s.a - s.world) / b);
        const qsWorld = Math.max(0, (s.world - s.c) / d);
        const imports = Math.max(0, qd - qs);
        const revenue = imports * s.tariff;
        const { xMax, yMax } = chartScales.tradePolicy;
        const f = frame(760, 420, xMax, yMax);
        const demandEnd = Math.min(xMax, s.a / b);
        const demandLabelQ = Math.min(demandEnd * 0.72, xMax * 0.72);
        const csPoints = linePath([[0, s.a], [0, p], [qd, p]], f);
        const psPoints = linePath([[0, s.c], [0, p], [qs, p]], f);
        const revenueShape = imports > 0 ? `<polygon class="area-revenue" points="${linePath([[qs, s.world], [qd, s.world], [qd, p], [qs, p]], f)}"></polygon>` : "";
        const prodDwlShape = imports > 0 && qs > qsWorld ? `<polygon class="area-dwl" points="${linePath([[qsWorld, s.world], [qsWorld, p], [qs, p]], f)}"></polygon>` : "";
        const consDwlShape = imports > 0 && qdWorld > qd ? `<polygon class="area-dwl" points="${linePath([[qd, p], [qdWorld, p], [qdWorld, s.world]], f)}"></polygon>` : "";
        const visual = chart(760, 420, html`
          ${f.axis}
          <polygon class="area-cs" points="${csPoints}"></polygon>
          <polygon class="area-ps" points="${psPoints}"></polygon>
          ${revenueShape}
          ${prodDwlShape}
          ${consDwlShape}
          <line class="demand-line" x1="${f.x(0)}" y1="${f.y(s.a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(s.a, b, demandEnd)))}"></line>
          <line class="supply-line" x1="${f.x(0)}" y1="${f.y(s.c)}" x2="${f.x(xMax)}" y2="${f.y(linearSupply(s.c, d, xMax))}"></line>
          <line class="guide-line" x1="${f.margin.l}" y1="${f.y(s.world)}" x2="${f.x(qdWorld)}" y2="${f.y(s.world)}"></line>
          <line class="tax-adjusted-line" x1="${f.margin.l}" y1="${f.y(p)}" x2="${f.x(qd)}" y2="${f.y(p)}"></line>
          <line class="guide-line" x1="${f.x(qs)}" y1="${f.y(p)}" x2="${f.x(qs)}" y2="${f.margin.t + f.h}"></line>
          <line class="guide-line" x1="${f.x(qd)}" y1="${f.y(p)}" x2="${f.x(qd)}" y2="${f.margin.t + f.h}"></line>
          <text class="curve-label" x="${f.x(demandLabelQ)}" y="${f.y(linearDemand(s.a, b, demandLabelQ)) + 18}">Demand</text>
          <text class="curve-label" x="${f.x(xMax * 0.78)}" y="${f.y(linearSupply(s.c, d, xMax * 0.78)) - 8}">Supply</text>
          <text class="point-label" x="${f.margin.l + 10}" y="${f.y(p) - 8}">Price with tariff</text>
          <text class="point-label" x="${f.margin.l + 10}" y="${f.y(s.world) + 18}">World price</text>
        `);
        return { visualTitle: "Import Market with Tariff", visualNote: "The tariff lifts the domestic price above the world price and creates revenue plus deadweight loss.", visual, stats: [makeStat(fmt.money(p), "Domestic price"), makeStat(fmt.number(qd), "Domestic demand"), makeStat(fmt.number(qs), "Domestic supply"), makeStat(fmt.number(imports), "Imports"), makeStat(fmt.wholeMoney(revenue), "Tariff revenue")], intuition: "Consumers lose from the higher price; domestic producers gain; government collects revenue; some surplus is destroyed.", quiz: commonQuiz("Consumers, producers, government, and deadweight loss", "Only domestic producers", "Tariff analysis tracks winners, losers, revenue, and destroyed gains from trade.") };
      }
    };
  }

  function costCurveTool() {
    return {
      title: "Cost Curves and Firm Supply",
      subtitle: "A competitive firm's supply decision comes from marginal cost.",
      controls: [range("fixed", "Fixed cost", 0, 500, 25, 200), range("base", "Base variable cost", 5, 50, 1, 20), range("curvature", "Rising cost", 0.1, 2.0, 0.1, 0.8), range("price", "Market price", 5, 120, 5, 60)],
      render(s) {
        const q = Math.max(0, (s.price - s.base) / (2 * s.curvature));
        const vc = s.base * q + s.curvature * q * q;
        const profit = s.price * q - vc - s.fixed;
        const shutdown = s.price < s.base;
        const atcAtQ = q > 0 ? (vc + s.fixed) / q : s.base + s.fixed;
        const mc = (x) => s.base + 2 * s.curvature * x;
        const atc = (x) => s.base + s.curvature * x + s.fixed / Math.max(1, x);
        const { xMax, yMax } = chartScales.firm;
        const f = frame(720, 380, xMax, yMax);
        const mcPath = Array.from({ length: 32 }, (_, i) => {
          const x = xMax * i / 31;
          return `${i === 0 ? "M" : "L"}${f.x(x).toFixed(2)} ${f.y(mc(x)).toFixed(2)}`;
        }).join(" ");
        const atcPath = Array.from({ length: 32 }, (_, i) => {
          const x = Math.max(1, xMax * i / 31);
          return `${i === 0 ? "M" : "L"}${f.x(x).toFixed(2)} ${f.y(atc(x)).toFixed(2)}`;
        }).join(" ");
        const profitRect = q > 0 ? `<polygon class="${profit >= 0 ? "area-profit" : "area-loss"}" points="${linePath([[0, Math.min(s.price, atcAtQ)], [q, Math.min(s.price, atcAtQ)], [q, Math.max(s.price, atcAtQ)], [0, Math.max(s.price, atcAtQ)]], f)}"></polygon>` : "";
        const body = chart(720, 380, html`
          ${f.axis}
          ${profitRect}
          <path class="supply-line no-fill" d="${mcPath}"></path>
          <path class="demand-line no-fill" d="${atcPath}"></path>
          <line class="tax-adjusted-line" x1="${f.margin.l}" y1="${f.y(s.price)}" x2="${f.margin.l + f.w}" y2="${f.y(s.price)}"></line>
          <line class="guide-line" x1="${f.x(q)}" y1="${f.y(s.price)}" x2="${f.x(q)}" y2="${f.margin.t + f.h}"></line>
          <circle class="eq-point" cx="${f.x(q)}" cy="${f.y(s.price)}" r="5"></circle>
          <text class="curve-label" x="${f.x(xMax * 0.72)}" y="${f.y(mc(xMax * 0.72)) - 8}">MC</text>
          <text class="curve-label" x="${f.x(xMax * 0.36)}" y="${f.y(atc(xMax * 0.36)) - 8}">ATC</text>
        `);
        return { visualTitle: "Marginal Cost and Price", visualNote: "Produce until price equals marginal cost, unless price is below avoidable cost.", visual: body, stats: [makeStat(fmt.number(q), "Output"), makeStat(fmt.wholeMoney(profit), "Economic profit"), makeStat(shutdown ? "Shut down" : "Operate", "Short-run decision"), makeStat(fmt.money(s.base), "Minimum AVC")], intuition: shutdown ? "Price is below avoidable cost, so producing would make operating losses worse." : "The firm produces where price meets marginal cost; fixed cost matters for profit but not the short-run output choice.", quiz: commonQuiz("Compare price with marginal cost and avoidable cost", "Compare price only with fixed cost", "Fixed costs affect profit, but not whether the next unit is worth producing.") };
      }
    };
  }

  function costMinTool() {
    return {
      title: "Cost Minimization",
      subtitle: "Cost minimization balances marginal product per dollar across inputs.",
      controls: [range("wage", "Wage", 10, 80, 5, 35), range("rental", "Capital rental rate", 10, 100, 5, 50), range("target", "Output target", 20, 120, 5, 70), range("labor", "Chosen labor", 5, 120, 5, 50)],
      render(s) {
        const alpha = 0.55;
        const kNeeded = Math.pow(s.target / Math.pow(s.labor, alpha), 1 / (1 - alpha));
        const cost = s.wage * s.labor + s.rental * kNeeded;
        const mplDollar = alpha * s.target / s.labor / s.wage;
        const mpkDollar = (1 - alpha) * s.target / kNeeded / s.rental;
        const ratio = ((1 - alpha) * s.wage) / (alpha * s.rental);
        const optLabor = s.target / Math.pow(ratio, 1 - alpha);
        const optCapital = ratio * optLabor;
        const minCost = s.wage * optLabor + s.rental * optCapital;
        const excessCost = Math.max(0, cost - minCost);
        const advise = mplDollar > mpkDollar ? "Use more labor, less capital" : "Use more capital, less labor";
        const { xMax, yMax } = chartScales.costMin;
        const f = frame(720, 380, xMax, yMax, { xLabel: "Labor", yLabel: "Capital", xTicks: [0, 35, 70, 105, 140], yTicks: [0, 45, 90, 135, 180] });
        const isoquantPath = sampledPath(Math.max(1, s.target / Math.pow(yMax, 1 - alpha)), xMax, 70, (labor) => Math.pow(s.target / Math.pow(labor, alpha), 1 / (1 - alpha)), f);
        const currentIsocost = linePath([[0, cost / s.rental], [Math.min(xMax, cost / s.wage), Math.max(0, (cost - s.wage * Math.min(xMax, cost / s.wage)) / s.rental)]], f);
        const optimalIsocost = linePath([[0, minCost / s.rental], [Math.min(xMax, minCost / s.wage), Math.max(0, (minCost - s.wage * Math.min(xMax, minCost / s.wage)) / s.rental)]], f);
        const visual = chart(720, 380, html`
          ${f.axis}
          <path class="demand-line no-fill" d="${isoquantPath}"></path>
          <polyline class="trade-line no-fill" points="${currentIsocost}"></polyline>
          <polyline class="supply-line no-fill" points="${optimalIsocost}"></polyline>
          <line class="guide-line" x1="${f.x(s.labor)}" y1="${f.y(kNeeded)}" x2="${f.x(s.labor)}" y2="${f.margin.t + f.h}"></line>
          <line class="guide-line" x1="${f.x(optLabor)}" y1="${f.y(optCapital)}" x2="${f.x(optLabor)}" y2="${f.margin.t + f.h}"></line>
          <circle class="tax-point" cx="${f.x(s.labor)}" cy="${f.y(kNeeded)}" r="5"></circle>
          <circle class="eq-point" cx="${f.x(optLabor)}" cy="${f.y(optCapital)}" r="5"></circle>
          <text class="curve-label" x="${f.x(xMax * 0.58)}" y="${f.y(Math.pow(s.target / Math.pow(xMax * 0.58, alpha), 1 / (1 - alpha))) - 10}">Isoquant</text>
          <text class="point-label" x="${f.x(s.labor) + 8}" y="${f.y(kNeeded) - 10}">Chosen mix</text>
          <text class="point-label" x="${f.x(optLabor) + 8}" y="${f.y(optCapital) + 18}">Cost minimum</text>
        `);
        return { visualTitle: "Isoquant and Isocost", visualNote: "The cost-minimizing input mix is where the lowest isocost line just touches the isoquant.", visual, stats: [makeStat(`${fmt.number(s.labor)}, ${fmt.number(kNeeded)}`, "Chosen L, K"), makeStat(`${fmt.number(optLabor)}, ${fmt.number(optCapital)}`, "Cost-min L, K"), makeStat(fmt.wholeMoney(cost), "Chosen cost"), makeStat(fmt.wholeMoney(minCost), "Minimum cost"), makeStat(fmt.wholeMoney(excessCost), "Excess cost"), makeStat(`${fmt.number(mplDollar, 3)} vs ${fmt.number(mpkDollar, 3)}`, "MP per dollar")], intuition: `${advise}. Cost minimization equalizes marginal product per dollar, which is the tangency between the isoquant and the lowest reachable isocost line.`, quiz: commonQuiz("The tangency where MP per dollar is equalized", "The largest possible amount of one input", "Cost minimization is about the cheapest input mix that still reaches the output target.") };
      }
    };
  }

  function perfectCompetitionTool() {
    return {
      title: "Perfect Competition and Entry",
      subtitle: "Entry pushes economic profit toward zero in the long run.",
      controls: [range("price", "Market price", 20, 120, 5, 70), range("fixed", "Fixed cost", 0, 600, 25, 250), range("base", "Marginal cost intercept", 5, 50, 1, 20), range("slope", "Marginal cost slope", 0.5, 3, 0.1, 1.2)],
      render(s) {
        const q = Math.max(0, (s.price - s.base) / s.slope);
        const vc = s.base * q + 0.5 * s.slope * q * q;
        const profit = s.price * q - vc - s.fixed;
        const entry = profit > 20 ? "Entry pressure" : profit < -20 ? "Exit pressure" : "Near long-run zero profit";
        return { visualTitle: "Competitive Firm", visualNote: "The firm takes market price as given.", visual: costCurveTool().render({ fixed: s.fixed, base: s.base, curvature: s.slope / 2, price: s.price }).visual, stats: [makeStat(fmt.number(q), "Firm output"), makeStat(fmt.wholeMoney(profit), "Profit"), makeStat(entry, "Long-run pressure"), makeStat(fmt.money(s.price), "Market price")], intuition: "Positive economic profit attracts entry; losses push firms out. Long-run competition erodes economic profit.", quiz: commonQuiz("Profit tells entry or exit pressure", "Revenue alone tells entry", "Entry responds to economic profit, not just sales volume.") };
      }
    };
  }

  function monopolyTool() {
    return {
      title: "Monopoly Pricing",
      subtitle: "A monopolist internalizes that selling more units lowers price on all units.",
      controls: [range("a", "Demand intercept", 80, 180, 5, 140), range("b", "Demand slope", 0.5, 2, 0.1, 1.0), range("mc", "Marginal cost", 5, 80, 5, 35), range("q", "Chosen quantity", 1, 100, 1, 40)],
      render(s) {
        const qOpt = Math.max(0, (s.a - s.mc) / (2 * s.b));
        const pOpt = s.a - s.b * qOpt;
        const p = Math.max(0, s.a - s.b * s.q);
        const profit = (p - s.mc) * s.q;
        const qComp = Math.max(0, (s.a - s.mc) / s.b);
        const cs = 0.5 * Math.max(0, s.a - p) * s.q;
        const dwl = s.q < qComp ? 0.5 * Math.max(0, p - s.mc) * (qComp - s.q) : 0;
        const qChoke = s.a / s.b;
        const { xMax, yMax } = chartScales.monopoly;
        const f = frame(760, 420, xMax, yMax);
        const demandEnd = Math.min(xMax, qChoke);
        const mrEnd = Math.min(xMax, s.a / (2 * s.b));
        const demandLabelQ = Math.min(demandEnd * 0.72, xMax * 0.72);
        const mrLabelQ = Math.min(mrEnd * 0.66, xMax * 0.40);
        const csShape = s.q > 0 ? `<polygon class="area-cs" points="${linePath([[0, s.a], [0, p], [s.q, p]], f)}"></polygon>` : "";
        const profitShape = s.q > 0 ? `<polygon class="${profit >= 0 ? "area-profit" : "area-loss"}" points="${linePath([[0, Math.min(p, s.mc)], [s.q, Math.min(p, s.mc)], [s.q, Math.max(p, s.mc)], [0, Math.max(p, s.mc)]], f)}"></polygon>` : "";
        const dwlShape = dwl > 0 ? `<polygon class="area-dwl" points="${linePath([[s.q, p], [s.q, s.mc], [qComp, s.mc]], f)}"></polygon>` : "";
        const visual = chart(760, 420, html`
          ${f.axis}
          ${csShape}
          ${profitShape}
          ${dwlShape}
          <line class="demand-line" x1="${f.x(0)}" y1="${f.y(s.a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(s.a, s.b, demandEnd)))}"></line>
          <line class="tax-adjusted-line" x1="${f.x(0)}" y1="${f.y(s.a)}" x2="${f.x(mrEnd)}" y2="${f.y(Math.max(0, s.a - 2 * s.b * mrEnd))}"></line>
          <line class="supply-line" x1="${f.x(0)}" y1="${f.y(s.mc)}" x2="${f.margin.l + f.w}" y2="${f.y(s.mc)}"></line>
          <line class="guide-line" x1="${f.x(s.q)}" y1="${f.y(p)}" x2="${f.x(s.q)}" y2="${f.margin.t + f.h}"></line>
          <circle class="tax-point" cx="${f.x(qOpt)}" cy="${f.y(pOpt)}" r="5"></circle>
          <circle class="eq-point" cx="${f.x(s.q)}" cy="${f.y(p)}" r="5"></circle>
          <text class="curve-label" x="${f.x(demandLabelQ)}" y="${f.y(linearDemand(s.a, s.b, demandLabelQ)) - 8}">Demand</text>
          <text class="curve-label" x="${f.x(mrLabelQ)}" y="${f.y(s.a - 2 * s.b * mrLabelQ) - 8}">MR</text>
          <text class="curve-label" x="${f.x(xMax * 0.78)}" y="${f.y(s.mc) - 8}">MC</text>
        `);
        return { visualTitle: "Demand, MR, and MC", visualNote: "Shaded regions show consumer surplus, profit or loss, and deadweight loss at the chosen quantity.", visual, stats: [makeStat(fmt.number(qOpt), "Optimal quantity"), makeStat(fmt.money(pOpt), "Optimal price"), makeStat(fmt.wholeMoney(profit), "Profit at chosen Q"), makeStat(fmt.wholeMoney(cs), "Consumer surplus"), makeStat(fmt.wholeMoney(dwl), "Deadweight loss")], intuition: "The monopoly optimum is where marginal revenue equals marginal cost, then price is read from demand.", quiz: commonQuiz("Set MR equal to MC, then read price from demand", "Set demand equal to MC directly", "A monopolist's marginal revenue is below price because extra sales lower the price on inframarginal units.") };
      }
    };
  }

  function ieprTool() {
    return {
      title: "Inverse Elasticity Pricing Rule",
      subtitle: "The less elastic demand is, the higher the optimal markup.",
      controls: [range("epsilon", "Elasticity magnitude", 1.1, 8, 0.1, 2.5), range("mc", "Marginal cost", 5, 100, 5, 40), range("price", "Current price", 10, 250, 5, 80)],
      render(s) {
        const targetPrice = s.mc * s.epsilon / (s.epsilon - 1);
        const targetMarkup = 1 / s.epsilon;
        const actualMarkup = (s.price - s.mc) / Math.max(1, s.price);
        const gap = targetMarkup - actualMarkup;
        const advice = Math.abs(gap) < 0.03 ? "Near target" : gap > 0 ? "Raise price" : "Lower price";
        const f = domainFrame(720, 380, 1, 8, -0.2, 1, { xLabel: "Elasticity magnitude", yLabel: "Price-cost margin", xTicks: [1, 2, 3, 4, 5, 6, 7, 8], yTicks: [-0.2, 0, 0.25, 0.5, 0.75, 1] });
        const rulePath = sampledPath(1.05, 8, 90, (e) => 1 / e, f);
        const visual = chart(720, 380, html`
          ${f.axis}
          <path class="demand-line no-fill" d="${rulePath}"></path>
          <line class="policy-line" x1="${f.margin.l}" y1="${f.y(actualMarkup)}" x2="${f.margin.l + f.w}" y2="${f.y(actualMarkup)}"></line>
          <line class="guide-line" x1="${f.x(s.epsilon)}" y1="${f.y(Math.min(targetMarkup, actualMarkup))}" x2="${f.x(s.epsilon)}" y2="${f.y(Math.max(targetMarkup, actualMarkup))}"></line>
          <circle class="eq-point" cx="${f.x(s.epsilon)}" cy="${f.y(targetMarkup)}" r="5"></circle>
          <circle class="tax-point" cx="${f.x(s.epsilon)}" cy="${f.y(actualMarkup)}" r="5"></circle>
          <text class="curve-label" x="${f.x(3.2)}" y="${f.y(1 / 3.2) - 10}">Target margin = 1 / |elasticity|</text>
          <text class="point-label" x="${f.margin.l + 10}" y="${f.y(actualMarkup) - 8}">Current margin</text>
          <text class="point-label" x="${f.x(s.epsilon) + 8}" y="${f.y(targetMarkup) + 18}">Rule</text>
        `);
        return { visualTitle: "Actual vs Target Markup", visualNote: "The inverse elasticity rule says the optimal price-cost margin should equal one over elasticity.", visual, stats: [makeStat(fmt.money(targetPrice), "Rule-implied price"), makeStat(fmt.money(s.price), "Current price"), makeStat(fmt.pct(targetMarkup), "Target margin"), makeStat(fmt.pct(actualMarkup), "Current margin"), makeStat(advice, "Pricing guidance")], intuition: `${advice}: the current margin is ${fmt.pct(actualMarkup)}, while demand elasticity supports a target margin of ${fmt.pct(targetMarkup)}. The rule only makes sense in the elastic region.`, quiz: commonQuiz("Compare actual markup with 1 / elasticity", "Only compare price with average cost", "The rule is useful because it translates demand responsiveness into a target price-cost margin.") };
      }
    };
  }

  function singleUnitPdTool() {
    return {
      title: "Demographic Price Discrimination",
      subtitle: "When groups have different demand curves, a monopolist sets MR = MC separately in each segment.",
      controls: [
        range("businessA", "Business demand intercept", 50, 90, 1, 70),
        range("businessB", "Business demand slope", 0.1, 0.4, 0.01, 0.2),
        range("seniorA", "Senior demand intercept", 25, 60, 1, 40),
        range("seniorB", "Senior demand slope", 0.05, 0.25, 0.01, 0.1),
        range("mc", "Marginal cost", 0, 20, 1, 4)
      ],
      render(s) {
        const segmentOptimum = (a, b) => {
          const q = Math.max(0, (a - s.mc) / (2 * b));
          const p = Math.max(0, a - b * q);
          return { q, p, profit: Math.max(0, (p - s.mc) * q), qIntercept: a / b };
        };
        const business = segmentOptimum(s.businessA, s.businessB);
        const senior = segmentOptimum(s.seniorA, s.seniorB);
        const f = frame(760, 420, 420, 90, { xLabel: "Tickets per period", yLabel: "Price", xTicks: [0, 100, 200, 300, 400], yTicks: [0, 20, 40, 60, 80] });
        const demandEnd = (a, b) => Math.min(f.xMax, a / b);
        const priceAt = (a, b, q) => Math.max(0, linearDemand(a, b, q));
        const labelX = (q, offset = 12) => clamp(f.x(q) + offset, f.margin.l + 14, f.margin.l + f.w - 14);
        const labelAnchor = (q) => f.x(q) > f.margin.l + f.w - 170 ? "end" : "start";
        const pointLabel = (seg, label, klass, dy) => {
          const anchor = labelAnchor(seg.q);
          const x = anchor === "end" ? clamp(f.x(seg.q) - 12, f.margin.l + 14, f.margin.l + f.w - 14) : labelX(seg.q);
          return html`
            <circle class="${klass}" cx="${f.x(seg.q)}" cy="${f.y(seg.p)}" r="5"></circle>
            <text class="point-label" x="${x}" y="${clamp(f.y(seg.p) + dy, f.margin.t + 16, f.margin.t + f.h - 12)}" text-anchor="${anchor}">${label}: Q=${fmt.int(seg.q)}, P=${fmt.wholeMoney(seg.p)}</text>
          `;
        };
        const businessProfit = business.q > 0 && business.p > s.mc ? `<polygon class="area-business-profit" points="${linePath([[0, s.mc], [business.q, s.mc], [business.q, business.p], [0, business.p]], f)}"></polygon>` : "";
        const seniorProfit = senior.q > 0 && senior.p > s.mc ? `<polygon class="area-senior-profit" points="${linePath([[0, s.mc], [senior.q, s.mc], [senior.q, senior.p], [0, senior.p]], f)}"></polygon>` : "";
        const chartBody = html`
          ${f.axis}
          ${businessProfit}
          ${seniorProfit}
          <line class="demand-line" x1="${f.x(0)}" y1="${f.y(s.businessA)}" x2="${f.x(demandEnd(s.businessA, s.businessB))}" y2="${f.y(priceAt(s.businessA, s.businessB, demandEnd(s.businessA, s.businessB)))}"></line>
          <line class="supply-line" x1="${f.x(0)}" y1="${f.y(s.seniorA)}" x2="${f.x(demandEnd(s.seniorA, s.seniorB))}" y2="${f.y(priceAt(s.seniorA, s.seniorB, demandEnd(s.seniorA, s.seniorB)))}"></line>
          <line class="policy-line" x1="${f.margin.l}" y1="${f.y(s.mc)}" x2="${f.margin.l + f.w}" y2="${f.y(s.mc)}"></line>
          <line class="guide-line" x1="${f.x(business.q)}" y1="${f.y(business.p)}" x2="${f.x(business.q)}" y2="${f.margin.t + f.h}"></line>
          <line class="guide-line" x1="${f.margin.l}" y1="${f.y(business.p)}" x2="${f.x(business.q)}" y2="${f.y(business.p)}"></line>
          <line class="guide-line" x1="${f.x(senior.q)}" y1="${f.y(senior.p)}" x2="${f.x(senior.q)}" y2="${f.margin.t + f.h}"></line>
          <line class="guide-line" x1="${f.margin.l}" y1="${f.y(senior.p)}" x2="${f.x(senior.q)}" y2="${f.y(senior.p)}"></line>
          ${pointLabel(business, "Business optimum", "eq-point", -12)}
          ${pointLabel(senior, "Senior optimum", "good-point", 24)}
          <text class="curve-label" x="${f.x(Math.min(260, demandEnd(s.businessA, s.businessB) * 0.65))}" y="${f.y(priceAt(s.businessA, s.businessB, Math.min(260, demandEnd(s.businessA, s.businessB) * 0.65))) - 9}">Business demand</text>
          <text class="curve-label" x="${f.x(Math.min(320, demandEnd(s.seniorA, s.seniorB) * 0.72))}" y="${f.y(priceAt(s.seniorA, s.seniorB, Math.min(320, demandEnd(s.seniorA, s.seniorB) * 0.72))) + 18}">Senior demand</text>
        `;
        const key = chartKey([
          { className: "key-demand", label: "Business demand" },
          { className: "key-supply", label: "Senior demand" },
          { className: "key-lottery", label: "Marginal cost" },
          { className: "key-equilibrium", label: "Business optimum" },
          { className: "key-probe-good", label: "Senior optimum" }
        ]);
        return {
          visualTitle: "Segment Demand Curves",
          visualNote: "The segment prices are found by setting MR = MC separately, then reading the price from each group demand curve.",
          visual: chart(760, 420, chartBody) + key,
          stats: [makeStat(`${fmt.wholeMoney(business.p)}, ${fmt.int(business.q)}`, "Business price and quantity"), makeStat(`${fmt.wholeMoney(senior.p)}, ${fmt.int(senior.q)}`, "Senior price and quantity"), makeStat(fmt.wholeMoney(s.mc), "Marginal cost"), makeStat(fmt.int(business.q + senior.q), "Total tickets"), makeStat(fmt.wholeMoney(business.profit + senior.profit), "Total contribution above MC")],
          intuition: "Demographic price discrimination is not about charging more at random. It is about facing different demand curves and choosing the profit-maximizing point on each one. In the slide default, business travelers pay more because their demand curve supports a higher monopoly price.",
          quiz: commonQuiz("Set MR = MC separately in each identifiable group", "Charge every group the same price", "With separated segments and limited resale, each group is priced from its own demand curve.")
        };
      }
    };
  }

  function twoPartTool() {
    return {
      title: "Two-Part Tariffs",
      subtitle: "A usage fee controls quantity; a membership fee extracts surplus.",
      controls: [range("a", "Individual demand intercept", 40, 140, 5, 100), range("b", "Demand slope", 0.5, 3, 0.1, 1.5), range("mc", "Marginal cost", 0, 60, 5, 20), range("usage", "Usage price", 0, 100, 5, 25), range("fee", "Membership fee", 0, 1500, 25, 600)],
      render(s) {
        const q = Math.max(0, (s.a - s.usage) / s.b);
        const cs = 0.5 * Math.max(0, s.a - s.usage) * q;
        const joins = s.fee <= cs;
        const profit = joins ? (s.usage - s.mc) * q + s.fee : 0;
        const { xMax, yMax } = chartScales.twoPart;
        const f = frame(720, 380, xMax, yMax);
        const demandEnd = Math.min(xMax, s.a / s.b);
        const demandLabelQ = Math.min(demandEnd * 0.72, xMax * 0.72);
        const csShape = q > 0 ? `<polygon class="area-cs" points="${linePath([[0, s.a], [0, s.usage], [q, s.usage]], f)}"></polygon>` : "";
        const revenueShape = q > 0 ? `<polygon class="area-revenue" points="${linePath([[0, 0], [q, 0], [q, s.usage], [0, s.usage]], f)}"></polygon>` : "";
        const marginShape = q > 0 ? `<polygon class="${s.usage >= s.mc ? "area-profit" : "area-loss"}" points="${linePath([[0, Math.min(s.usage, s.mc)], [q, Math.min(s.usage, s.mc)], [q, Math.max(s.usage, s.mc)], [0, Math.max(s.usage, s.mc)]], f)}"></polygon>` : "";
        const feeShare = cs > 0 ? clamp(s.fee / cs, 0, 1) : 0;
        const feeHeight = Math.max(0, Math.min(82, feeShare * 82));
        const feeBox = html`
          <g>
            <rect x="610" y="76" width="42" height="82" fill="none" stroke="#d9e2ec"></rect>
            <rect class="area-tax" x="610" y="${158 - feeHeight}" width="42" height="${feeHeight}"></rect>
            <text class="point-label" x="631" y="176" text-anchor="middle">Fee</text>
          </g>
        `;
        const visual = chart(720, 380, html`
          ${f.axis}
          ${revenueShape}
          ${marginShape}
          ${csShape}
          <line class="demand-line" x1="${f.x(0)}" y1="${f.y(s.a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(s.a, s.b, demandEnd)))}"></line>
          <line class="tax-adjusted-line" x1="${f.margin.l}" y1="${f.y(s.usage)}" x2="${f.x(q)}" y2="${f.y(s.usage)}"></line>
          <line class="supply-line" x1="${f.margin.l}" y1="${f.y(s.mc)}" x2="${f.margin.l + f.w}" y2="${f.y(s.mc)}"></line>
          <line class="guide-line" x1="${f.x(q)}" y1="${f.y(s.usage)}" x2="${f.x(q)}" y2="${f.margin.t + f.h}"></line>
          <circle class="eq-point" cx="${f.x(q)}" cy="${f.y(s.usage)}" r="5"></circle>
          <text class="curve-label" x="${f.x(demandLabelQ)}" y="${f.y(linearDemand(s.a, s.b, demandLabelQ)) - 8}">Demand</text>
          <text class="curve-label" x="${f.x(xMax * 0.78)}" y="${f.y(s.mc) - 8}">MC</text>
          ${feeBox}
        `);
        return { visualTitle: "Usage Price and Membership Fee", visualNote: "If the fee exceeds surplus, the consumer walks away.", visual, stats: [makeStat(fmt.number(q), "Usage units"), makeStat(fmt.wholeMoney(cs), "Consumer surplus before fee"), makeStat(joins ? "Joins" : "Does not join", "Participation"), makeStat(fmt.wholeMoney(profit), "Firm profit")], intuition: "With identical consumers, set usage price near marginal cost to maximize total surplus, then use the membership fee to capture it.", quiz: commonQuiz("Usage fee affects quantity; membership fee extracts surplus", "Membership fee affects marginal usage", "The two parts do different jobs in the pricing plan.") };
      }
    };
  }

  function menuPricingTool() {
    return {
      title: "Quantity Screening and Menu Pricing",
      subtitle: "Menus can reveal hidden demand types through self-selection.",
      controls: [
        range("smallPrice", "Small bundle price", 10, 140, 5, 50),
        range("largePrice", "Large bundle price", 40, 240, 5, 130),
        range("lowSmallValue", "Low type value for small", 20, 160, 5, 80),
        range("lowLargeValue", "Low type value for large", 30, 180, 5, 90),
        range("highSmallValue", "High type value for small", 20, 180, 5, 80),
        range("highLargeValue", "High type value for large", 80, 300, 5, 180)
      ],
      render(s) {
        const money = (v) => `${v < 0 ? "-" : ""}$${Math.abs(Number(v)).toFixed(0)}`;
        const options = {
          small: { label: "Small bundle", price: s.smallPrice },
          large: { label: "Large bundle", price: s.largePrice }
        };
        const low = {
          label: "Low type",
          intended: "small",
          small: { value: s.lowSmallValue, price: s.smallPrice, surplus: s.lowSmallValue - s.smallPrice },
          large: { value: s.lowLargeValue, price: s.largePrice, surplus: s.lowLargeValue - s.largePrice }
        };
        const high = {
          label: "High type",
          intended: "large",
          small: { value: s.highSmallValue, price: s.smallPrice, surplus: s.highSmallValue - s.smallPrice },
          large: { value: s.highLargeValue, price: s.largePrice, surplus: s.highLargeValue - s.largePrice }
        };
        const chosenOptions = (type) => {
          const best = Math.max(0, type.small.surplus, type.large.surplus);
          if (best === 0 && type.small.surplus < 0 && type.large.surplus < 0) return ["none"];
          const choices = [];
          if (type.small.surplus === best) choices.push("small");
          if (type.large.surplus === best) choices.push("large");
          if (best === 0) choices.push("none");
          return choices;
        };
        const lowChoices = chosenOptions(low);
        const highChoices = chosenOptions(high);
        const choiceLabel = (choices) => choices.map((choice) => choice === "none" ? "Walk away" : options[choice].label).join(" or ");
        const chosenPrice = (choices) => choices.filter((choice) => choice !== "none").map((choice) => money(options[choice].price)).join(" or ") || "$0";
        const revenueFor = (choices) => {
          const bought = choices.filter((choice) => choice !== "none");
          if (!bought.length) return 0;
          return Math.max(...bought.map((choice) => options[choice].price));
        };
        const revenue = revenueFor(lowChoices) + revenueFor(highChoices);
        const highlight = (type, option) => type.includes(option) ? "is-highlighted" : "";
        const cell = (type, option) => {
          const data = type[option];
          return html`
            <strong>${options[option].label}</strong>
            <span>Price ${money(data.price)}</span>
            <span>Value ${money(data.value)}</span>
            <span>Surplus ${money(data.surplus)}</span>
          `;
        };
        const condition = (ok, label, title, formula, note) => html`
          <article class="condition-card ${ok ? "is-ok" : "is-bad"}">
            <span class="condition-kicker">${ok ? "Satisfied" : "Violated"}: ${label}</span>
            <h3>${title}</h3>
            <code>${formula}</code>
            <p>${note}</p>
          </article>
        `;
        const lowParticipation = low.small.surplus >= 0;
        const lowIc = low.small.surplus >= low.large.surplus;
        const highParticipation = high.large.surplus >= 0;
        const highIc = high.large.surplus >= high.small.surplus;
        const intendedWorks = lowParticipation && lowIc && highParticipation && highIc;
        const lowParticipationFormula = `${money(low.small.value)} - ${money(low.small.price)} = ${money(low.small.surplus)} ${lowParticipation ? ">= 0" : "< 0"}`;
        const lowIcFormula = `${money(low.small.value)} - ${money(low.small.price)} = ${money(low.small.surplus)} ${lowIc ? ">=" : "<"} ${money(low.large.value)} - ${money(low.large.price)} = ${money(low.large.surplus)}`;
        const highParticipationFormula = `${money(high.large.value)} - ${money(high.large.price)} = ${money(high.large.surplus)} ${highParticipation ? ">= 0" : "< 0"}`;
        const highIcFormula = `${money(high.large.value)} - ${money(high.large.price)} = ${money(high.large.surplus)} ${highIc ? ">=" : "<"} ${money(high.small.value)} - ${money(high.small.price)} = ${money(high.small.surplus)}`;
        const conditions = html`
          <div class="condition-grid">
            ${condition(lowParticipation, "low participation", "Low type is willing to buy the small bundle", lowParticipationFormula, "The low type must prefer the intended small bundle to walking away.")}
            ${condition(lowIc, "low incentive compatibility", "Low type buys the right one", lowIcFormula, "The low type must prefer the small bundle to mimicking the high type and buying the large bundle.")}
            ${condition(highParticipation, "high participation", "High type is willing to buy the large bundle", highParticipationFormula, "The high type must prefer the intended large bundle to walking away.")}
            ${condition(highIc, "high incentive compatibility", "High type buys the right one", highIcFormula, "The high type must prefer the large bundle to mimicking the low type and buying the small bundle.")}
          </div>
        `;
        const matrix = html`
          <div class="matrix-wrap">
            <h3>Menu Payoff Matrix</h3>
            <p class="matrix-note">Highlighted cells are the option each type chooses at the posted prices. Each cell shows value minus price.</p>
            <table class="payoff-matrix choice-matrix">
              <thead>
                <tr>
                  <th></th>
                  <th>Small bundle<br><span>${money(s.smallPrice)}</span></th>
                  <th>Large bundle<br><span>${money(s.largePrice)}</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Low type</th>
                  <td class="${highlight(lowChoices, "small")}">${cell(low, "small")}</td>
                  <td class="${highlight(lowChoices, "large")}">${cell(low, "large")}</td>
                </tr>
                <tr>
                  <th>High type</th>
                  <td class="${highlight(highChoices, "small")}">${cell(high, "small")}</td>
                  <td class="${highlight(highChoices, "large")}">${cell(high, "large")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
        const surplusRow = (type, choices) => {
          if (choices.includes("none")) {
            return html`
              <div class="surplus-row is-none">
                <div class="surplus-header"><strong>${type.label}: walks away</strong><span>Outside option gives surplus $0.</span></div>
              </div>
            `;
          }
          const choice = choices[0];
          const data = type[choice];
          const paidShare = data.value > 0 ? clamp(Math.max(0, data.price) / data.value, 0, 1) * 100 : 0;
          const surplusShare = data.value > 0 ? clamp(Math.max(0, data.surplus) / data.value, 0, 1) * 100 : 0;
          const rentLabel = type === high && choice === "large" ? "Information rent" : "Consumer surplus";
          return html`
            <div class="surplus-row">
              <div class="surplus-header">
                <strong>${type.label}: chooses ${options[choice].label.toLowerCase()}</strong>
                <span>Value ${money(data.value)}; pays ${money(data.price)}; ${rentLabel.toLowerCase()} ${money(Math.max(0, data.surplus))}</span>
              </div>
              <div class="surplus-track" aria-label="${type.label} value split">
                <span class="surplus-paid" style="width:${paidShare}%"></span>
                <span class="surplus-left" style="width:${surplusShare}%"></span>
              </div>
            </div>
          `;
        };
        const surplus = html`
          <div class="surplus-panel">
            <h3>Surplus From Chosen Options</h3>
            <div class="surplus-legend"><span><i class="legend-paid"></i>Price paid</span><span><i class="legend-surplus"></i>Surplus left to buyer</span></div>
            ${surplusRow(low, lowChoices)}
            ${surplusRow(high, highChoices)}
          </div>
        `;
        const visual = html`
          ${matrix}
          ${conditions}
          ${surplus}
        `;
        return {
          visualTitle: "Menu Choices and Screening Constraints",
          visualNote: "The matrix highlights the chosen option; the constraint cards show exactly why the intended menu does or does not work.",
          visual,
          stats: [makeStat(choiceLabel(lowChoices), "Low-type choice"), makeStat(choiceLabel(highChoices), "High-type choice"), makeStat(`${chosenPrice(lowChoices)}, ${chosenPrice(highChoices)}`, "Chosen prices"), makeStat(intendedWorks ? "Yes" : "No", "Intended self-selection works"), makeStat(fmt.wholeMoney(revenue), "Revenue from one of each type")],
          intuition: intendedWorks ? "This menu screens types: low-demand buyers choose the small bundle, high-demand buyers choose the large bundle, and the high type keeps enough surplus to avoid mimicking the low type." : "The highlighted matrix shows the breakdown. A violated participation constraint means a type walks away; a violated incentive-compatibility constraint means a type wants the wrong bundle.",
          quiz: [
            { title: "Menu Design", question: "What must be true for the high type to buy the large bundle?", choices: ["High surplus from large must be at least high surplus from small, and nonnegative.", "The large bundle must have the lowest price.", "The low type must dislike every bundle.", "The two prices must be equal."], correct: 0, explain: "The high type must participate and must prefer the intended large bundle to mimicking the low type." },
            { title: "Constraint Failure", question: "What does a red constraint card mean?", choices: ["The intended self-selection condition fails at the current numbers.", "The firm is definitely losing money.", "The matrix stopped updating.", "The larger bundle is always inefficient."], correct: 0, explain: "Red means the current values and prices violate that participation or incentive-compatibility inequality." }
          ]
        };
      }
    };
  }

  function selfSelectionPdTool() {
    return {
      title: "Self-Selection Price Discrimination",
      subtitle: "A menu can separate hidden types when each type wants to buy the option intended for it.",
      controls: [
        range("flexWeekday", "Flexible value: weekday", 20, 80, 5, 40),
        range("flexWeekend", "Flexible value: weekend", 20, 90, 5, 50),
        range("weekendWeekday", "Weekend type value: weekday", 20, 90, 5, 50),
        range("weekendWeekend", "Weekend type value: weekend", 40, 120, 5, 80),
        range("weekdayPrice", "Weekday price", 0, 100, 5, 40),
        range("weekendPrice", "Weekend price", 0, 120, 5, 70),
        range("mc", "Marginal cost", 0, 60, 5, 20)
      ],
      render(s) {
        const money = (v) => `${v < 0 ? "-" : ""}$${Math.abs(Number(v)).toFixed(0)}`;
        const flexWeekdaySurplus = s.flexWeekday - s.weekdayPrice;
        const flexWeekendSurplus = s.flexWeekend - s.weekendPrice;
        const weekendWeekdaySurplus = s.weekendWeekday - s.weekdayPrice;
        const weekendWeekendSurplus = s.weekendWeekend - s.weekendPrice;
        const cells = [
          [[flexWeekdaySurplus, weekendWeekdaySurplus], [flexWeekdaySurplus, weekendWeekendSurplus]],
          [[flexWeekendSurplus, weekendWeekdaySurplus], [flexWeekendSurplus, weekendWeekendSurplus]]
        ];
        const ne = bestResponses(cells);
        const highlightSet = new Set(ne);
        const rowLabels = ["Flexible: weekday", "Flexible: weekend"];
        const colLabels = ["Weekend type: weekday", "Weekend type: weekend"];
        const cellName = (key) => {
          const [i, j] = key.split("-").map(Number);
          return `${rowLabels[i].replace("Flexible: ", "flexible chooses ")}; ${colLabels[j].replace("Weekend type: ", "weekend type chooses ")}`;
        };
        const choice = (weekdaySurplus, weekendSurplus) => {
          const best = Math.max(0, weekdaySurplus, weekendSurplus);
          if (best === 0 && weekdaySurplus < 0 && weekendSurplus < 0) return "Does not buy";
          const choices = [];
          if (weekdaySurplus === best) choices.push("Weekday");
          if (weekendSurplus === best) choices.push("Weekend");
          if (best === 0) choices.push("Outside option");
          return choices.join(" or ");
        };
        const flexibleChoice = choice(flexWeekdaySurplus, flexWeekendSurplus);
        const weekendChoice = choice(weekendWeekdaySurplus, weekendWeekendSurplus);
        const lowParticipation = flexWeekdaySurplus >= 0;
        const highIc = weekendWeekendSurplus >= weekendWeekdaySurplus;
        const flexibleStaysOnWeekday = flexWeekdaySurplus >= flexWeekendSurplus && lowParticipation;
        const intendedWorks = flexibleStaysOnWeekday && highIc && weekendWeekendSurplus >= 0;
        const intendedProfit = 100 * Math.max(0, s.weekdayPrice - s.mc) + 100 * Math.max(0, s.weekendPrice - s.mc);
        const matrix = html`
          <div class="matrix-wrap">
            <h3>Golf-Course Payoffs</h3>
            <p class="matrix-note">Each cell shows consumer surplus in dollars: flexible customer, weekend-preferring customer.</p>
            <table class="payoff-matrix">
              <thead><tr><th></th>${colLabels.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
              <tbody>
                ${rowLabels.map((r, i) => `
                  <tr>
                    <th>${r}</th>
                    ${colLabels.map((c, j) => `<td class="${highlightSet.has(`${i}-${j}`) ? "is-highlighted" : ""}">${money(cells[i][j][0])}, ${money(cells[i][j][1])}</td>`).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
        const condition = (ok, kicker, title, formula, note) => html`
          <article class="condition-card ${ok ? "is-ok" : "is-bad"}">
            <span class="condition-kicker">${kicker}</span>
            <h3>${title}</h3>
            <code>${formula}</code>
            <p>${note}</p>
          </article>
        `;
        const participationFormula = `${money(s.flexWeekday)} - ${money(s.weekdayPrice)} = ${money(flexWeekdaySurplus)} ${lowParticipation ? ">= 0" : "< 0"}`;
        const icFormula = `${money(s.weekendWeekend)} - ${money(s.weekendPrice)} = ${money(weekendWeekendSurplus)} ${highIc ? ">=" : "<"} ${money(s.weekendWeekday)} - ${money(s.weekdayPrice)} = ${money(weekendWeekdaySurplus)}`;
        const conditions = html`
          <div class="menu-explainer">
            <p>The golf course cannot observe customer type directly. It uses a weekday/weekend menu: weekday golf is intended for flexible players, while weekend golf is intended for players with a strong weekend preference.</p>
          </div>
          <div class="condition-grid">
            ${condition(lowParticipation, "Willingness-to-buy / participation", "Flexible customers buy the weekday option", participationFormula, "The low-demand group must get at least as much surplus from buying as from walking away.")}
            ${condition(highIc, "Buy the right one / incentive compatibility", "Weekend-preferring customers choose weekend golf", icFormula, "The high-demand group must get at least as much surplus from the weekend option as from imitating flexible customers.")}
          </div>
        `;
        return {
          visualTitle: "Golf-Course Self-Selection Exercise",
          visualNote: "Highlighted cells are mutual best responses among the two posted options; the condition cards also check whether the intended buyers participate.",
          visual: conditions + matrix,
          stats: [makeStat(flexibleChoice, "Flexible customer choice"), makeStat(weekendChoice, "Weekend-preferring choice"), makeStat(ne.length ? ne.map(cellName).join("; ") : "None", "Highlighted equilibrium"), makeStat(intendedWorks ? "Yes" : "No", "Intended menu works"), makeStat(fmt.wholeMoney(intendedProfit), "Profit if 100 of each type buy intended option")],
          intuition: "The menu works only if two things are true: flexible customers are willing to buy the weekday option, and weekend-preferring customers prefer the weekend option to pretending to be flexible. The second condition is why the slide example leaves weekend customers with information rent.",
          quiz: [
            { title: "Buy the Right One", question: "Which current inequality is the incentive-compatibility condition for the weekend-preferring type?", choices: [icFormula, participationFormula, `${money(s.flexWeekend)} - ${money(s.weekendPrice)} >= 0`, `${money(s.weekendPrice)} >= ${money(s.weekdayPrice)}`], correct: 0, explain: "Incentive compatibility compares the weekend-preferring customer's surplus from the intended weekend option with the surplus from imitating flexible customers on weekdays." },
            { title: "Willingness to Buy", question: "What does the participation condition check?", choices: ["The intended customer gets nonnegative surplus from buying.", "The firm earns zero profit.", "Both posted prices are identical.", "The weekend option has the highest price."], correct: 0, explain: "Participation means the customer voluntarily buys instead of taking the outside option." }
          ]
        };
      }
    };
  }

  function riskTool() {
    return {
      title: "Uncertainty and Risk Preferences",
      subtitle: "A risky lottery is evaluated by expected utility, not just expected dollars.",
      controls: [
        range("bad", "Bad-state payoff", 0, 700, 25, 300),
        range("good", "Good-state payoff", 700, 1200, 25, 900),
        range("prob", "Probability of bad state (%)", 0, 100, 5, 30),
        range("rho", "Utility curvature (rho)", 0.35, 1.65, 0.05, 0.65)
      ],
      render(s) {
        const pBad = s.prob / 100;
        const { xMax, yMax } = chartScales.risk;
        const rho = Number(s.rho);
        const u = (w) => Math.pow(clamp(w, 0, xMax) / xMax, rho);
        const uBad = u(s.bad);
        const uGood = u(s.good);
        const ev = pBad * s.bad + (1 - pBad) * s.good;
        const eu = pBad * uBad + (1 - pBad) * uGood;
        const ce = xMax * Math.pow(Math.max(0, eu), 1 / rho);
        const riskPremium = ev - ce;
        const uEv = u(ev);
        const shape = rho < 0.98 ? "concave" : rho > 1.02 ? "convex" : "nearly linear";
        const willingness = riskPremium >= 0
          ? `${fmt.wholeMoney(riskPremium)} willing to pay`
          : `${fmt.wholeMoney(Math.abs(riskPremium))} compensation needed`;
        const f = frame(760, 420, xMax, yMax, { xLabel: "Payoff", yLabel: "Utility", xTicks: [0, 300, 600, 900, 1200], yTicks: [0, 0.25, 0.5, 0.75, 1] });
        const curvePath = Array.from({ length: 80 }, (_, i) => {
          const w = xMax * i / 79;
          return `${i === 0 ? "M" : "L"}${f.x(w).toFixed(2)} ${f.y(u(w)).toFixed(2)}`;
        }).join(" ");
        const bandX = Math.min(f.x(ev), f.x(ce));
        const bandWidth = Math.abs(f.x(ev) - f.x(ce));
        const closeEvCe = Math.abs(f.x(ev) - f.x(ce)) < 46;
        const ceLabelAnchor = ce < 130 ? "start" : ce > 1070 ? "end" : "middle";
        const evLabelAnchor = ev < 130 ? "start" : ev > 1070 ? "end" : "middle";
        const ceLabelY = f.margin.t + f.h - 18;
        const evLabelY = f.margin.t + f.h - (closeEvCe ? 56 : 34);
        const euTagY = clamp(f.y(eu) - 8, f.margin.t + 18, f.margin.t + f.h - 54);
        const bracketY = f.margin.t + f.h - 74;
        const bracketMid = bandX + bandWidth / 2;
        const bracketText = riskPremium >= 0 ? `Risk premium = ${fmt.wholeMoney(Math.abs(riskPremium))}` : `CE - EV = ${fmt.wholeMoney(Math.abs(riskPremium))}`;
        const bracketWide = bandWidth > 120;
        const bracketLabelX = bracketWide ? bracketMid : clamp(Math.max(f.x(ev), f.x(ce)) + 18, f.margin.l + 130, f.margin.l + f.w - 8);
        const bracketAnchor = bracketWide ? "middle" : bracketLabelX > f.margin.l + f.w - 90 ? "end" : "start";
        const key = chartKey([
          { className: "key-utility", label: "Utility function" },
          { className: "key-lottery", label: "Expected utility line" },
          { className: "key-ce", label: "Certainty equivalent" },
          { className: "key-eu", label: "Expected utility point" }
        ]);
        const riskChart = chart(760, 420, html`
          ${f.axis}
          <rect class="area-risk-premium" x="${bandX}" y="${f.margin.t}" width="${bandWidth}" height="${f.h}"></rect>
          <line class="lottery-line" x1="${f.x(s.bad)}" y1="${f.y(uBad)}" x2="${f.x(s.good)}" y2="${f.y(uGood)}"></line>
          <path class="utility-line no-fill" d="${curvePath}"></path>
          <line class="guide-line" x1="${f.x(ce)}" y1="${f.y(eu)}" x2="${f.x(ce)}" y2="${f.margin.t + f.h}"></line>
          <line class="guide-line" x1="${f.margin.l}" y1="${f.y(eu)}" x2="${f.x(ce)}" y2="${f.y(eu)}"></line>
          <line class="guide-line" x1="${f.x(ev)}" y1="${f.y(uEv)}" x2="${f.x(ev)}" y2="${f.margin.t + f.h}"></line>
          <line class="wtp-bracket" x1="${f.x(ce)}" y1="${bracketY}" x2="${f.x(ev)}" y2="${bracketY}"></line>
          <line class="wtp-bracket" x1="${f.x(ce)}" y1="${bracketY - 10}" x2="${f.x(ce)}" y2="${bracketY + 10}"></line>
          <line class="wtp-bracket" x1="${f.x(ev)}" y1="${bracketY - 10}" x2="${f.x(ev)}" y2="${bracketY + 10}"></line>
          <circle class="bad-point" cx="${f.x(s.bad)}" cy="${f.y(uBad)}" r="5"></circle>
          <circle class="good-point" cx="${f.x(s.good)}" cy="${f.y(uGood)}" r="5"></circle>
          <circle class="tax-point" cx="${f.x(ev)}" cy="${f.y(eu)}" r="5"></circle>
          <circle class="eq-point" cx="${f.x(ce)}" cy="${f.y(eu)}" r="5"></circle>
          <circle class="eq-point" cx="${f.x(ev)}" cy="${f.y(uEv)}" r="4"></circle>
          <text class="curve-label" x="${f.x(910)}" y="${f.y(u(910)) - 12}">Utility function</text>
          <text class="curve-label" x="${f.x((s.bad + s.good) / 2)}" y="${f.y((uBad + uGood) / 2) + 24}" text-anchor="middle">Expected utility line</text>
          <text class="point-label" x="${f.x(ce)}" y="${ceLabelY}" text-anchor="${ceLabelAnchor}">CE</text>
          <text class="point-label" x="${f.x(ev)}" y="${evLabelY}" text-anchor="${evLabelAnchor}">EV</text>
          <text class="wtp-label" x="${bracketLabelX}" y="${bracketY - 14}" text-anchor="${bracketAnchor}">${bracketText}</text>
          <text class="point-label" x="${f.margin.l + 10}" y="${euTagY}">EU</text>
        `);
        const visual = riskChart + key;
        return {
          visualTitle: "Utility, Expected Value, and Certainty Equivalent",
          visualNote: "The dashed line shows the expected utility calculation between the possible payoffs. The certainty equivalent is the sure payoff that gives the same expected utility.",
          visual,
          summaryTitle: "Risk Outcomes",
          stats: [makeStat(fmt.wholeMoney(ev), "Expected value"), makeStat(fmt.wholeMoney(ce), "Certainty equivalent"), makeStat(willingness, "WTP to avoid risk"), makeStat(fmt.number(eu, 3), "Expected utility"), makeStat(`rho = ${fmt.number(rho, 2)}`, "Utility function: U(w)=(w/1200)^rho")],
          intuition: `${shape[0].toUpperCase() + shape.slice(1)} utility makes the certainty equivalent ${riskPremium >= 0 ? "below" : "above"} expected value. In this app, rho is just a curvature knob: below 1 means more downside-sensitive and risk-averse, 1 is straight and risk-neutral, and above 1 bends toward risk-seeking.`,
          quiz: [
            { title: "Core Idea", question: "For a concave utility function, where should the certainty equivalent be relative to expected value?", choices: ["Below expected value", "Exactly equal to the high payoff", "Above expected value", "Unrelated to expected utility"], correct: 0, explain: "Concavity means the pain of losing dollars is larger than the pleasure from gaining the same dollars, so the sure equivalent is below the dollar expected value." },
            { title: "Curvature", question: "What changes when the utility function becomes convex?", choices: ["The person likes risk, so CE can exceed EV.", "The bad outcome becomes impossible.", "Expected value stops being a dollar average.", "The probability labels swap."], correct: 0, explain: "With convex utility, the utility gain from upside risk dominates the downside, so the risky lottery can be valued above its expected dollar value." }
          ]
        };
      }
    };
  }

  function lemonsTool() {
    return {
      title: "Adverse Selection and Lemons",
      subtitle: "When quality is hidden, price changes which types participate.",
      controls: [range("lemonShare", "Lemon share (%)", 5, 60, 5, 20), range("lemonValue", "Buyer value for lemon", 6000, 11000, 250, 9000), range("peachValue", "Buyer value for peach", 9000, 15000, 250, 11500), range("peachMin", "Peach seller minimum", 6000, 11000, 250, 8000), range("peachMax", "Peach seller maximum", 9000, 15000, 250, 12000), range("lemonCost", "Lemon seller value", 5000, 11000, 250, 8000), range("price", "Market price probe", 6000, 15000, 250, 10850)],
      render(s) {
        const lambda = s.lemonShare / 100;
        const peachShare = 1 - lambda;
        const peachHigh = Math.max(s.peachMax, s.peachMin + 250);
        const span = peachHigh - s.peachMin;
        const supplyPrice = (fShare) => s.peachMin + span * fShare;
        const buyerEv = (fShare) => {
          const lemonMass = lambda;
          const denom = lemonMass + peachShare * fShare;
          return denom <= 0 ? s.peachValue : (lemonMass * s.lemonValue + peachShare * fShare * s.peachValue) / denom;
        };
        const diff = (fShare) => buyerEv(fShare) - supplyPrice(fShare);
        let eqF = null;
        let lo = 0;
        let prevF = 0;
        let prevDiff = diff(0);
        for (let i = 1; i <= 100; i += 1) {
          const fShare = i / 100;
          const dNow = diff(fShare);
          if (prevDiff === 0 || prevDiff * dNow <= 0) {
            lo = prevF;
            let hi = fShare;
            for (let j = 0; j < 36; j += 1) {
              const mid = (lo + hi) / 2;
              if (diff(lo) * diff(mid) <= 0) hi = mid;
              else lo = mid;
            }
            eqF = (lo + hi) / 2;
            break;
          }
          prevF = fShare;
          prevDiff = dNow;
        }
        if (eqF === null && diff(1) >= 0) eqF = 1;
        if (eqF === null) eqF = 0;
        const eqPrice = supplyPrice(eqF);
        const firstBestF = clamp((s.peachValue - s.peachMin) / span, 0, 1);
        const missedF = Math.max(0, firstBestF - eqF);
        const missedSurplus = peachShare * missedF * Math.max(0, s.peachValue - (supplyPrice(eqF) + supplyPrice(firstBestF)) / 2);
        const lemonsActive = s.price >= s.lemonCost;
        const probeF = clamp((s.price - s.peachMin) / span, 0, 1);
        const probeDenom = (lemonsActive ? lambda : 0) + peachShare * probeF;
        const probeEv = probeDenom > 0 ? ((lemonsActive ? lambda : 0) * s.lemonValue + peachShare * probeF * s.peachValue) / probeDenom : 0;
        const buyersEnter = probeEv >= s.price && probeDenom > 0;
        const probeLemonShare = probeDenom > 0 ? (lemonsActive ? lambda : 0) / probeDenom : 0;
        const f = domainFrame(760, 420, 0, 1, 6000, 15000, { xLabel: "Fraction of peach owners selling", yLabel: "Price", xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [6000, 8000, 10000, 12000, 14000, 15000] });
        const evPath = sampledPath(0, 1, 80, buyerEv, f);
        const supplyPath = linePath([[0, s.peachMin], [1, peachHigh]], f);
        const missedShape = missedF > 0 ? html`
          <polygon class="area-dwl" points="${linePath([[eqF, s.peachValue], [firstBestF, s.peachValue], [firstBestF, supplyPrice(firstBestF)], [eqF, supplyPrice(eqF)]], f)}"></polygon>
        ` : "";
        const probeEqClose = Math.hypot(f.x(eqF) - f.x(probeF), f.y(eqPrice) - f.y(s.price)) < 44;
        const eqTextAnchor = eqF > 0.82 ? "end" : "start";
        const eqTextX = f.x(eqF) + (eqF > 0.82 ? -8 : 8);
        const probeTextAnchor = probeF > 0.82 ? "end" : "start";
        const probeTextX = f.x(probeF) + (probeF > 0.82 ? -8 : 8);
        const key = chartKey([
          { className: "key-demand", label: "Buyer expected value" },
          { className: "key-supply", label: "Peach reservation price" },
          { className: "key-equilibrium", label: "Equilibrium" },
          { className: buyersEnter ? "key-probe-good" : "key-probe-bad", label: "Price probe" },
          { className: "key-first-best", label: "First best" }
        ]);
        const lemonsChart = chart(760, 420, html`
          ${f.axis}
          ${missedShape}
          <path class="demand-line no-fill" d="${evPath}"></path>
          <polyline class="supply-line no-fill" points="${supplyPath}"></polyline>
          <line class="guide-line" x1="${f.x(firstBestF)}" y1="${f.y(s.peachValue)}" x2="${f.x(firstBestF)}" y2="${f.margin.t + f.h}"></line>
          <line class="policy-line" x1="${f.margin.l}" y1="${f.y(s.price)}" x2="${f.margin.l + f.w}" y2="${f.y(s.price)}"></line>
          <line class="guide-line" x1="${f.x(probeF)}" y1="${f.y(s.price)}" x2="${f.x(probeF)}" y2="${f.margin.t + f.h}"></line>
          <circle class="eq-point" cx="${f.x(eqF)}" cy="${f.y(eqPrice)}" r="5"></circle>
          <circle class="${buyersEnter ? "good-point" : "bad-point"}" cx="${f.x(probeF)}" cy="${f.y(s.price)}" r="5"></circle>
          <circle class="tax-point" cx="${f.x(firstBestF)}" cy="${f.y(s.peachValue)}" r="4"></circle>
          <text class="point-label" x="${eqTextX}" y="${clamp(f.y(eqPrice) - 10, f.margin.t + 18, f.margin.t + f.h - 12)}" text-anchor="${eqTextAnchor}">Eq</text>
          <text class="point-label" x="${probeTextX}" y="${clamp(f.y(s.price) + (probeEqClose ? 24 : -10), f.margin.t + 18, f.margin.t + f.h - 12)}" text-anchor="${probeTextAnchor}">Probe</text>
        `);
        const visual = lemonsChart + key;
        const status = eqF <= 0.01 && diff(0) < 0 ? "Unravels" : eqF >= 0.99 ? "All peaches trade" : "Partial pooling";
        const probeStatus = !lemonsActive ? "Too low for lemons" : buyersEnter ? "Buyers enter" : "Buyers walk";
        return {
          visualTitle: "Lemons Fixed Point",
          visualNote: "Price changes which peaches sell; that changes buyer expected value and can unravel the market.",
          visual,
          stats: [makeStat(fmt.pct(eqF), "Peach owners selling"), makeStat(fmt.wholeMoney(eqPrice), "Equilibrium price"), makeStat(status, "Market outcome"), makeStat(fmt.pct(probeLemonShare), "Lemon share at probe"), makeStat(probeStatus, "Probe outcome"), makeStat(fmt.wholeMoney(missedSurplus), "Missed gains from trade")],
          intuition: "Adverse selection is a feedback loop: when price rises, more good cars may enter, but if buyers expect too many lemons they will not pay enough to attract all good sellers.",
          quiz: commonQuiz("The fixed point between buyer expected value and seller reservation price", "Only the number of lemons in the population", "The market outcome depends on how price changes the pool of sellers buyers expect to face.")
        };
      }
    };
  }

  function signalingTool() {
    return {
      title: "Signaling and Screening",
      subtitle: "A useful signal is cheaper for high-quality types than low-quality types.",
      controls: [range("premium", "Price premium from warranty", 0, 3000, 100, 900), range("warranty", "Warranty coverage", 0, 5, 0.5, 2), range("goodCost", "Good type warranty cost/year", 50, 800, 50, 150), range("badCost", "Bad type warranty cost/year", 200, 1500, 50, 600)],
      render(s) {
        const goodNet = s.premium - s.warranty * s.goodCost;
        const badNet = s.premium - s.warranty * s.badCost;
        const separating = goodNet >= 0 && badNet < 0;
        const { xMax, yMax } = chartScales.signaling;
        const f = frame(720, 380, xMax, yMax, { xLabel: "Warranty coverage", yLabel: "Price premium", xTicks: [0, 1, 2, 3, 4, 5], yTicks: [0, 1000, 2000, 3000, 4000] });
        const goodLine = linePath([[0, 0], [xMax, xMax * s.goodCost]], f);
        const badLine = linePath([[0, 0], [xMax, xMax * s.badCost]], f);
        const sepPolygon = s.badCost > s.goodCost ? linePath([[0, 0], [xMax, xMax * s.goodCost], [xMax, xMax * s.badCost]], f) : "";
        const visual = chart(720, 380, html`
          ${f.axis}
          ${sepPolygon ? `<polygon class="area-separating" points="${sepPolygon}"></polygon>` : ""}
          <polyline class="supply-line no-fill" points="${goodLine}"></polyline>
          <polyline class="tax-adjusted-line no-fill" points="${badLine}"></polyline>
          <line class="guide-line" x1="${f.x(s.warranty)}" y1="${f.y(s.premium)}" x2="${f.x(s.warranty)}" y2="${f.margin.t + f.h}"></line>
          <line class="guide-line" x1="${f.margin.l}" y1="${f.y(s.premium)}" x2="${f.x(s.warranty)}" y2="${f.y(s.premium)}"></line>
          <circle class="${separating ? "eq-point" : "tax-point"}" cx="${f.x(s.warranty)}" cy="${f.y(s.premium)}" r="5"></circle>
          <text class="curve-label" x="${f.x(3.1)}" y="${f.y(3.1 * s.goodCost) - 10}">Good type break-even</text>
          <text class="curve-label" x="${f.x(2.2)}" y="${f.y(2.2 * s.badCost) - 10}">Bad type break-even</text>
          <text class="point-label" x="${f.x(s.warranty) + 8}" y="${f.y(s.premium) - 10}">Chosen warranty</text>
        `);
        return { visualTitle: "Warranty Signaling Region", visualNote: "A warranty separates types when it is worth buying for good sellers but too costly for bad sellers to imitate.", visual, stats: [makeStat(fmt.wholeMoney(goodNet), "Good type net benefit"), makeStat(fmt.wholeMoney(badNet), "Bad type net benefit"), makeStat(separating ? "Separating" : "Pooling or no signal", "Outcome"), makeStat(fmt.number(s.warranty), "Warranty coverage")], intuition: "Signals work when the cost difference is large enough that high-quality sellers want the signal and low-quality sellers do not.", quiz: commonQuiz("Whether the signal is differentially costly by type", "Whether the signal is expensive for everyone", "A costly signal must separate types, not merely burn money.") };
      }
    };
  }

  function moralHazardTool() {
    return {
      title: "Moral Hazard and Principal-Agent",
      subtitle: "Hidden effort responds to incentives in the contract.",
      controls: [range("commission", "Commission per sale", 0, 100, 5, 40), range("revenue", "Firm revenue per sale", 50, 300, 10, 150), range("pLow", "Sale probability with low effort (%)", 5, 70, 5, 30), range("pHigh", "Sale probability with high effort (%)", 20, 95, 5, 70), range("effortCost", "Agent cost of high effort", 0, 80, 5, 25)],
      render(s) {
        const deltaP = (s.pHigh - s.pLow) / 100;
        const high = s.commission * deltaP >= s.effortCost;
        const prob = (high ? s.pHigh : s.pLow) / 100;
        const agentPay = s.commission * prob - (high ? s.effortCost : 0);
        const principalProfit = (s.revenue - s.commission) * prob;
        const threshold = deltaP > 0 ? s.effortCost / deltaP : Infinity;
        const f = domainFrame(720, 380, 0, 100, -80, 100, { xLabel: "Commission per sale", yLabel: "Agent expected payoff", xTicks: [0, 25, 50, 75, 100], yTicks: [-80, -40, 0, 40, 80] });
        const lowPay = (c) => c * s.pLow / 100;
        const highPay = (c) => c * s.pHigh / 100 - s.effortCost;
        const lowLine = sampledPath(0, 100, 60, lowPay, f);
        const highLine = sampledPath(0, 100, 60, highPay, f);
        const thresholdLine = threshold <= 100 ? `<line class="wedge-line" x1="${f.x(threshold)}" y1="${f.margin.t}" x2="${f.x(threshold)}" y2="${f.margin.t + f.h}"></line>` : "";
        const visual = chart(720, 380, html`
          ${f.axis}
          <path class="supply-line no-fill" d="${lowLine}"></path>
          <path class="demand-line no-fill" d="${highLine}"></path>
          ${thresholdLine}
          <line class="guide-line" x1="${f.x(s.commission)}" y1="${f.y(lowPay(s.commission))}" x2="${f.x(s.commission)}" y2="${f.y(highPay(s.commission))}"></line>
          <circle class="${high ? "eq-point" : "tax-point"}" cx="${f.x(s.commission)}" cy="${f.y(high ? highPay(s.commission) : lowPay(s.commission))}" r="5"></circle>
          <text class="curve-label" x="${f.x(70)}" y="${f.y(lowPay(70)) + 18}">Low effort payoff</text>
          <text class="curve-label" x="${f.x(70)}" y="${f.y(highPay(70)) - 10}">High effort payoff</text>
          ${threshold <= 100 ? `<text class="point-label" x="${f.x(threshold) + 8}" y="${f.margin.t + 18}">High-effort threshold</text>` : ""}
          <text class="point-label" x="${f.x(s.commission) + 8}" y="${f.y(high ? highPay(s.commission) : lowPay(s.commission)) - 10}">Chosen contract</text>
        `);
        return { visualTitle: "Agent Effort Payoff Lines", visualNote: "High effort occurs once the commission makes the high-effort payoff at least as large as low effort.", visual, stats: [makeStat(high ? "High effort" : "Low effort", "Agent choice"), makeStat(threshold <= 100 ? fmt.money(threshold) : "Above range", "Threshold commission"), makeStat(fmt.money(agentPay), "Agent expected payoff"), makeStat(fmt.money(principalProfit), "Principal expected profit"), makeStat(fmt.pct(prob), "Sale probability")], intuition: "The principal cannot directly choose effort; the contract changes the agent's private tradeoff between low effort and costly high effort.", quiz: commonQuiz("The agent's incentive constraint", "The principal's preferred effort only", "Moral hazard is about hidden actions chosen after the contract is set.") };
      }
    };
  }

  function dominantTool() {
    return {
      title: "Dominant Strategies",
      subtitle: "A dominant strategy is best no matter what the rival does.",
      controls: [select("game", "Example game", "ads", [["ads", "Advertising dilemma"], ["launch", "Software launch"], ["toy", "3x3 exercise"]])],
      render(s) {
        const games = {
          ads: { r: ["H Ad", "L Ad"], c: ["H Ad", "L Ad"], cells: [[[20, 20], [50, 10]], [[10, 50], [40, 40]]], h: ["0-0"], msg: "Heavy advertising is dominant for both firms, even though light advertising would make both better off." },
          launch: { r: ["Launch", "Not"], c: ["Launch", "Not"], cells: [[[-20, -20], [30, -10]], [[-10, 30], [0, 0]]], h: [], msg: "There is no dominant strategy for both players in this version; predictions need best responses." },
          toy: { r: ["T", "M", "B"], c: ["L", "C", "R"], cells: [[[9, 5], [5, 6], [1, 7]], [[1, 3], [2, 4], [3, 5]], [[2, 7], [3, 6], [2, 8]]], h: ["1-2"], msg: "Column player has a dominant strategy R; row player's best response to R is M." }
        };
        const g = games[s.game];
        return { visualTitle: "Payoff Matrix", visualNote: "Highlighted cells show the prediction when the example has one.", visual: payoffMatrix("Payoffs", g.r, g.c, g.cells, g.h), stats: [makeStat(g.msg, "Interpretation")], intuition: g.msg, quiz: commonQuiz("Compare each strategy against every rival action", "Pick the largest payoff anywhere in the matrix", "Dominance is a row-by-row or column-by-column comparison against all rival choices.") };
      }
    };
  }

  function nashTool() {
    return {
      title: "Nash Equilibrium Finder",
      subtitle: "A Nash equilibrium is a mutual best response.",
      controls: [select("game", "Game", "prisoners", [["prisoners", "Prisoner's dilemma"], ["battle", "Coordination"], ["matching", "Matching pennies"]])],
      render(s) {
        const games = {
          prisoners: { r: ["Cooperate", "Defect"], c: ["Cooperate", "Defect"], cells: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]] },
          battle: { r: ["A", "B"], c: ["A", "B"], cells: [[[4, 3], [0, 0]], [[0, 0], [3, 4]]] },
          matching: { r: ["Heads", "Tails"], c: ["Heads", "Tails"], cells: [[[1, -1], [-1, 1]], [[-1, 1], [1, -1]]] }
        };
        const g = games[s.game];
        const ne = bestResponses(g.cells);
        return { visualTitle: "Best Responses", visualNote: "Highlighted cells are pure-strategy Nash equilibria.", visual: payoffMatrix("Payoffs", g.r, g.c, g.cells, ne), stats: [makeStat(ne.length ? ne.join(", ") : "None", "Pure Nash cells"), makeStat(ne.length, "Number of pure equilibria")], intuition: ne.length ? "At a highlighted cell, neither player wants to move unilaterally." : "No pure-strategy Nash equilibrium exists here; prediction requires mixed strategies.", quiz: commonQuiz("Mutual best responses", "The cell with the largest total payoff", "Nash equilibrium is about unilateral incentives, not just efficiency.") };
      }
    };
  }

  function coordinationTool() {
    return {
      title: "Coordination Games",
      subtitle: "Some games have multiple equilibria, including good and bad conventions.",
      controls: [range("safe", "Safe equilibrium payoff", 1, 8, 1, 4), range("risky", "High coordination payoff", 2, 12, 1, 8), range("mismatch", "Mismatch payoff", -5, 3, 1, 0)],
      render(s) {
        const cells = [[[s.risky, s.risky], [s.mismatch, s.mismatch]], [[s.mismatch, s.mismatch], [s.safe, s.safe]]];
        const ne = bestResponses(cells);
        const multiple = ne.length > 1;
        const payoffDominant = multiple && ne.includes("0-0") && ne.includes("1-1") ? (s.risky >= s.safe ? "New/New" : "Old/Old") : "Not applicable";
        const riskNote = multiple ? (s.mismatch < 0 ? "Mismatch is costly" : "Mismatch is mild") : "Single prediction";
        return { visualTitle: "Computed Coordination Equilibria", visualNote: "Highlighted cells are true mutual best responses under the current payoffs.", visual: payoffMatrix("Coordination Payoffs", ["New standard", "Old standard"], ["New standard", "Old standard"], cells, ne), stats: [makeStat(ne.length ? ne.join(", ") : "None", "Nash cells"), makeStat(payoffDominant, "Payoff-dominant"), makeStat(riskNote, "Coordination risk"), makeStat(s.risky - s.safe, "New-standard payoff gap")], intuition: multiple ? "Coordination games are hard because more than one outcome can be self-reinforcing; expectations determine where players land." : "With these payoffs, the game no longer has two coordination equilibria, so the prediction should follow the actual best responses.", quiz: commonQuiz("Whether each player expects the other to coordinate", "Only which outcome has the highest payoff", "The problem is expectations and mutual best responses, not just preferences.") };
      }
    };
  }

  function sequentialTool() {
    return {
      title: "Sequential Games and Backward Induction",
      subtitle: "Solve from the end of the tree backward.",
      controls: [range("investGain", "Value if supplier invests", 20, 120, 5, 80), range("investCost", "Supplier investment cost", 0, 80, 5, 30), range("buyerOffer", "Buyer ex post offer", 0, 120, 5, 35)],
      render(s) {
        const supplierTradePayoff = s.buyerOffer - s.investCost;
        const buyerTradePayoff = s.investGain - s.buyerOffer;
        const supplierInvests = supplierTradePayoff >= 0;
        const buyerPayoff = supplierInvests ? buyerTradePayoff : 0;
        const supplierPayoff = supplierInvests ? supplierTradePayoff : 0;
        const visual = chart(720, 360, html`
          <line class="${supplierInvests ? "tree-link-active" : "tree-link"}" x1="120" y1="180" x2="310" y2="92"></line>
          <line class="${supplierInvests ? "tree-link" : "tree-link-active"}" x1="120" y1="180" x2="310" y2="270"></line>
          <line class="${supplierInvests ? "tree-link-active" : "tree-link"}" x1="310" y1="92" x2="560" y2="92"></line>
          <rect class="game-node node-active" x="52" y="150" width="136" height="60" rx="6"></rect>
          <text class="curve-label" x="120" y="176" text-anchor="middle">Supplier</text>
          <text class="point-label" x="120" y="195" text-anchor="middle">Invest?</text>
          <rect class="${supplierInvests ? "game-node node-active" : "game-node"}" x="242" y="62" width="136" height="60" rx="6"></rect>
          <text class="curve-label" x="310" y="88" text-anchor="middle">Buyer offer</text>
          <text class="point-label" x="310" y="107" text-anchor="middle">${fmt.money(s.buyerOffer)}</text>
          <rect class="${supplierInvests ? "game-node node-active" : "game-node"}" x="500" y="62" width="160" height="60" rx="6"></rect>
          <text class="curve-label" x="580" y="86" text-anchor="middle">Trade</text>
          <text class="point-label" x="580" y="106" text-anchor="middle">B ${fmt.money(buyerTradePayoff)}, S ${fmt.money(supplierTradePayoff)}</text>
          <rect class="${supplierInvests ? "game-node" : "game-node node-active"}" x="232" y="240" width="156" height="60" rx="6"></rect>
          <text class="curve-label" x="310" y="266" text-anchor="middle">Do not invest</text>
          <text class="point-label" x="310" y="286" text-anchor="middle">B $0, S $0</text>
          <text class="point-label" x="194" y="116">Invest</text>
          <text class="point-label" x="190" y="260">Do not invest</text>
          <text class="axis-label" x="360" y="338" text-anchor="middle">Backward induction: supplier invests only if the later offer covers the sunk cost</text>
        `);
        return { visualTitle: "Backward-Induction Game Tree", visualNote: "The highlighted path is the prediction after solving from the terminal payoffs back to the first move.", visual, stats: [makeStat(supplierInvests ? "Invest and trade" : "Do not invest", "Backward-induction prediction"), makeStat(fmt.money(buyerPayoff), "Buyer payoff"), makeStat(fmt.money(supplierPayoff), "Supplier payoff"), makeStat(fmt.money(s.investCost), "Sunk investment cost")], intuition: "Backward induction asks what the later payoff will be, then uses that answer to predict the first mover's choice.", quiz: commonQuiz("Start at the final decision node", "Start with the biggest total surplus", "Sequential games are solved from future incentives back to current choices.") };
      }
    };
  }

  function priceCompetitionTool() {
    return {
      title: "Price Competition Games",
      subtitle: "Each firm's best price depends on its rival's price.",
      controls: [range("p1", "Firm 1 price", 10, 100, 5, 50), range("p2", "Firm 2 price", 10, 100, 5, 50), range("mc", "Marginal cost", 0, 60, 5, 20), range("diff", "Product differentiation", 0, 0.8, 0.1, 0.4)],
      render(s) {
        const q1 = Math.max(0, 100 - s.p1 + s.diff * s.p2);
        const q2 = Math.max(0, 100 - s.p2 + s.diff * s.p1);
        const pi1 = (s.p1 - s.mc) * q1;
        const pi2 = (s.p2 - s.mc) * q2;
        const br1 = (100 + s.diff * s.p2 + s.mc) / 2;
        const br2 = (100 + s.diff * s.p1 + s.mc) / 2;
        const nashPrice = (100 + s.mc) / (2 - s.diff);
        const { xMax, yMax } = chartScales.priceGame;
        const f = frame(720, 420, xMax, yMax, { xLabel: "Firm 1 price", yLabel: "Firm 2 price", xTicks: [0, 25, 50, 75, 100, 125], yTicks: [0, 25, 50, 75, 100, 125] });
        const br1Path = Array.from({ length: 80 }, (_, i) => {
          const p2 = yMax * i / 79;
          const p1 = (100 + s.diff * p2 + s.mc) / 2;
          return `${i === 0 ? "M" : "L"}${f.x(p1).toFixed(2)} ${f.y(p2).toFixed(2)}`;
        }).join(" ");
        const br2Path = sampledPath(0, xMax, 80, (p1) => (100 + s.diff * p1 + s.mc) / 2, f);
        const visual = chart(720, 420, html`
          ${f.axis}
          <path class="demand-line no-fill" d="${br1Path}"></path>
          <path class="supply-line no-fill" d="${br2Path}"></path>
          <line class="guide-line" x1="${f.x(s.p1)}" y1="${f.y(s.p2)}" x2="${f.x(br1)}" y2="${f.y(s.p2)}"></line>
          <line class="guide-line" x1="${f.x(s.p1)}" y1="${f.y(s.p2)}" x2="${f.x(s.p1)}" y2="${f.y(br2)}"></line>
          <circle class="tax-point" cx="${f.x(s.p1)}" cy="${f.y(s.p2)}" r="5"></circle>
          <circle class="eq-point" cx="${f.x(nashPrice)}" cy="${f.y(nashPrice)}" r="5"></circle>
          <circle class="good-point" cx="${f.x(br1)}" cy="${f.y(s.p2)}" r="4"></circle>
          <circle class="good-point" cx="${f.x(s.p1)}" cy="${f.y(br2)}" r="4"></circle>
          <text class="curve-label" x="${f.x((100 + s.diff * 82 + s.mc) / 2)}" y="${f.y(82) - 8}">Firm 1 BR</text>
          <text class="curve-label" x="${f.x(62)}" y="${f.y((100 + s.diff * 62 + s.mc) / 2) + 18}">Firm 2 BR</text>
          <text class="point-label" x="${f.x(s.p1) + 8}" y="${f.y(s.p2) - 10}">Current prices</text>
          <text class="point-label" x="${f.x(nashPrice) + 8}" y="${f.y(nashPrice) + 18}">Nash</text>
        `);
        return { visualTitle: "Best-Response Curves", visualNote: "A Nash price pair is where both firms sit on their best-response curves at the same time.", visual, stats: [makeStat(fmt.wholeMoney(pi1), "Firm 1 profit"), makeStat(fmt.wholeMoney(pi2), "Firm 2 profit"), makeStat(fmt.money(br1), "Firm 1 best response"), makeStat(fmt.money(br2), "Firm 2 best response"), makeStat(fmt.money(nashPrice), "Symmetric Nash price")], intuition: "A Nash price pair occurs when each firm's chosen price is its best response to the other's price. Moving toward either green point fixes one firm's incentive at a time.", quiz: commonQuiz("Compare each price with its best response", "Only compare market shares", "Price competition is strategic because your best price depends on your rival's price.") };
      }
    };
  }

  addRemainingTools();

  function controlHtml(control, value) {
    if (control.type === "range") {
      return html`
        <label class="range-control" for="${control.id}">
          <span>${control.label}</span>
          <input id="${control.id}" data-control="${control.id}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}">
          <output id="${control.id}-output"></output>
        </label>
      `;
    }
    if (control.type === "select") {
      return html`
        <label class="range-control" for="${control.id}">
          <span>${control.label}</span>
          <select id="${control.id}" data-control="${control.id}">
            ${control.options.map(([v, label]) => `<option value="${v}" ${v === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
          <output id="${control.id}-output"></output>
        </label>
      `;
    }
    return html`
      <fieldset class="segmented-control">
        <legend>${control.label}</legend>
        ${control.options.map(([v, label]) => `<label><input data-control="${control.id}" type="radio" name="${control.id}" value="${v}" ${v === value ? "checked" : ""}><span>${label}</span></label>`).join("")}
      </fieldset>
    `;
  }

  function readState(tool) {
    const state = {};
    tool.controls.forEach((control) => {
      if (control.type === "range") state[control.id] = Number(document.querySelector(`[data-control="${control.id}"]`).value);
      else if (control.type === "select") state[control.id] = document.querySelector(`[data-control="${control.id}"]`).value;
      else state[control.id] = document.querySelector(`[name="${control.id}"]:checked`).value;
    });
    return state;
  }

  function writeOutputs(tool, state) {
    tool.controls.forEach((control) => {
      const out = document.getElementById(`${control.id}-output`);
      if (!out) return;
      if (control.type === "range") {
        const isMoney = /price|cost|fee|premium|wage|rental|value|intercept|tax|revenue|wealth|loss|commission|offer|amount/i.test(control.label);
        const isPct = /percent|probability|coverage|share/i.test(control.label);
        if (control.id === "tax" && state.taxType === "percent") out.value = `${state[control.id]}%`;
        else out.value = isPct ? `${state[control.id]}%` : isMoney ? fmt.money(state[control.id]) : String(state[control.id]);
      } else {
        const option = control.options.find(([v]) => v === state[control.id]);
        out.value = option ? option[1] : state[control.id];
      }
    });
  }

  function initTopicPage() {
    const slug = document.body.dataset.topic;
    const tool = tools[slug];
    if (!tool) return;
    document.title = `${tool.title} | Interactive Learning Tools`;
    document.getElementById("tool-title").textContent = tool.title;
    document.getElementById("tool-subtitle").textContent = tool.subtitle;
    document.getElementById("controls-grid").innerHTML = tool.controls.map((c) => controlHtml(c, c.value)).join("");

    const render = () => {
      const state = readState(tool);
      writeOutputs(tool, state);
      const result = tool.render(state);
      document.getElementById("visual-heading").textContent = result.visualTitle;
      document.getElementById("visual-note").textContent = result.visualNote;
      document.getElementById("visual-content").innerHTML = result.visual;
      document.querySelector(".outcomes-heading h2").textContent = result.summaryTitle || "Equilibrium Outcomes";
      document.getElementById("stats-grid").innerHTML = result.stats.map((s) => `<div class="stat-block"><span class="stat-value">${s.value}</span><span class="stat-label">${s.label}</span></div>`).join("");
      document.getElementById("intuition-box").textContent = result.intuition;
      renderQuiz(result.quiz, document.getElementById("quiz-grid"));
    };

    document.getElementById("controls-grid").addEventListener("input", render);
    document.getElementById("controls-grid").addEventListener("change", render);
    document.getElementById("reset-button").addEventListener("click", () => {
      tool.controls.forEach((control) => {
        if (control.type === "range" || control.type === "select") document.querySelector(`[data-control="${control.id}"]`).value = control.value;
        else document.querySelectorAll(`[name="${control.id}"]`).forEach((input) => { input.checked = input.value === control.value; });
      });
      render();
    });
    render();
  }

  window.MGT404_TOOLS = { topicList, tools };
  if (document.body && document.body.dataset.topic) {
    initTopicPage();
  }
})();
