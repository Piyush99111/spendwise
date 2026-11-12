/* ==========================================================================
   shell.js — Login Guard, Sidebar & Top Navigation Bar
   ========================================================================== */

(function () {
    // Redirect to login page if no user is currently signed in
    const currentUser = Store.user();
    if (!currentUser) {
        location.replace('login.html');
        return;
    }

    // Read page metadata from <body data-page data-title data-sub data-section>
    const pageMeta = document.body.dataset;

    const navLinks = [
        ['dashboard', 'Dashboard'],
        ['money', 'Money & UPI'],
        ['investment', 'Investment'],
        ['upi', 'UPI tools'],
        ['academy', 'Academy'],
        ['account', 'Account']
    ];

    // Extract up to 2 initials from the user's full name for the top-right badge
    const userInitials = currentUser.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const navLinksHtml = navLinks
        .map(([pageKey, label]) => {
            const currentAttr = pageMeta.page === pageKey ? 'aria-current="page"' : '';
            const safeLabel = label.replace('&', '&amp;');
            return `<a href="${pageKey}.html" ${currentAttr}>${safeLabel}</a>`;
        })
        .join('');

    // Build the shell layout (sidebar + top header) and move #content inside it
    const mainContent = document.getElementById('content');
    const shellContainer = document.createElement('div');
    shellContainer.className = 'shell';

    shellContainer.innerHTML = `
        <aside class="side" id="side" aria-label="Primary">
            <a class="brand" href="dashboard.html">
                <img src="assets/logo.png" alt="">SpendWise
            </a>
            <p class="sub label">${pageMeta.section || ''}</p>
            <nav>${navLinksHtml}</nav>
            <div class="status">
                <b><span class="dot"></span>Account verified</b>
                ${currentUser.name} · ${currentUser.upi}<br>
                <a href="#" id="out">Sign out</a>
            </div>
        </aside>
        <div class="main">
            <header class="top">
                <div>
                    <button class="btn ghost sm menu-btn" id="menu" aria-controls="side" aria-expanded="false">Menu</button>
                    <h1>${pageMeta.title}</h1>
                    <p>${pageMeta.sub || ''}</p>
                </div>
                <div class="top-tools">
                    <input class="search" id="q" type="search" placeholder="Search this page…" aria-label="Search this page">
                    <span class="chip"><i>${userInitials}</i>${currentUser.name}</span>
                </div>
            </header>
        </div>
    `;

    document.body.prepend(shellContainer);
    shellContainer.querySelector('.main').append(mainContent);

    // Handle "Sign out" click
    const signOutLink = document.getElementById('out');
    signOutLink.addEventListener('click', (event) => {
        event.preventDefault();
        Store.logout();
    });

    // Handle mobile sidebar menu toggle
    const menuBtn = document.getElementById('menu');
    const sidebarEl = document.getElementById('side');

    menuBtn.addEventListener('click', () => {
        const isOpen = sidebarEl.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', isOpen);
    });
})();
