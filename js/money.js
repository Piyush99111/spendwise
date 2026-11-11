/* money.html page script. Loaded after store.js, validate.js and shell.js. */
let cat='All';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function render(){
  const db=Store.load(),t=totals(db),q=document.getElementById('q').value.trim().toLowerCase();
  tot.textContent=money(t.total);dis.textContent=money(t.disposable);com.textContent=money(t.committed);
  const cats=['All',...new Set(db.transactions.map(x=>x.category))];
  document.getElementById('cats').innerHTML=cats.map(c=>`<button class="tab" aria-pressed="${c===cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  const rows=db.transactions.filter(x=>(cat==='All'||x.category===cat)&&(x.merchant+x.category).toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));
  feed.innerHTML=rows.length?rows.map(x=>`<div class="row"><span class="ic">${esc(x.merchant.slice(0,2).toUpperCase())}</span><div class="grow"><b>${esc(x.merchant)}</b><span>${new Date(x.date).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})} · ${esc(x.category)}</span></div><b class="${x.type==='in'?'up':''}">${x.type==='in'?'+':'-'}${money(x.amount)}</b><button class="btn ghost sm" data-del="${x.id}" aria-label="Delete ${esc(x.merchant)}">Delete</button></div>`).join(''):'<p class="empty">No transactions match. Add one with the form.</p>';
  bills.innerHTML=db.bills.length?db.bills.map(b=>`<div class="row"><span class="ic">${esc(b.name.slice(0,2).toUpperCase())}</span><div class="grow"><b>${esc(b.name)}</b><span>${esc(b.due)}</span></div><b>${money(b.amount)}</b><button class="btn ghost sm" data-pay="${b.id}">Pay</button></div>`).join(''):'<p class="empty">Nothing due. You are all caught up.</p>';
  const inc=db.transactions.filter(x=>x.type==='in').reduce((a,x)=>a+x.amount,0),out=db.transactions.filter(x=>x.type==='out'&&x.category!=='Savings goal').reduce((a,x)=>a+x.amount,0),base=Math.max(inc,out,1),save=Math.max(0,inc-out);
  sv.style.width=save/base*100+'%';sp.style.width=out/base*100+'%';
  ratio.textContent=`Savings ${money(save)} (${inc?Math.round(save/inc*100):0}% of inflow) · Spent ${money(out)}`;
}
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-cat]'),d=e.target.closest('[data-del]'),p=e.target.closest('[data-pay]');
  if(c){cat=c.dataset.cat;render();}
  if(d){Store.update(db=>{const x=db.transactions.find(t=>t.id===d.dataset.del);if(x)db.cash+=x.type==='out'?x.amount:-x.amount;db.transactions=db.transactions.filter(t=>t.id!==d.dataset.del);});Ui.toast('Transaction deleted');render();}
  if(p){const db=Store.load(),b=db.bills.find(x=>x.id===p.dataset.pay);if(b.amount>db.cash)return Ui.toast('Not enough balance to pay this bill');
    Store.update(db=>{db.cash-=b.amount;db.bills=db.bills.filter(x=>x.id!==b.id);db.transactions.push({id:Store.uid('t'),merchant:b.name,category:'Bills',amount:b.amount,type:'out',date:new Date().toISOString().slice(0,16)});});Ui.toast(b.name+' paid');render();}
});
document.getElementById('q').addEventListener('input',render);
wireForm(document.getElementById('tf'),{merchant:[Rules.required],amount:[Rules.amount]},(v,form)=>{
  const amt=Number(v.amount);Store.update(db=>{db.transactions.push({id:Store.uid('t'),merchant:v.merchant.trim(),category:v.category,amount:amt,type:v.type,date:new Date().toISOString().slice(0,16)});db.cash+=v.type==='in'?amt:-amt;});
  form.reset();Ui.toast('Transaction saved');render();});
render();
