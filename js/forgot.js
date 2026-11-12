/* ==========================================================================
   forgot.js — Password Reset Logic
   ========================================================================== */

const resetForm = document.getElementById('f');

// Validate email and new password, then update the user's stored password
wireForm(
    resetForm,
    {
        email: [Rules.email],
        password: [Rules.password]
    },
    (formValues, formEl) => {
        const normalizedEmail = formValues.email.trim().toLowerCase();
        const accountExists = Store.root().users.some(
            user => user.email.toLowerCase() === normalizedEmail
        );

        if (!accountExists) {
            showMsg(formEl, 'No account found for that ID.', 'bad');
            return;
        }

        // Save the new password for the matching user
        Store.updateRoot(rootData => {
            const matchedUser = rootData.users.find(
                user => user.email.toLowerCase() === normalizedEmail
            );
            matchedUser.password = formValues.password;
        });

        showMsg(formEl, 'Key updated. Redirecting to sign in…', 'good');

        setTimeout(() => {
            location.href = 'login.html';
        }, 1200);
    }
);
