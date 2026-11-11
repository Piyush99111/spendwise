/* dashboard.html page script. Loaded after store.js, validate.js and shell.js. */
const db = Store.load(), t = totals(db), DAY = 864e5, budget = db.goals.weeklyCap / 7;
const days = [...Array(7)].map((_, i) => { const d = new Date(Date.now() - (6 - i) * DAY); return { key: d.toDateString(), name: d.toLocaleDateString('en-IN', { weekday: 'short' }), out: 0 }; });
db.transactions.filter(x => x.type === 'out' && x.category !== 'Savings goal').forEach(x => { const d = days.find(d => d.key === new Date(x.date).toDateString()); if (d) d.out += x.amount; });
const todayIn = db.transactions.filter(x => x.type === 'in' && new Date(x.date).toDateString() === new Date().toDateString()).reduce((a, x) => a + x.amount, 0);
document.getElementById('liquid').textContent = money(t.disposable);
document.getElementById('today').textContent = todayIn ? `+${money(todayIn)} today from UPI` : 'No inflow yet today';
const weekSpend = days.reduce((a, d) => a + d.out, 0), cap = db.goals.weeklyCap, pct = Math.min(100, Math.round(weekSpend / cap * 100));
document.getElementById('capbar').style.width = pct + '%';
document.getElementById('capnote').textContent = `${money(Math.max(0, cap - weekSpend))} left of this week's ${money(cap)} spending cap`;

function draw(mode) {
  const vals = days.map(d => mode === 'out' ? d.out : Math.max(0, budget - d.out)), max = Math.max(...vals, 1);
  document.getElementById('chart').innerHTML = days.map((d, i) => `<div><small>${money(vals[i])}</small><i style="height:${Math.max(4, vals[i] / max * 130)}px;background:${mode === 'out' ? 'var(--ink)' : 'var(--green-deep)'}"></i><small>${d.name}</small></div>`).join('');
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode));
}
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => draw(b.dataset.mode)));
draw('out');

const invested = db.holdings.reduce((a, h) => a + h.value, 0);
const mod = db.modules.find(m => m.done < m.lessons && (!m.needs || db.modules.find(x => x.id === m.needs).done === db.modules.find(x => x.id === m.needs).lessons));
document.getElementById('inst').innerHTML = [
  ['W1', 'Weekly liquidity cap', `${money(Math.max(0, cap - weekSpend))} remaining this week`, `${100 - pct}%`],
  ['SB', 'Trading sandbox', `Holdings worth ${money(invested)}`, `${db.holdings.length} assets`],
  ['XP', mod ? mod.title : 'All modules complete', `${db.streak}-day streak`, `${db.xp} XP`]
].map(r => `<div class="row"><span class="ic">${r[0]}</span><div class="grow"><b>${r[1]}</b><span>${r[2]}</span></div><span class="badge c">${r[3]}</span></div>`).join('');
const yest = days[5].out, sur = Math.max(0, budget - yest);
document.getElementById('advtext').textContent = sur ? `You kept ${money(sur)} under your daily budget yesterday. Moving it into your practice portfolio puts idle cash to work.` : 'Yesterday went over your daily budget. Review Money & UPI before adding to the sandbox.';

/* Budget goals */
const g = db.goals; wc.value = g.weeklyCap; gn.value = g.saveName; gtg.value = g.saveTarget || '';
gsaved.textContent = money(g.saved); const gp = g.saveTarget ? Math.min(100, Math.round(g.saved / g.saveTarget * 100)) : 0;
gbar.style.width = gp + '%'; gnote.textContent = g.saveTarget ? `${gp}% of ${money(g.saveTarget)} for “${g.saveName}”` : 'Set a goal to start saving toward it.';
wireForm(gf, { weeklyCap: [Rules.amount], saveName: [Rules.required], saveTarget: [Rules.amount] }, (v) => {
  Store.update(d => { d.goals.weeklyCap = Number(v.weeklyCap); d.goals.saveName = v.saveName.trim(); d.goals.saveTarget = Number(v.saveTarget); });
  location.reload();
});
wireForm(af, { amount: [Rules.amount] }, (v, form) => {
  const amt = Number(v.amount);
  if (!db.goals.saveTarget) return showMsg(form, 'Save a goal first, then move money into it.', 'bad');
  if (amt > t.disposable) return showMsg(form, 'You only have ' + money(Math.max(0, t.disposable)) + ' of disposable capital.', 'bad');
  Store.update(d => { d.cash -= amt; d.goals.saved += amt; d.transactions.push({ id: Store.uid('t'), merchant: 'Goal: ' + d.goals.saveName, category: 'Savings goal', amount: amt, type: 'out', date: new Date().toISOString().slice(0, 16) }); });
  location.reload();
});
