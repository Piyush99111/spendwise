/* register.html page script. Loaded after store.js, validate.js and shell.js. */
wireForm(document.getElementById('f'),
  { name: [Rules.required], email: [Rules.email], password: [Rules.password],
    confirm: [(v) => v === document.getElementById('pw').value ? '' : 'The two keys do not match.'] },
  (v, form) => {
    if (Store.root().users.some(u => u.email.toLowerCase() === v.email.trim().toLowerCase())) return showMsg(form, 'That ID is already registered. Sign in instead.', 'bad');
    Store.createUser(v.name.trim(), v.email.trim(), v.password);
    Store.exportJson(); /* automatic download of the user's details as JSON */
    const card = document.querySelector('.auth-card');
    card.innerHTML = '<p class="label">Account created</p><h1></h1><p class="sub">Your details file (JSON) has been downloaded automatically. You can download it again any time.</p><div style="display:grid;gap:.6rem"><button class="btn ghost block" id="dl" type="button">Download my details again</button><a class="btn block" href="dashboard.html">Continue to dashboard</a></div>';
    card.querySelector('h1').textContent = 'Welcome, ' + v.name.trim().split(' ')[0];
    document.getElementById('dl').addEventListener('click', () => Store.exportJson());
  });
