/* Shared app shell: guards the page (must be logged in), then wraps #content with the sidebar and top bar.
   Each page only declares <body data-page data-title data-sub data-section> and a <main id="content">. */
(function() {
    const user = Store.user();
    if (!user) {
        location.replace('login.html');
        return;
    }
    const b = document.body.dataset;
    const links = [
        ['dashboard', 'Dashboard'],
        ['money', 'Money & UPI'],
        ['investment', 'Investment'],
        ['upi', 'UPI tools'],
        ['academy', 'Academy'],
        ['account', 'Account']
    ];
    const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const content = document.getElementById('content');
    const shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML = `
  <aside class="side" id="side" aria-label="Primary">
    <a class="brand" href="dashboard.html"><img src="assets/logo.png" alt="">SpendWise</a>
    <p class="sub label">${b.section || ''}</p>
    <nav>${links.map(([k, t]) => `<a href="${k}.html" ${b.page === k ? 'aria-current="page"' : ''}>${t.replace('&', '&amp;')}</a>`).join('')}</nav>
    <div class="status"><b><span class="dot"></span>Account verified</b>${user.name} · ${user.upi}<br><a href="#" id="out">Sign out</a></div>
  </aside>
  <div class="main">
    <header class="top"><div><button class="btn ghost sm menu-btn" id="menu" aria-controls="side" aria-expanded="false">Menu</button><h1>${b.title}</h1><p>${b.sub || ''}</p></div>
      <div class="top-tools"><input class="search" id="q" type="search" placeholder="Search this page…" aria-label="Search this page"><span class="chip"><i>${initials}</i>${user.name}</span></div></header>
  </div>`;
    document.body.prepend(shell);
    shell.querySelector('.main').append(content);
    document.getElementById('out').addEventListener('click', (e) => {
        e.preventDefault();
        Store.logout();
    });
    const menu = document.getElementById('menu'),
        side = document.getElementById('side');
    menu.addEventListener('click', () => {
        const o = side.classList.toggle('open');
        menu.setAttribute('aria-expanded', o);
    });
})();
