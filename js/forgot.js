/* forgot.html page script. Loaded after store.js, validate.js and shell.js. */
wireForm(document.getElementById('f'), { email: [Rules.email], password: [Rules.password] }, (v, form) => {
  if (!Store.root().users.some(x => x.email.toLowerCase() === v.email.trim().toLowerCase())) return showMsg(form, 'No account found for that ID.', 'bad');
  Store.updateRoot(r => { r.users.find(x => x.email.toLowerCase() === v.email.trim().toLowerCase()).password = v.password; }); showMsg(form, 'Key updated. Redirecting to sign in…', 'good');
  setTimeout(() => location.href = 'login.html', 1200);
});
