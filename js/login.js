/* login.html page script. Loaded after store.js, validate.js and shell.js. */
if (Store.user()) location.replace('dashboard.html');
let tries = 0;
wireForm(document.getElementById('f'), {
    id: [Rules.required],
    password: [Rules.required]
}, (v, form) => {
    if (Store.login(v.id, v.password)) {
        location.href = 'dashboard.html';
    } else {
        tries++;
        showMsg(form, tries >= 3 ?
            'Still not matching. Use “Forgot password?” to reset your key.' :
            'That ID and key do not match. Check both and try again.', 'bad');
    }
});
