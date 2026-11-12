/* ==========================================================================
   login.js — User Sign-In Page Logic
   ========================================================================== */

// If a user is already logged in, skip the login page and go to the dashboard
if (Store.user()) {
    location.replace('dashboard.html');
}

let failedAttempts = 0;
const loginForm = document.getElementById('f');

// Validate and submit the sign-in form
wireForm(
    loginForm,
    {
        id: [Rules.required],
        password: [Rules.required]
    },
    (formValues, formEl) => {
        const isSuccess = Store.login(formValues.id, formValues.password);

        if (isSuccess) {
            location.href = 'dashboard.html';
        } else {
            failedAttempts++;
            const errorMessage = failedAttempts >= 3
                ? 'Still not matching. Use “Forgot password?” to reset your key.'
                : 'That ID and key do not match. Check both and try again.';

            showMsg(formEl, errorMessage, 'bad');
        }
    }
);
