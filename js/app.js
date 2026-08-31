'use strict';

/* =========================================================
   Utilities
   ========================================================= */

const rupee = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a numeric text value from `from` to `to` using requestAnimationFrame.
 * `format` receives the current interpolated number and returns a string.
 */
function animateNumber(el, from, to, duration, format = (v) => Math.round(v).toString()) {
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const t = clamp(elapsed / duration, 0, 1);
    const eased = easeOutCubic(t);
    const value = from + (to - from) * eased;
    el.textContent = format(value);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* =========================================================
   UPI Allowance Gauge
   ========================================================= */

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 80; // r = 80

const gauge = {
  fillEl: document.getElementById('gaugeFill'),
  amountEl: document.getElementById('gaugeAmount'),
  remainingEl: document.getElementById('remainingAmt'),
  limit: 500,
  spent: 0,
};

function setGaugeSpent(newSpent) {
  const prevSpent = gauge.spent;
  gauge.spent = clamp(newSpent, 0, gauge.limit * 1.2);

  const pct = clamp(gauge.spent / gauge.limit, 0, 1);
  const offset = GAUGE_CIRCUMFERENCE * (1 - pct);
  gauge.fillEl.style.strokeDashoffset = offset.toString();

  gauge.fillEl.classList.remove('warn', 'over');
  if (gauge.spent >= gauge.limit) {
    gauge.fillEl.classList.add('over');
  } else if (pct >= 0.85) {
    gauge.fillEl.classList.add('warn');
  }

  animateNumber(gauge.amountEl, prevSpent, gauge.spent, 700, (v) => rupee(v));

  const remaining = Math.max(gauge.limit - gauge.spent, 0);
  animateNumber(gauge.remainingEl, gauge.limit - prevSpent, remaining, 700, (v) => rupee(v));
}

/* =========================================================
   XP / Discipline streak
   ========================================================= */

const xp = {
  fillEl: document.getElementById('xpFill'),
  currentEl: document.getElementById('xpCurrent'),
  maxEl: document.getElementById('xpMax'),
  levelEl: document.getElementById('levelNum'),
  logBtn: document.getElementById('logBtn'),
  streakEl: document.getElementById('streakDays'),
  streakCountEl: document.getElementById('streakCount'),
  current: 0,
  max: 1000,
  level: 7,
  streak: 12,
};

function renderXpBar(animate = true) {
  const pct = clamp(xp.current / xp.max, 0, 1) * 100;
  xp.fillEl.style.width = pct + '%';
  if (animate) {
    xp.fillEl.classList.remove('pulse');
    // Force reflow so the animation can restart
    void xp.fillEl.offsetWidth;
    xp.fillEl.classList.add('pulse');
  }
}

function buildStreakDays() {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  xp.streakEl.innerHTML = '';
  labels.forEach((label, i) => {
    const li = document.createElement('li');
    const dot = document.createElement('div');
    dot.className = 'day-dot' + (i < 5 ? ' done' : ''); // demo: first 5 days completed
    const lbl = document.createElement('span');
    lbl.className = 'day-label';
    lbl.textContent = label;
    li.appendChild(dot);
    li.appendChild(lbl);
    xp.streakEl.appendChild(li);
  });
}

function logTodaysSave() {
  if (xp.logBtn.disabled) return;

  const gained = 60;
  const prevCurrent = xp.current;
  let newCurrent = prevCurrent + gained;
  let leveledUp = false;

  if (newCurrent >= xp.max) {
    newCurrent -= xp.max;
    xp.level += 1;
    leveledUp = true;
    animateNumber(xp.levelEl, xp.level - 1, xp.level, 500, (v) => Math.round(v).toString());
  }

  if (leveledUp) {
    // Animate a fill to full, then reset and count up from zero to the carry-over amount
    xp.current = xp.max;
    renderXpBar(true);
    animateNumber(xp.currentEl, prevCurrent, xp.max, 400, (v) => Math.round(v).toString());
    window.setTimeout(() => {
      xp.current = newCurrent;
      renderXpBar(false);
      animateNumber(xp.currentEl, 0, newCurrent, 500, (v) => Math.round(v).toString());
    }, 450);
  } else {
    xp.current = newCurrent;
    animateNumber(xp.currentEl, prevCurrent, newCurrent, 600, (v) => Math.round(v).toString());
    renderXpBar(true);
  }

  xp.streak += 1;
  animateNumber(xp.streakCountEl, xp.streak - 1, xp.streak, 500);

  xp.logBtn.disabled = true;
  xp.logBtn.textContent = "Saved for today ✓";

  // small positive nudge to the gauge's auto-saved figure
  const autoSavedEl = document.getElementById('autoSaved');
  const current = parseInt(autoSavedEl.textContent.replace(/[^\d]/g, ''), 10) || 0;
  animateNumber(autoSavedEl, current, current + 12, 600, (v) => rupee(v));
}

xp.logBtn.addEventListener('click', logTodaysSave);

/* =========================================================
   Paper Trading Sandbox — live ticker + sparklines
   ========================================================= */

const SPARK_POINTS = 18;

const stocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2934.5, history: [] },
  { symbol: 'TCS',      name: 'Tata Consultancy Services', price: 4021.1, history: [] },
  { symbol: 'ZOMATO',   name: 'Zomato Ltd', price: 268.4, history: [] },
  { symbol: 'NIFTYBEES',name: 'Nifty 50 ETF', price: 241.8, history: [] },
];

stocks.forEach((s) => {
  for (let i = 0; i < SPARK_POINTS; i++) s.history.push(s.price);
});

const tickerListEl = document.getElementById('tickerList');

