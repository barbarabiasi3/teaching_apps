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
    ["single-unit-price-discrimination", "Single-Unit Price Discrimination", "Compare uniform and segmented prices."],
    ["two-part-tariffs", "Two-Part Tariffs", "Set usage and membership fees to extract surplus."],
    ["quantity-screening-menu-pricing", "Quantity Screening and Menu Pricing", "Design menus that make types self-select."],
    ["risk-aversion-insurance", "Risk Aversion and Insurance", "Compare expected value, certainty equivalent, and insurance."],
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

  function chart(width, height, body, extraClass = "") {
    return `<svg class="market-chart mini-chart ${extraClass}" viewBox="0 0 ${width} ${height}" role="img">${body}</svg>`;
  }

  function frame(width, height, xMax, yMax) {
    const margin = { l: 58, r: 22, t: 24, b: 42 };
    const w = width - margin.l - margin.r;
    const h = height - margin.t - margin.b;
    const x = (v) => margin.l + (v / xMax) * w;
    const y = (v) => margin.t + ((yMax - v) / yMax) * h;
    const axis = html`
      <line class="axis" x1="${margin.l}" y1="${margin.t + h}" x2="${margin.l + w}" y2="${margin.t + h}"></line>
      <line class="axis" x1="${margin.l}" y1="${margin.t}" x2="${margin.l}" y2="${margin.t + h}"></line>
      <text class="axis-label" x="${margin.l + w / 2}" y="${height - 8}" text-anchor="middle">Quantity</text>
      <text class="axis-label" x="16" y="${margin.t + h / 2}" text-anchor="middle" transform="rotate(-90 16 ${margin.t + h / 2})">Price</text>
    `;
    return { margin, w, h, x, y, axis };
  }

  function linePath(points, f) {
    return points.map((p) => `${f.x(p[0]).toFixed(2)},${f.y(p[1]).toFixed(2)}`).join(" ");
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
    const xMax = Math.max(60, Math.ceil(eq.q * 1.8 / 10) * 10);
    const yMax = Math.max(100, Math.ceil(Math.max(a, c + d * xMax) / 25) * 25);
    const f = frame(760, 420, xMax, yMax);
    const demandEnd = Math.min(xMax, a / b);
    const csPoints = linePath([[0, a], [0, eq.p], [eq.q, eq.p]], f);
    const psPoints = linePath([[0, c], [0, eq.p], [eq.q, eq.p]], f);
    return chart(760, 420, html`
      ${f.axis}
      <polygon class="area-cs" points="${csPoints}"></polygon>
      <polygon class="area-ps" points="${psPoints}"></polygon>
      <line class="demand-line" x1="${f.x(0)}" y1="${f.y(a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(a, b, demandEnd)))}"></line>
      <line class="supply-line" x1="${f.x(0)}" y1="${f.y(c)}" x2="${f.x(xMax)}" y2="${f.y(linearSupply(c, d, xMax))}"></line>
      <line class="guide-line" x1="${f.x(eq.q)}" y1="${f.y(eq.p)}" x2="${f.x(eq.q)}" y2="${f.margin.t + f.h}"></line>
      <line class="guide-line" x1="${f.margin.l}" y1="${f.y(eq.p)}" x2="${f.x(eq.q)}" y2="${f.y(eq.p)}"></line>
      <circle class="eq-point" cx="${f.x(eq.q)}" cy="${f.y(eq.p)}" r="5"></circle>
      <text class="curve-label" x="${f.x(xMax * 0.68)}" y="${f.y(linearDemand(a, b, xMax * 0.68)) - 8}">Demand</text>
      <text class="curve-label" x="${f.x(xMax * 0.62)}" y="${f.y(linearSupply(c, d, xMax * 0.62)) - 8}">Supply</text>
      ${extras}
    `);
  }

  function demandOnlyChart(a, b, price, extras = "") {
    const q = Math.max(0, (a - price) / b);
    const xMax = Math.max(40, Math.ceil((a / b) / 10) * 10);
    const yMax = Math.max(100, Math.ceil(Math.max(a, price) / 25) * 25);
    const f = frame(720, 380, xMax, yMax);
    const csPoints = linePath([[0, a], [0, price], [q, price]], f);
    const revenuePoints = linePath([[0, 0], [q, 0], [q, price], [0, price]], f);
    const demandEnd = Math.min(xMax, a / b);
    return chart(720, 380, html`
      ${f.axis}
      <polygon class="area-revenue" points="${revenuePoints}"></polygon>
      <polygon class="area-cs" points="${csPoints}"></polygon>
      <line class="demand-line" x1="${f.x(0)}" y1="${f.y(a)}" x2="${f.x(demandEnd)}" y2="${f.y(Math.max(0, linearDemand(a, b, demandEnd)))}"></line>
      <line class="guide-line" x1="${f.margin.l}" y1="${f.y(price)}" x2="${f.x(q)}" y2="${f.y(price)}"></line>
      <line class="guide-line" x1="${f.x(q)}" y1="${f.y(price)}" x2="${f.x(q)}" y2="${f.margin.t + f.h}"></line>
      <circle class="eq-point" cx="${f.x(q)}" cy="${f.y(price)}" r="5"></circle>
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
        return {
          visualTitle: "Point Elasticity on Demand",
          visualNote: "Move price along the same line and elasticity changes.",
          visual: demandOnlyChart(s.a, s.b, s.price),
          stats: [makeStat(fmt.number(q), "Quantity"), makeStat(fmt.number(e, 2), "Elasticity magnitude"), makeStat(region, "Region"), makeStat(fmt.wholeMoney(revenue), "Revenue")],
          intuition: `At this point demand is ${region}. A price increase ${e > 1 ? "lowers" : "raises"} revenue locally because quantity ${e > 1 ? "responds strongly" : "does not respond much"}.`,
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
        const xMax = 100;
        const yMax = 150;
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
        const xMax = Math.max(70, Math.ceil(Math.max(privateEq.q, socialEq.q, policyEq.q) * 1.8 / 10) * 10);
        const yMax = Math.max(140, Math.ceil(Math.max(s.a, s.c + Math.max(s.mec, s.tax) + d * xMax) / 25) * 25);
        const f = frame(760, 420, xMax, yMax);
        const demandEnd = Math.min(xMax, s.a / b);
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
          <text class="curve-label" x="${f.x(xMax * 0.64)}" y="${f.y(linearDemand(s.a, b, xMax * 0.64)) - 8}">Demand</text>
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
      controls: [range("hs", "Home syrup output", 20, 100, 5, 60), range("ho", "Home oil output", 20, 100, 5, 30), range("fs", "Foreign syrup output", 20, 100, 5, 30), range("fo", "Foreign oil output", 20, 100, 5, 70), range("terms", "Trade price: oil per syrup", 0.3, 2.5, 0.1, 1.0)],
      render(s) {
        const homeOcS = s.ho / s.hs;
        const foreignOcS = s.fo / s.fs;
        const homeAdv = homeOcS < foreignOcS ? "syrup" : "oil";
        const foreignAdv = homeAdv === "syrup" ? "oil" : "syrup";
        const goodTerms = s.terms > Math.min(homeOcS, foreignOcS) && s.terms < Math.max(homeOcS, foreignOcS);
        const ppf = chart(720, 360, html`
          <line class="axis" x1="60" y1="300" x2="660" y2="300"></line><line class="axis" x1="60" y1="40" x2="60" y2="300"></line>
          <line class="demand-line" x1="60" y1="300" x2="330" y2="90"></line><line class="supply-line" x1="60" y1="300" x2="620" y2="70"></line>
          <text class="curve-label" x="320" y="92">Home PPF</text><text class="curve-label" x="560" y="74">Foreign PPF</text>
          <text class="axis-label" x="360" y="340" text-anchor="middle">Syrup</text><text class="axis-label" x="20" y="180" transform="rotate(-90 20 180)">Oil</text>
        `);
        return { visualTitle: "Production Possibilities", visualNote: "Lower opportunity cost determines comparative advantage.", visual: ppf, stats: [makeStat(fmt.number(homeOcS, 2), "Home OC of syrup"), makeStat(fmt.number(foreignOcS, 2), "Foreign OC of syrup"), makeStat(`Home: ${homeAdv}`, "Home comparative advantage"), makeStat(goodTerms ? "Yes" : "No", "Trade terms can benefit both")], intuition: `Home should specialize in ${homeAdv}; Foreign should specialize in ${foreignAdv}. Trade is mutually attractive when the trade price lies between opportunity costs.`, quiz: commonQuiz("Opportunity cost", "Absolute output alone", "Comparative advantage is about what each side gives up to produce one more unit.") };
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
        const xMax = Math.max(60, Math.ceil(Math.max(qdWorld, qd, qs) * 1.15 / 10) * 10);
        const yMax = Math.max(120, Math.ceil(Math.max(s.a, p, s.c + d * xMax) / 25) * 25);
        const f = frame(760, 420, xMax, yMax);
        const demandEnd = Math.min(xMax, s.a / b);
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
          <text class="curve-label" x="${f.x(xMax * 0.82)}" y="${f.y(linearDemand(s.a, b, xMax * 0.82)) + 18}">Demand</text>
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
        const xMax = Math.max(40, Math.ceil(Math.max(q * 1.8, 20) / 10) * 10);
        const mc = (x) => s.base + 2 * s.curvature * x;
        const atc = (x) => s.base + s.curvature * x + s.fixed / Math.max(1, x);
        const yMax = Math.max(100, Math.ceil(Math.max(s.price, atcAtQ, mc(xMax), atc(Math.max(5, xMax * 0.18))) / 25) * 25);
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
        const advise = mplDollar > mpkDollar ? "Use more labor, less capital" : "Use more capital, less labor";
        return { visualTitle: "Input Mix", visualNote: "At the optimum, marginal product per dollar is equal across inputs.", visual: `<div class="bar-list"><div style="width:${Math.min(100, s.labor)}%">Labor ${fmt.number(s.labor)}</div><div style="width:${Math.min(100, kNeeded)}%">Capital ${fmt.number(kNeeded)}</div></div>`, stats: [makeStat(fmt.number(kNeeded), "Capital needed"), makeStat(fmt.wholeMoney(cost), "Total cost"), makeStat(fmt.number(mplDollar, 3), "MP_L per dollar"), makeStat(fmt.number(mpkDollar, 3), "MP_K per dollar")], intuition: `${advise}. The cheaper productive input should be used more until marginal product per dollar is equalized.`, quiz: commonQuiz("Marginal product per dollar", "Total units of each input", "Cost minimization compares extra output per dollar spent on each input.") };
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
        const xMax = Math.max(60, Math.ceil(Math.max(s.q, qOpt, qComp) * 1.25 / 10) * 10);
        const yMax = Math.max(120, Math.ceil(Math.max(s.a, p, s.mc) / 25) * 25);
        const f = frame(760, 420, xMax, yMax);
        const demandEnd = Math.min(xMax, qChoke);
        const mrEnd = Math.min(xMax, s.a / (2 * s.b));
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
          <text class="curve-label" x="${f.x(xMax * 0.62)}" y="${f.y(linearDemand(s.a, s.b, xMax * 0.62)) - 8}">Demand</text>
          <text class="curve-label" x="${f.x(xMax * 0.30)}" y="${f.y(s.a - 2 * s.b * xMax * 0.30) - 8}">MR</text>
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
      controls: [range("epsilon", "Elasticity magnitude", 1.1, 8, 0.1, 2.5), range("mc", "Marginal cost", 5, 100, 5, 40)],
      render(s) {
        const p = s.mc * s.epsilon / (s.epsilon - 1);
        const markup = (p - s.mc) / p;
        return { visualTitle: "Markup from Elasticity", visualNote: "The rule only makes sense in the elastic region.", visual: `<div class="bar-list"><div style="width:${Math.min(100, markup * 100)}%">Markup ${fmt.pct(markup)}</div><div style="width:${Math.min(100, s.mc)}%">Marginal cost ${fmt.money(s.mc)}</div></div>`, stats: [makeStat(fmt.money(p), "Recommended price"), makeStat(fmt.pct(markup), "Price-cost margin"), makeStat(fmt.number(s.epsilon, 2), "Elasticity magnitude"), makeStat(s.epsilon <= 1.2 ? "Dangerously inelastic" : "Elastic region", "Pricing region")], intuition: "High markups require customers who do not respond much to price. If demand is too inelastic at the current point, raising price increases revenue.", quiz: commonQuiz("Less elastic demand supports higher markup", "More elastic demand supports higher markup", "The inverse elasticity rule links market power directly to demand responsiveness.") };
      }
    };
  }

  function singleUnitPdTool() {
    return {
      title: "Single-Unit Price Discrimination",
      subtitle: "Segment pricing works when groups can be separated and resale is limited.",
      controls: [range("aValue", "Segment A willingness to pay", 40, 160, 5, 120), range("aSize", "Segment A customers", 10, 100, 5, 50), range("bValue", "Segment B willingness to pay", 20, 120, 5, 70), range("bSize", "Segment B customers", 10, 100, 5, 50), range("mc", "Marginal cost", 0, 80, 5, 25), segmented("arbitrage", "Resale/arbitrage", "no", [["no", "Blocked"], ["yes", "Possible"]])],
      render(s) {
        const priceHigh = s.aValue;
        const priceLow = s.bValue;
        const uniformHigh = Math.max(0, priceHigh - s.mc) * s.aSize;
        const uniformLow = Math.max(0, priceLow - s.mc) * (s.aSize + s.bSize);
        const uniform = Math.max(uniformHigh, uniformLow);
        const segmentedProfit = s.arbitrage === "yes" ? uniform : Math.max(0, priceHigh - s.mc) * s.aSize + Math.max(0, priceLow - s.mc) * s.bSize;
        const uniformPrice = uniformHigh >= uniformLow ? priceHigh : priceLow;
        const uniformCustomers = uniformHigh >= uniformLow ? s.aSize : s.aSize + s.bSize;
        const maxCustomers = Math.max(s.aSize + s.bSize, 1);
        const maxMargin = Math.max(priceHigh - s.mc, priceLow - s.mc, uniformPrice - s.mc, 1);
        const rect = (x, yBase, customers, margin, label) => {
          const width = Math.max(0, customers / maxCustomers * 500);
          const height = Math.max(0, margin / maxMargin * 70);
          return html`
            <rect class="area-profit" x="${x}" y="${yBase - height}" width="${width}" height="${height}"></rect>
            <text class="point-label" x="${x + 8}" y="${yBase - height - 8}">${label}</text>
          `;
        };
        const segmentedShapes = s.arbitrage === "yes" ? rect(120, 250, uniformCustomers, Math.max(0, uniformPrice - s.mc), "arbitrage forces one price") : html`
          ${rect(120, 250, s.aSize, Math.max(0, priceHigh - s.mc), "Segment A")}
          ${rect(120 + s.aSize / maxCustomers * 500 + 8, 250, s.bSize, Math.max(0, priceLow - s.mc), "Segment B")}
        `;
        const visual = chart(720, 340, html`
          <line class="axis" x1="110" y1="120" x2="640" y2="120"></line>
          <line class="axis" x1="110" y1="250" x2="640" y2="250"></line>
          <text class="curve-label" x="34" y="124">Uniform</text>
          <text class="curve-label" x="24" y="254">Segmented</text>
          ${rect(120, 120, uniformCustomers, Math.max(0, uniformPrice - s.mc), "one price")}
          ${segmentedShapes}
          <text class="axis-label" x="375" y="318" text-anchor="middle">Profit rectangles: customers times price-cost margin</text>
        `);
        return { visualTitle: "Uniform vs Segment Prices", visualNote: "Arbitrage collapses segment prices toward a single effective price.", visual, stats: [makeStat(fmt.wholeMoney(uniform), "Best uniform profit"), makeStat(fmt.wholeMoney(segmentedProfit), "Segment pricing profit"), makeStat(s.arbitrage === "yes" ? "No" : "Yes", "Discrimination feasible"), makeStat(fmt.money(s.mc), "Marginal cost")], intuition: "Price discrimination needs market power, identifiable segments, and limited resale. Without those, customers route around the menu.", quiz: commonQuiz("Whether segments can be separated without arbitrage", "Whether all customers have identical WTP", "Segment pricing only works when low-price customers cannot resell or masquerade as high-price customers.") };
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
        const xMax = Math.max(40, Math.ceil((s.a / s.b) / 10) * 10);
        const yMax = Math.max(120, Math.ceil(Math.max(s.a, s.usage, s.mc) / 25) * 25);
        const f = frame(720, 380, xMax, yMax);
        const demandEnd = Math.min(xMax, s.a / s.b);
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
          <text class="curve-label" x="${f.x(xMax * 0.62)}" y="${f.y(linearDemand(s.a, s.b, xMax * 0.62)) - 8}">Demand</text>
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
      controls: [range("smallPrice", "Small bundle price", 10, 120, 5, 50), range("largePrice", "Large bundle price", 40, 220, 5, 130), range("lowValue", "Low-type value for large", 40, 160, 5, 90), range("highValue", "High-type value for large", 80, 260, 5, 180), range("smallValue", "Both types value small", 20, 140, 5, 80)],
      render(s) {
        const lowSmall = s.smallValue - s.smallPrice, lowLarge = s.lowValue - s.largePrice;
        const highSmall = s.smallValue - s.smallPrice, highLarge = s.highValue - s.largePrice;
        const lowChoice = Math.max(0, lowSmall, lowLarge) === lowLarge ? "large" : Math.max(0, lowSmall, lowLarge) === lowSmall ? "small" : "none";
        const highChoice = Math.max(0, highSmall, highLarge) === highLarge ? "large" : Math.max(0, highSmall, highLarge) === highSmall ? "small" : "none";
        const profit = (lowChoice === "small" ? s.smallPrice : lowChoice === "large" ? s.largePrice : 0) + (highChoice === "small" ? s.smallPrice : highChoice === "large" ? s.largePrice : 0);
        const chosenValue = (type) => {
          if (type === "low") return lowChoice === "small" ? s.smallValue : lowChoice === "large" ? s.lowValue : 0;
          return highChoice === "small" ? s.smallValue : highChoice === "large" ? s.highValue : 0;
        };
        const chosenPrice = (type) => {
          if (type === "low") return lowChoice === "small" ? s.smallPrice : lowChoice === "large" ? s.largePrice : 0;
          return highChoice === "small" ? s.smallPrice : highChoice === "large" ? s.largePrice : 0;
        };
        const maxValue = Math.max(s.highValue, s.lowValue, s.smallValue, s.largePrice, 1);
        const drawType = (label, choice, value, price, y) => {
          const scale = 520 / maxValue;
          const paidWidth = Math.max(0, Math.min(price, value)) * scale;
          const surplusWidth = Math.max(0, value - price) * scale;
          return html`
            <text class="curve-label" x="56" y="${y - 12}">${label}: ${choice}</text>
            <rect x="150" y="${y - 34}" width="${value * scale}" height="38" fill="none" stroke="#d9e2ec"></rect>
            <rect class="area-revenue" x="150" y="${y - 34}" width="${paidWidth}" height="38"></rect>
            <rect class="area-cs" x="${150 + paidWidth}" y="${y - 34}" width="${surplusWidth}" height="38"></rect>
            <text class="point-label" x="156" y="${y - 10}">paid ${fmt.wholeMoney(price)}</text>
            <text class="point-label" x="${156 + paidWidth + Math.min(20, surplusWidth)}" y="${y - 10}">surplus ${fmt.wholeMoney(Math.max(0, value - price))}</text>
          `;
        };
        const visual = chart(720, 300, html`
          <line class="axis" x1="150" y1="246" x2="670" y2="246"></line>
          <text class="axis-label" x="410" y="282" text-anchor="middle">Value split into payment and information rent</text>
          ${drawType("Low type", lowChoice, chosenValue("low"), chosenPrice("low"), 105)}
          ${drawType("High type", highChoice, chosenValue("high"), chosenPrice("high"), 185)}
        `);
        return { visualTitle: "Self-Selection Menu", visualNote: "Gold is price paid; blue is surplus left so each type self-selects.", visual, stats: [makeStat(lowChoice, "Low-type choice"), makeStat(highChoice, "High-type choice"), makeStat(fmt.wholeMoney(profit), "Revenue from one of each type"), makeStat(highLarge - highSmall > 0 ? "Large attracts high type" : "High type tempted by small", "Incentive check")], intuition: "The hard part is not just extracting value; it is leaving enough information rent so high-demand customers choose the intended option.", quiz: commonQuiz("Which option each type voluntarily chooses", "Which option has the highest posted price", "Screening works through self-selection, not labels.") };
      }
    };
  }

  function riskTool() {
    return {
      title: "Risk Aversion and Insurance",
      subtitle: "Risk-averse people may give up expected value for certainty.",
      controls: [range("wealth", "Initial wealth", 100, 1000, 50, 500), range("loss", "Loss if bad state occurs", 50, 800, 25, 300), range("prob", "Probability of loss (%)", 5, 80, 5, 25), range("coverage", "Insurance coverage (%)", 0, 100, 5, 80), range("premium", "Insurance premium", 0, 300, 10, 90)],
      render(s) {
        const p = s.prob / 100, cov = s.coverage / 100;
        const good = s.wealth - s.premium;
        const bad = s.wealth - s.loss + cov * s.loss - s.premium;
        const ev = (1 - p) * good + p * bad;
        const eu = (1 - p) * Math.sqrt(Math.max(0, good)) + p * Math.sqrt(Math.max(0, bad));
        const ce = eu * eu;
        const uninsuredEv = s.wealth - p * s.loss;
        return { visualTitle: "Risky Wealth Distribution", visualNote: "Insurance compresses the gap between good and bad states.", visual: `<div class="bar-list"><div style="width:${Math.min(100, good / 10)}%">Good state ${fmt.wholeMoney(good)}</div><div style="width:${Math.min(100, bad / 10)}%">Bad state ${fmt.wholeMoney(bad)}</div></div>`, stats: [makeStat(fmt.wholeMoney(ev), "Expected wealth"), makeStat(fmt.wholeMoney(ce), "Certainty equivalent"), makeStat(fmt.wholeMoney(ev - ce), "Risk premium"), makeStat(fmt.wholeMoney(uninsuredEv), "Uninsured expected wealth")], intuition: "Risk aversion means the certainty equivalent is below expected value. Insurance can be valuable even when it is not a positive expected-value bet.", quiz: commonQuiz("Certainty equivalent compared with expected value", "Only the best possible state", "Risk aversion is about utility over uncertain wealth, not just average dollars.") };
      }
    };
  }

  function lemonsTool() {
    return {
      title: "Adverse Selection and Lemons",
      subtitle: "When quality is hidden, price changes which types participate.",
      controls: [range("price", "Market price", 1000, 10000, 500, 5000), range("goodShare", "Good-car share (%)", 10, 90, 5, 50), range("goodValue", "Buyer value for good car", 5000, 15000, 500, 10000), range("badValue", "Buyer value for lemon", 500, 8000, 500, 3000), range("goodCost", "Good seller reservation price", 3000, 12000, 500, 7000), range("badCost", "Lemon seller reservation price", 500, 7000, 500, 2000)],
      render(s) {
        const goodSupply = s.price >= s.goodCost ? s.goodShare / 100 : 0;
        const badSupply = s.price >= s.badCost ? 1 - s.goodShare / 100 : 0;
        const totalSupply = goodSupply + badSupply;
        const expectedValue = totalSupply > 0 ? (goodSupply * s.goodValue + badSupply * s.badValue) / totalSupply : 0;
        const demand = expectedValue >= s.price && totalSupply > 0;
        return { visualTitle: "Hidden Quality at One Price", visualNote: "The market price affects which sellers show up, which affects buyer expectations.", visual: `<div class="bar-list"><div style="width:${goodSupply * 100}%">Good cars supplied</div><div style="width:${badSupply * 100}%">Lemons supplied</div></div>`, stats: [makeStat(fmt.wholeMoney(expectedValue), "Buyer expected value"), makeStat(demand ? "Buy" : "Do not buy", "Buyer decision"), makeStat(fmt.pct(totalSupply), "Potential sellers active"), makeStat(goodSupply > 0 && badSupply > 0 ? "Pooling" : goodSupply > 0 ? "Only good" : badSupply > 0 ? "Only lemons" : "No sellers", "Market composition")], intuition: "If price attracts mostly low-quality sellers, buyers lower their expected value and demand can collapse.", quiz: commonQuiz("How price changes the mix of hidden types", "Only the average quality before sellers respond", "Adverse selection is dynamic: participation changes the pool buyers face.") };
      }
    };
  }

  function signalingTool() {
    return {
      title: "Signaling and Screening",
      subtitle: "A useful signal is cheaper for high-quality types than low-quality types.",
      controls: [range("premium", "Price premium from signal", 0, 2000, 100, 900), range("warranty", "Warranty length", 0, 5, 0.5, 2), range("goodCost", "Good type warranty cost/year", 50, 800, 50, 150), range("badCost", "Bad type warranty cost/year", 200, 1500, 50, 600)],
      render(s) {
        const goodNet = s.premium - s.warranty * s.goodCost;
        const badNet = s.premium - s.warranty * s.badCost;
        const separating = goodNet >= 0 && badNet < 0;
        return { visualTitle: "Signal Payoff by Type", visualNote: "A separating signal attracts good types but deters bad types.", visual: `<div class="bar-list"><div style="width:${Math.max(2, clamp(goodNet / 20, 0, 100))}%">Good type net ${fmt.wholeMoney(goodNet)}</div><div style="width:${Math.max(2, clamp(badNet / 20, 0, 100))}%">Bad type net ${fmt.wholeMoney(badNet)}</div></div>`, stats: [makeStat(fmt.wholeMoney(goodNet), "Good type net benefit"), makeStat(fmt.wholeMoney(badNet), "Bad type net benefit"), makeStat(separating ? "Separating" : "Pooling or no signal", "Outcome"), makeStat(fmt.number(s.warranty), "Warranty years")], intuition: "Signals work when the cost difference is large enough that high-quality sellers want the signal and low-quality sellers do not.", quiz: commonQuiz("Whether the signal is differentially costly by type", "Whether the signal is expensive for everyone", "A costly signal must separate types, not merely burn money.") };
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
        const incentive = s.commission * deltaP;
        const maxDollar = Math.max(s.revenue, s.commission, s.effortCost, principalProfit, incentive, 1);
        const w = (v) => Math.max(0, Math.min(520, v / maxDollar * 520));
        const visual = chart(720, 300, html`
          <line class="axis" x1="130" y1="236" x2="660" y2="236"></line>
          <text class="curve-label" x="44" y="90">Agent</text>
          <rect class="area-profit" x="130" y="66" width="${w(incentive)}" height="34"></rect>
          <rect class="area-loss" x="130" y="112" width="${w(s.effortCost)}" height="34"></rect>
          <text class="point-label" x="138" y="88">expected incentive ${fmt.money(incentive)}</text>
          <text class="point-label" x="138" y="134">effort cost ${fmt.money(s.effortCost)}</text>
          <text class="curve-label" x="30" y="198">Principal</text>
          <rect class="${principalProfit >= 0 ? "area-profit" : "area-loss"}" x="130" y="174" width="${w(Math.abs(principalProfit))}" height="34"></rect>
          <text class="point-label" x="138" y="196">expected profit ${fmt.money(principalProfit)}</text>
          <text class="axis-label" x="395" y="278" text-anchor="middle">Expected dollars from the contract</text>
        `);
        return { visualTitle: "Incentive Constraint", visualNote: "High effort occurs when expected commission gain covers effort cost.", visual, stats: [makeStat(high ? "High effort" : "Low effort", "Agent choice"), makeStat(fmt.money(agentPay), "Agent expected payoff"), makeStat(fmt.money(principalProfit), "Principal expected profit"), makeStat(fmt.pct(prob), "Sale probability")], intuition: "The principal cannot directly choose effort; the contract changes the agent's private tradeoff.", quiz: commonQuiz("The agent's incentive constraint", "The principal's preferred effort only", "Moral hazard is about hidden actions chosen after the contract is set.") };
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
        return { visualTitle: "Two Equilibria", visualNote: "Both diagonal cells can be Nash equilibria.", visual: payoffMatrix("Coordination Payoffs", ["New standard", "Old standard"], ["New standard", "Old standard"], cells, ["0-0", "1-1"]), stats: [makeStat("New/New", "Payoff-dominant"), makeStat(s.mismatch < 0 ? "Old/Old may feel safer" : "New/New easier to reach", "Coordination risk"), makeStat(s.risky - s.safe, "Gain from moving together")], intuition: "Coordination games are hard because everyone may prefer the same new outcome but hesitate if mismatch is costly.", quiz: commonQuiz("Whether each player expects the other to coordinate", "Only which outcome has the highest payoff", "The problem is expectations, not just preferences.") };
      }
    };
  }

  function sequentialTool() {
    return {
      title: "Sequential Games and Backward Induction",
      subtitle: "Solve from the end of the tree backward.",
      controls: [range("investGain", "Value if supplier invests", 20, 120, 5, 80), range("investCost", "Supplier investment cost", 0, 80, 5, 30), range("buyerOffer", "Buyer ex post offer", 0, 120, 5, 35)],
      render(s) {
        const supplierAccepts = s.buyerOffer >= 0;
        const supplierInvests = supplierAccepts && s.buyerOffer - s.investCost >= 0;
        const buyerPayoff = supplierInvests ? s.investGain - s.buyerOffer : 0;
        const supplierPayoff = supplierInvests ? s.buyerOffer - s.investCost : 0;
        return { visualTitle: "Hold-Up Style Game Tree", visualNote: "The supplier looks ahead to the buyer's ex post offer before investing.", visual: `<div class="tree-diagram"><div>Supplier: invest?</div><div class="tree-branch">If invest -> Buyer offers ${fmt.money(s.buyerOffer)}</div><div class="tree-branch">Outcome: ${supplierInvests ? "Invest and trade" : "No investment"}</div></div>`, stats: [makeStat(supplierInvests ? "Invest" : "Do not invest", "Backward-induction prediction"), makeStat(fmt.money(buyerPayoff), "Buyer payoff"), makeStat(fmt.money(supplierPayoff), "Supplier payoff"), makeStat(fmt.money(s.investCost), "Sunk investment cost")], intuition: "Backward induction asks what the later mover will do, then uses that answer to predict the first mover's choice.", quiz: commonQuiz("Start at the final decision node", "Start with the biggest total surplus", "Sequential games are solved from future incentives back to current choices.") };
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
        const maxQ = Math.max(120, q1, q2);
        const maxMargin = Math.max(60, Math.abs(s.p1 - s.mc), Math.abs(s.p2 - s.mc));
        const drawFirm = (label, price, q, profit, x0) => {
          const width = Math.max(2, Math.min(240, q / maxQ * 240));
          const margin = price - s.mc;
          const height = Math.max(2, Math.min(150, Math.abs(margin) / maxMargin * 150));
          const baseY = 220;
          const y = margin >= 0 ? baseY - height : baseY;
          return html`
            <g>
              <text class="curve-label" x="${x0}" y="56">${label}</text>
              <line class="axis" x1="${x0}" y1="${baseY}" x2="${x0 + 260}" y2="${baseY}"></line>
              <line class="axis" x1="${x0}" y1="58" x2="${x0}" y2="336"></line>
              <rect class="${profit >= 0 ? "area-profit" : "area-loss"}" x="${x0}" y="${y}" width="${width}" height="${height}"></rect>
              <line class="tax-adjusted-line" x1="${x0}" y1="${baseY - (price - s.mc) / maxMargin * 150}" x2="${x0 + width}" y2="${baseY - (price - s.mc) / maxMargin * 150}"></line>
              <text class="point-label" x="${x0 + 8}" y="${margin >= 0 ? y - 8 : y + height + 18}">profit ${fmt.wholeMoney(profit)}</text>
              <text class="point-label" x="${x0 + 8}" y="342">Q ${fmt.number(q)}</text>
            </g>
          `;
        };
        const visual = chart(720, 380, html`
          ${drawFirm("Firm 1", s.p1, q1, pi1, 80)}
          ${drawFirm("Firm 2", s.p2, q2, pi2, 400)}
          <text class="axis-label" x="360" y="366" text-anchor="middle">Profit area = quantity times price-cost margin</text>
        `);
        return { visualTitle: "Prices and Best Responses", visualNote: "With differentiated products, rival price affects your demand.", visual, stats: [makeStat(fmt.wholeMoney(pi1), "Firm 1 profit"), makeStat(fmt.wholeMoney(pi2), "Firm 2 profit"), makeStat(fmt.money(br1), "Firm 1 best response"), makeStat(fmt.money(br2), "Firm 2 best response")], intuition: "A Nash price pair occurs when each firm's chosen price is its best response to the other's price.", quiz: commonQuiz("Compare each price with its best response", "Only compare market shares", "Price competition is strategic because your best price depends on your rival's price.") };
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
