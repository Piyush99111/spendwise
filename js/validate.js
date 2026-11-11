/* Small form-validation helper used by every form. Rules are functions returning an error string or ''. */
const Rules = {
    required: (v) => v.trim() ? '' : 'This field is required.',
    email: (v) => /^[^\s@]+@[^\s@]+$/.test(v.trim()) ? '' :
        'Enter a valid email or UPI ID (like name@bank).',
    password: (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v) ? '' :
        'Use 8+ characters with a letter and a number.',
    amount: (v) => Number(v) > 0 ? '' : 'Enter an amount greater than 0.'
};

function validateField(input, rules) {
    const wrap = input.closest('.field');
    let msg = '';
    for (const r of rules) {
        msg = r(input.value);
        if (msg) break;
    }
    wrap.classList.toggle('invalid', !!msg);
    wrap.querySelector('.err').textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
}
/* Wire a form: spec = { fieldName: [rules] }. Validates on blur and on submit, then calls onValid(values). */
function wireForm(form, spec, onValid) {
    const inputs = Object.keys(spec).map(n => form.elements[n]);
    inputs.forEach(i => i.addEventListener('blur', () => validateField(i, spec[i.name])));
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ok = inputs.map(i => validateField(i, spec[i.name])).every(Boolean);
        if (!ok) {
            inputs.find(i => i.getAttribute('aria-invalid') === 'true').focus();
            return;
        }
        onValid(Object.fromEntries(new FormData(form)),
        form); /* all fields, including dropdowns */
    });
}

function showMsg(form, text, kind) {
    const m = form.querySelector('.form-msg');
    m.textContent = text;
    m.className = 'form-msg show ' + kind;
}
document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toggle-pw]');
    if (!b) return;
    const i = document.getElementById(b.dataset.togglePw);
    const show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.textContent = show ? 'Hide' : 'Show';
    b.setAttribute('aria-pressed', show);
});