function buildSparklinePath(history, width, height) {
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const step = width / (history.length - 1);

  const points = history.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return 'M' + points.join(' L');
}

function renderTickerRow(stock) {
  const li = document.createElement('li');
  li.dataset.symbol = stock.symbol;

  const spark = buildSparklinePath(stock.history, 90, 30);
  const trendColor = stock.history[stock.history.length - 1] >= stock.history[0] ? 'var(--emerald)' : 'var(--red)';

  li.innerHTML = `
    <div class="tk-name">
      <span class="tk-symbol">${stock.symbol}</span>
      <span class="tk-full">${stock.name}</span>
    </div>
    <svg class="tk-spark" viewBox="0 0 90 30" preserveAspectRatio="none" aria-hidden="true">
      <path d="${spark}" stroke="${trendColor}" />
    </svg>
    <span class="tk-price tabular">${rupee(stock.price)}</span>
    <span class="tk-change tabular">0.00%</span>
  `;
  tickerListEl.appendChild(li);
}

stocks.forEach(renderTickerRow);

function updateStockPrice(stock) {
  const prevPrice = stock.price;

  // Random walk with mild volatility proportional to price
  const volatility = stock.price * 0.006;
  const delta = (Math.random() - 0.48) * volatility * 2;
  const newPrice = Math.max(stock.price + delta, 1);

  stock.history.push(newPrice);
  if (stock.history.length > SPARK_POINTS) stock.history.shift();
  stock.price = newPrice;

  const li = tickerListEl.querySelector(`li[data-symbol="${stock.symbol}"]`);
  if (!li) return;

  const priceEl = li.querySelector('.tk-price');
  const changeEl = li.querySelector('.tk-change');
  const sparkPath = li.querySelector('.tk-spark path');

  const isUp = newPrice >= prevPrice;
  const pctChange = ((newPrice - stock.history[0]) / stock.history[0]) * 100;

  animateNumber(priceEl, prevPrice, newPrice, 500, (v) => rupee(v));

  priceEl.classList.remove('up', 'down');
  void priceEl.offsetWidth;
  priceEl.classList.add(isUp ? 'up' : 'down');

  changeEl.textContent = (pctChange >= 0 ? '+' : '') + pctChange.toFixed(2) + '%';
  changeEl.classList.remove('up', 'down');
  changeEl.classList.add(pctChange >= 0 ? 'up' : 'down');

  sparkPath.setAttribute('d', buildSparklinePath(stock.history, 90, 30));
  sparkPath.setAttribute('stroke', isUp ? 'var(--emerald)' : 'var(--red)');

  // Remove the price flash background after the transition settles
  window.setTimeout(() => priceEl.classList.remove('up', 'down'), 900);
}

function tickMarket() {
  stocks.forEach((stock) => {
    // stagger updates slightly so not every card flashes in perfect unison
    window.setTimeout(() => updateStockPrice(stock), Math.random() * 400);
  });
}

/* =========================================================
   Recent UPI activity feed
   ========================================================= */

const feedListEl = document.getElementById('feedList');

const seedTransactions = [
  { icon: '🍜', title: 'Swiggy — hostel mess skip', time: '12m ago', amount: -120 },
  { icon: '🚇', title: 'Metro card recharge', time: '1h ago', amount: -50 },
  { icon: '💰', title: 'Round-up auto-save', time: '3h ago', amount: 8, save: true },
  { icon: '☕', title: 'Chai tapri, Gate 2', time: '5h ago', amount: -20 },
];

function renderFeedItem(tx) {
  const li = document.createElement('li');
  const positive = tx.amount > 0;

  li.innerHTML = `
    <div class="feed-icon ${tx.save ? 'save' : ''}">${tx.icon}</div>
    <div class="feed-body">
      <div class="feed-title">${tx.title}</div>
      <div class="feed-time">${tx.time}</div>
    </div>
    <div class="feed-amount ${positive ? 'positive' : ''}">
      ${positive ? '+' : '−'}${rupee(Math.abs(tx.amount))}
    </div>
  `;
  return li;
}

seedTransactions.forEach((tx) => feedListEl.appendChild(renderFeedItem(tx)));

function pushSimulatedTransaction() {
  const catalog = [
    { icon: '📚', title: 'Printout shop, campus', amount: -30 },
    { icon: '🥤', title: 'Cold coffee, canteen', amount: -45 },
    { icon: '🎬', title: 'Movie tickets split', amount: -180 },
    { icon: '💰', title: 'Round-up auto-save', amount: 6, save: true },
  ];
  const tx = { ...catalog[Math.floor(Math.random() * catalog.length)], time: 'just now' };

  const li = renderFeedItem(tx);
  li.style.opacity = '0';
  feedListEl.prepend(li);
  requestAnimationFrame(() => {
    li.style.transition = 'opacity 0.4s ease';
    li.style.opacity = '1';
  });

  if (feedListEl.children.length > 6) {
    feedListEl.removeChild(feedListEl.lastElementChild);
  }

  if (tx.amount < 0 && !tx.save) {
    setGaugeSpent(gauge.spent - tx.amount); // amount is negative -> spend increases
  }
}

/* =========================================================
   Init
   ========================================================= */

function init() {
  setGaugeSpent(160); // starting demo spend for the day

  xp.current = 640;
  xp.max = 1000;
  renderXpBar(false);
  buildStreakDays();

  // Live market simulation
  setInterval(tickMarket, 2600);

  // Occasional simulated UPI transaction to keep the dashboard feeling alive
  setInterval(pushSimulatedTransaction, 9000);
}

document.addEventListener('DOMContentLoaded', init);