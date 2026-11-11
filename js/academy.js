/* academy.html page script. Loaded after store.js, validate.js and shell.js. */
let f = 'All'; const CATS = ['All', 'Tax Laws', 'Equities & Indices'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const QUIZ = {
  m1: [['What does "cash flow" mean?', ['Money moving in and out over a period', 'Only your savings balance', 'Interest paid by a bank'], 0], ['In the 50/30/20 rule, what does the 20 stand for?', ['Wants', 'Savings and investing', 'Rent'], 1], ['Which of these is a fixed expense?', ['Monthly rent', 'Eating out', 'Movie tickets'], 0]],
  m2: [['Which is a fixed liability?', ['A loan EMI', 'A birthday gift', 'A snack'], 0], ['Disposable capital is best described as…', ['Money left after committed payments', 'Your total salary', 'Your investments'], 0], ['Which is an income stream for a student?', ['A part-time stipend', 'A phone bill', 'A library fine'], 0]],
  m3: [['India\'s financial year runs…', ['1 April to 31 March', '1 January to 31 December', '1 July to 30 June'], 0], ['PAN stands for…', ['Permanent Account Number', 'Personal Asset Name', 'Public Amount Note'], 0], ['TDS stands for…', ['Tax Deducted at Source', 'Total Deposit Slip', 'Tax Due Statement'], 0]],
  m4: [['ITR stands for…', ['Income Tax Return', 'Interest Transfer Receipt', 'Investment Tax Rate'], 0], ['Form 16 is…', ['A TDS certificate on salary from an employer', 'A bank loan form', 'A passport form'], 0], ['Income tax returns are filed on…', ['The income tax e-filing portal', 'A stock exchange app', 'A bank ATM'], 0]],
  m5: [['The Nifty 50 tracks…', ['50 large companies listed on the NSE', '50 government bonds', '50 gold funds'], 0], ['NSE stands for…', ['National Stock Exchange', 'National Savings Exchange', 'Net Share Estimate'], 0], ['An index fund aims to…', ['Mirror an index such as the Nifty 50', 'Beat every other fund every year', 'Guarantee returns'], 0]]
};
const ytId = u => (u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/) || [])[1];
Rules.youtube = v => ytId(v.trim()) ? '' : 'Paste a YouTube link (watch, youtu.be, embed or shorts).';
const full = (m) => m.done >= m.lessons, unlocked = (db, m) => !m.needs || full(db.modules.find(x => x.id === m.needs));
function render() {
  const db = Store.load(), q = document.getElementById('q').value.trim().toLowerCase(), quiz = db.quizzes || {};
  tabs.innerHTML = CATS.map(c => `<button class="tab" aria-pressed="${c === f}" data-c="${c}">${c.replace('&', '&amp;')}</button>`).join('');
  const rows = db.modules.filter(m => (f === 'All' || m.cat === f) && m.title.toLowerCase().includes(q));
  mods.innerHTML = rows.length ? rows.map(m => {
    const pct = Math.round(m.done / m.lessons * 100), pre = db.modules.find(x => x.id === m.needs), open = unlocked(db, m), vids = m.videos || [];
    const act = full(m) ? '<span class="badge g">Completed</span>' : open ? `<button class="btn sm" data-l="${m.id}">${m.done ? 'Resume' : 'Start'}</button>` : '<span class="badge r">Locked</span>';
    const note = full(m) ? `Module completed · +${m.xp} XP earned` : open ? `${m.done} of ${m.lessons} lessons · +${m.xp} XP` : `Finish “${esc(pre.title)}” to unlock`;
    const qbtn = open ? `<button class="btn ghost sm" data-q="${m.id}">${quiz[m.id] !== undefined ? 'Quiz ' + quiz[m.id] + '/3' : 'Take quiz'}</button>` : '';
    const vhtml = vids.length ? `<details style="margin-top:.5rem"><summary style="cursor:pointer;font-size:.82rem;font-weight:600">${vids.length} video${vids.length > 1 ? 's' : ''}</summary>${vids.map((v, i) => `<div style="margin:.6rem 0"><p style="font-size:.82rem;font-weight:600">${esc(v.title)} <button class="btn ghost sm" data-rv="${m.id}:${i}" aria-label="Remove ${esc(v.title)}">Remove</button></p><iframe title="${esc(v.title)}" src="https://www.youtube-nocookie.com/embed/${v.id}" loading="lazy" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px;margin-top:.3rem"></iframe></div>`).join('')}</details>` : '';
    return `<div class="row" style="align-items:flex-start"><span class="ic">${full(m) ? '✓' : open ? pct + '%' : '🔒'}</span><div class="grow"><b>${esc(m.title)}</b><span>${note}</span><div class="bar" style="margin-top:.4rem"><i style="width:${pct}%"></i></div>${vhtml}</div><div style="display:grid;gap:.4rem;justify-items:end">${act}${qbtn}</div></div>`;
  }).join('') : '<p class="empty">No modules match your search.</p>';
  const need = 250 * (Math.floor(db.xp / 250) + 1);
  xp.textContent = `${db.xp} / ${need} XP`; xpb.style.width = db.xp % 250 / 250 * 100 + '%'; lvl.textContent = `Level ${Math.floor(db.xp / 250) + 1} scholar · ${db.streak}-day streak`;
  const done = db.modules.filter(full).length, passed = Object.values(quiz).filter(s => s >= 2).length;
  const earn = [['Foundations', done >= 1], ['Budget Pro', done >= 2], ['3-day streak', db.streak >= 3], ['Quiz taker', passed >= 1], ['Tax ready', db.modules.find(m => m.id === 'm4').done >= 6]];
  badges.innerHTML = earn.map(([n, y]) => `<div class="row"><span class="ic">${y ? '★' : '·'}</span><div class="grow"><b>${n}</b></div><span class="badge ${y ? 'g' : ''}">${y ? 'Earned' : 'Not yet'}</span></div>`).join('');
  const keep = vm.value; vm.innerHTML = db.modules.map(m => `<option value="${m.id}">${esc(m.title)}</option>`).join(''); if (keep) vm.value = keep;
}
let qid = null;
function openQuiz(id) {
  qid = id; const m = Store.load().modules.find(x => x.id === id); qt.textContent = 'Quiz: ' + m.title; qm.className = 'form-msg'; qs.hidden = false;
  qb.innerHTML = QUIZ[id].map((q, i) => `<fieldset style="border:0;margin:0 0 1rem;padding:0"><legend style="font-weight:600;margin-bottom:.4rem">${i + 1}. ${esc(q[0])}</legend>${q[1].map((o, j) => `<label style="display:block;padding:.3rem 0"><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}</fieldset>`).join('');
  qd.showModal();
}
qs.addEventListener('click', () => {
  const qs_ = QUIZ[qid]; const ans = qs_.map((_, i) => qf.querySelector(`input[name=q${i}]:checked`));
  if (ans.some(a => !a)) { qm.textContent = 'Answer every question before submitting.'; qm.className = 'form-msg show bad'; return; }
  const score = ans.filter((a, i) => Number(a.value) === qs_[i][2]).length, first = (Store.load().quizzes || {})[qid] === undefined;
  Store.update(d => { d.quizzes = d.quizzes || {}; d.quizzes[qid] = Math.max(score, d.quizzes[qid] || 0); if (first && score >= 2) d.xp += 20; });
  qm.textContent = `You scored ${score}/3.` + (score >= 2 ? (first ? ' Passed! +20 XP.' : ' Passed.') : ' You need 2 to pass. Try again.') + ' Correct answers: ' + qs_.map((q, i) => `${i + 1}) ${q[1][q[2]]}`).join('; ');
  qm.className = 'form-msg show ' + (score >= 2 ? 'good' : 'bad'); render();
});
qx.addEventListener('click', () => qd.close());
document.addEventListener('click', e => {
  const c = e.target.closest('[data-c]'), l = e.target.closest('[data-l]'), z = e.target.closest('[data-q]'), r = e.target.closest('[data-rv]');
  if (c) { f = c.dataset.c; render(); }
  if (z) openQuiz(z.dataset.q);
  if (r) { const [id, i] = r.dataset.rv.split(':'); Store.update(d => { d.modules.find(m => m.id === id).videos.splice(Number(i), 1); }); Ui.toast('Video removed'); render(); }
  if (l) { Store.update(d => { const m = d.modules.find(x => x.id === l.dataset.l); m.done++; if (m.done === m.lessons) { d.xp += m.xp; Ui.toast(`Module complete! +${m.xp} XP`); } else Ui.toast('Lesson complete'); }); render(); }
});
document.getElementById('q').addEventListener('input', render);
wireForm(vf, { title: [Rules.required], url: [Rules.youtube] }, (v, form) => {
  Store.update(d => { const m = d.modules.find(x => x.id === v.module); (m.videos = m.videos || []).push({ title: v.title.trim(), id: ytId(v.url.trim()) }); });
  form.reset(); Ui.toast('Video added'); render();
});
render();
