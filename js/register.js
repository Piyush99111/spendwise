/* ==========================================================================
   register.js — New Account Registration Logic
   ========================================================================== */

const registerForm = document.getElementById('f');
const passwordInput = document.getElementById('pw');

// Validate registration inputs and create a new account
wireForm(
    registerForm,
    {
        name: [Rules.required],
        email: [Rules.email],
        password: [Rules.password],
        confirm: [
            (confirmValue) => {
                return confirmValue === passwordInput.value
                    ? ''
                    : 'The two keys do not match.';
            }
        ]
    },
    (formValues, formEl) => {
        const normalizedEmail = formValues.email.trim().toLowerCase();
        const emailAlreadyExists = Store.root().users.some(
            user => user.email.toLowerCase() === normalizedEmail
        );

        if (emailAlreadyExists) {
            showMsg(formEl, 'That ID is already registered. Sign in instead.', 'bad');
            return;
        }

        // Create the user account and automatically download their JSON backup
        Store.createUser(formValues.name.trim(), formValues.email.trim(), formValues.password);
        Store.exportJson();

        // Replace the form card with a welcome confirmation screen
        const firstName = formValues.name.trim().split(' ')[0];
        const authCard = document.querySelector('.auth-card');

        authCard.innerHTML = `
            <p class="label">Account created</p>
            <h1></h1>
            <p class="sub">Your details file (JSON) has been downloaded automatically. You can download it again any time.</p>
            <div style="display:grid;gap:.6rem">
                <button class="btn ghost block" id="dl" type="button">Download my details again</button>
                <a class="btn block" href="dashboard.html">Continue to dashboard</a>
            </div>
        `;

        authCard.querySelector('h1').textContent = 'Welcome, ' + firstName;

        const downloadAgainBtn = document.getElementById('dl');
        downloadAgainBtn.addEventListener('click', () => {
            Store.exportJson();
        });
    }
);
