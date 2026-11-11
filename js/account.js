/* account.html page script. Loaded after store.js, validate.js and shell.js. */
const u = Store.user();
n.value = u.name;
e.value = u.email;
wireForm(document.getElementById('pf'), {
    name: [Rules.required]
}, (v, form) => {
    Store.updateRoot(r => {
        r.users.find(x => x.id === r.session).name = v.name.trim();
    });
    showMsg(form, 'Profile saved.', 'good');
});
ex.addEventListener('click', () => Store.exportJson());
rs.addEventListener('click', () => {
    if (confirm('Reset all data to the demo set? You will be signed out.')) {
        Store.reset();
        location.href = 'login.html';
    }
});
