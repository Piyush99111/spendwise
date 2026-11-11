/* investment.html page script. Loaded after store.js, validate.js and shell.js. */
let f='All';const KINDS=['All','Equities','Gold','Mutual Funds'],START=100000;
function render(){
  const db=Store.load(),q=document.getElementById('q').value.trim().toLowerCase(),inv=db.holdings.reduce((a,h)=>a+h.value,0),total=inv+db.sandboxCash;
  tot.textContent=money(total);cash.textContent=money(db.sandboxCash);
  const base=db.sandboxStart||total,g=(total-base)/base*100;gain.textContent=`${g>=0?'+':''}${g.toFixed(1)}% since you opened the sandbox`;
  const cols={Equities:'var(--cyan)',Gold:'var(--amber)','Mutual Funds':'var(--green)',Cash:'#94a3b8'};
  const parts=[...['Equities','Gold','Mutual Funds'].map(k=>[k,db.holdings.filter(h=>h.kind===k).reduce((a,h)=>a+h.value,0)]),['Cash',db.sandboxCash]];
  alloc.innerHTML=parts.map(([k,v])=>`<i style="width:${v/total*100}%;background:${cols[k]}"></i>`).join('');
  legend.textContent=parts.map(([k,v])=>`${k} ${Math.round(v/total*100)}%`).join(' · ');
  tabs.innerHTML=KINDS.map(k=>`<button class="tab" aria-pressed="${k===f}" data-k="${k}">${k}</button>`).join('');
  const rows=db.holdings.filter(h=>(f==='All'||h.kind===f)&&(h.name+h.sym).toLowerCase().includes(q));
  list.innerHTML=rows.length?rows.map(h=>`<div class="row"><span class="ic">${h.name.slice(0,2).toUpperCase()}</span><div class="grow"><b>${h.name}</b><span>${h.kind} · ${h.sym}</span></div><div style="text-align:right"><b>${money(h.value)}</b><br><span class="${h.change>=0?'up':'down'}" style="font-size:.78rem">${h.change>=0?'+':''}${h.change}%</span></div></div>`).join(''):'<p class="empty">No holdings in this view.</p>';
  const sel=document.getElementById('as'),keep=sel.value;sel.innerHTML=db.holdings.map(h=>`<option value="${h.id}">${h.name}</option>`).join('');if(keep)sel.value=keep;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b){f=b.dataset.k;render();}});
document.getElementById('q').addEventListener('input',render);
wireForm(document.getElementById('tf'),{amount:[Rules.amount]},(v,form)=>{
  const amt=Number(v.amount),db=Store.load(),h=db.holdings.find(x=>x.id===v.asset);
  if(v.action==='buy'&&amt>db.sandboxCash)return showMsg(form,'Not enough sandbox cash for that order.','bad');
  if(v.action==='sell'&&amt>h.value)return showMsg(form,'You cannot sell more than the holding is worth ('+money(h.value)+').','bad');
  Store.update(d=>{const x=d.holdings.find(y=>y.id===v.asset),s=v.action==='buy'?1:-1;x.value+=s*amt;d.sandboxCash-=s*amt;});
  form.querySelector('.form-msg').className='form-msg';form.reset();Ui.toast(`${v.action==='buy'?'Bought':'Sold'} ${money(amt)} of ${h.name}`);render();});
render();
