/* ==========================================================================
   account.js — User Profile, Data Export & Demo Reset
   ========================================================================== */

const currentUser = Store.user();
const nameInput = document.getElementById('n');
const emailInput = document.getElementById('e');
const profileForm = document.getElementById('pf');
const exportBtn = document.getElementById('ex');
const resetBtn = document.getElementById('rs');

// Pre-fill profile form with the signed-in user's name and email
nameInput.value = currentUser.name;
emailInput.value = currentUser.email;

// Save updated display name when the profile form is submitted
wireForm(
    profileForm,
    {
        name: [Rules.required]
    },
    (formValues, formEl) => {
        Store.updateRoot(rootData => {
            const signedInUser = rootData.users.find(user => user.id === rootData.session);
            signedInUser.name = formValues.name.trim();
        });
        showMsg(formEl, 'Profile saved.', 'good');
    }
);

// Download the user's profile and financial data as a JSON file
exportBtn.addEventListener('click', () => {
    Store.exportJson();
});

// Reset all localStorage data back to the initial demo dataset
resetBtn.addEventListener('click', () => {
    const confirmed = confirm('Reset all data to the demo set? You will be signed out.');
    if (confirmed) {
        Store.reset();
        location.href = 'login.html';
    }
});
