/* upi.html page script. Loaded after store.js, validate.js and shell.js. */
const UPI = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
Rules.upi = v => UPI.test(v.trim()) ? '' : 'Enter a valid UPI ID like name@bank.';
let current = null;
wireForm(lf, { upi: [Rules.upi] }, (v, form) => { Store.updateRoot(r => { r.users.find(u => u.id === r.session).upi = v.upi.trim(); }); showMsg(form, 'UPI ID saved.', 'good'); });
lf.elements.upi.value = (Store.user().upi || '').includes('@') ? Store.user().upi : '';
wireForm(pf, { pa: [Rules.upi], pn: [Rules.required], amount: [Rules.amount] }, (v) => {
  const q = new URLSearchParams({ pa: v.pa.trim(), pn: v.pn.trim(), am: Number(v.amount).toFixed(2), cu: 'INR' }); if (v.note.trim()) q.set('tn', v.note.trim());
  const url = 'upi://pay?' + q.toString(); current = { name: v.pn.trim(), amount: Number(v.amount) };
  const qr = qrcode(0, 'M'); qr.addData(url); qr.make(); document.getElementById('qr').innerHTML = qr.createSvgTag({ cellSize: 5, margin: 0 });
  link.textContent = url; document.getElementById('open').href = url; const box = document.getElementById('out'); box.hidden = false; box.style.display = 'flex';
});
copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(link.textContent); Ui.toast('Link copied'); } catch (e) { Ui.toast('Could not copy. Select the link and copy it manually.'); } });
log.addEventListener('click', () => {
  const db = Store.load(); if (current.amount > db.cash) return Ui.toast('Not enough balance to log this payment.');
  Store.update(d => { d.cash -= current.amount; d.transactions.push({ id: Store.uid('t'), merchant: current.name, category: 'Other', amount: current.amount, type: 'out', date: new Date().toISOString().slice(0, 16) }); });
  Ui.toast('Payment logged in Money & UPI');
});

/* ---- CSV import ---- */
const CATS = [[/swiggy|zomato|cafe|restaurant|dominos|canteen|food/i, 'Dining & Provisions'], [/uber|ola|rapido|metro|irctc|fuel|petrol|bus/i, 'Transportation'], [/netflix|spotify|prime|hotstar|youtube|subscription/i, 'Digital Services'], [/fee|tuition|book|stationery|course|exam/i, 'Education'], [/salary|stipend|pocket|received|refund|cashback/i, 'Income']];
const categorize = (text, type) => type === 'in' ? 'Income' : (CATS.find(([re]) => re.test(text)) || [0, 'Other'])[1];
function parseCsv(text) { /* handles quoted fields with commas */
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
let pending = [];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
file.addEventListener('change', () => {
  const f = file.files[0]; pending = []; prev.innerHTML = ''; go.hidden = true; imsg.className = 'form-msg';
  if (!f) return;
  if (!/\.csv$/i.test(f.name)) return showMsgEl('Please choose a .csv file.', 'bad');
  if (f.size > 1e6) return showMsgEl('That file is over 1 MB. Export a shorter date range.', 'bad');
  const rd = new FileReader(); rd.onerror = () => showMsgEl('Could not read that file.', 'bad');
  rd.onload = () => {
    const rows = parseCsv(String(rd.result)); const head = rows.shift().map(h => h.trim().toLowerCase());
    const ix = n => head.indexOf(n); if (['date', 'description', 'amount', 'type'].some(n => ix(n) < 0)) return showMsgEl('Header row must be: date, description, amount, type.', 'bad');
    const bad = [], seen = new Set(Store.load().transactions.map(t => t.date.slice(0, 10) + t.merchant + t.amount));
    rows.forEach((r, i) => {
      const date = r[ix('date')].trim(), desc = r[ix('description')].trim(), amt = Number(r[ix('amount')]), type = r[ix('type')].trim().toLowerCase();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date)) || !desc || !(amt > 0) || !['debit', 'credit'].includes(type)) return bad.push(i + 2);
      const t = type === 'credit' ? 'in' : 'out'; if (seen.has(date + desc + amt)) return;
      pending.push({ id: Store.uid('t'), merchant: desc, category: categorize(desc, t), amount: amt, type: t, date: date + 'T12:00' });
    });
    prev.innerHTML = pending.length ? '<div class="row" style="font-weight:600"><span class="grow">Description</span><span>Category</span><span style="width:90px;text-align:right">Amount</span></div>' + pending.slice(0, 8).map(t => `<div class="row"><span class="grow">${esc(t.merchant)}</span><span class="badge c">${esc(t.category)}</span><span style="width:90px;text-align:right" class="${t.type === 'in' ? 'up' : ''}">${t.type === 'in' ? '+' : '-'}${money(t.amount)}</span></div>`).join('') + (pending.length > 8 ? `<p class="muted" style="font-size:.8rem;margin-top:.4rem">…and ${pending.length - 8} more</p>` : '') : '';
    go.hidden = !pending.length;
    showMsgEl(`${pending.length} new transaction(s) ready.` + (bad.length ? ` Skipped invalid rows: ${bad.slice(0, 6).join(', ')}${bad.length > 6 ? '…' : ''}.` : '') + (!pending.length ? ' Nothing new to import.' : ''), pending.length ? 'good' : 'bad');
  };
  rd.readAsText(f);
});
function showMsgEl(t, k) { imsg.textContent = t; imsg.className = 'form-msg show ' + k; }
go.addEventListener('click', () => {
  Store.update(d => { pending.forEach(t => { d.transactions.push(t); d.cash += t.type === 'in' ? t.amount : -t.amount; }); });
  Ui.toast(pending.length + ' transactions imported'); pending = []; prev.innerHTML = ''; go.hidden = true; file.value = ''; imsg.className = 'form-msg';
});
sample.addEventListener('click', () => {
  const csv = 'date,description,amount,type\n2026-10-20,Swiggy order,420,debit\n2026-10-21,Uber ride,180,debit\n2026-10-22,"Netflix, monthly",649,debit\n2026-10-23,Pocket money,5000,credit\n';
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'sample-statement.csv' }); a.click();
});
