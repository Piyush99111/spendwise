/* ==========================================================================
   validate.js — Form Validation Rules & Helpers
   ========================================================================== */

// Validation rules: each function takes an input value and returns '' if valid, or an error string
const Rules = {
    required: (value) => {
        return value.trim() ? '' : 'This field is required.';
    },
    email: (value) => {
        const isEmailOrUpi = /^[^\s@]+@[^\s@]+$/.test(value.trim());
        return isEmailOrUpi ? '' : 'Enter a valid email or UPI ID (like name@bank).';
    },
    password: (value) => {
        const isStrong = value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
        return isStrong ? '' : 'Use 8+ characters with a letter and a number.';
    },
    amount: (value) => {
        return Number(value) > 0 ? '' : 'Enter an amount greater than 0.';
    }
};

// Validate a single input element against its array of rule functions
function validateField(inputEl, ruleList) {
    const fieldWrapper = inputEl.closest('.field');
    let errorMessage = '';

    for (const ruleFn of ruleList) {
        errorMessage = ruleFn(inputEl.value);
        if (errorMessage) {
            break;
        }
    }

    fieldWrapper.classList.toggle('invalid', Boolean(errorMessage));
    fieldWrapper.querySelector('.err').textContent = errorMessage;
    inputEl.setAttribute('aria-invalid', errorMessage ? 'true' : 'false');

    return !errorMessage;
}

// Attach validation to a form (validates on field blur and on form submit)
// fieldSpec format: { fieldName: [Rules.required, ...] }
function wireForm(formEl, fieldSpec, onValidSubmit) {
    const trackedInputs = Object.keys(fieldSpec).map(fieldName => formEl.elements[fieldName]);

    // Validate individual field when the user leaves it
    trackedInputs.forEach(inputEl => {
        inputEl.addEventListener('blur', () => {
            validateField(inputEl, fieldSpec[inputEl.name]);
        });
    });

    // Validate all fields on submit before calling onValidSubmit(values, formEl)
    formEl.addEventListener('submit', (event) => {
        event.preventDefault();

        const allValid = trackedInputs
            .map(inputEl => validateField(inputEl, fieldSpec[inputEl.name]))
            .every(Boolean);

        if (!allValid) {
            const firstInvalidInput = trackedInputs.find(
                inputEl => inputEl.getAttribute('aria-invalid') === 'true'
            );
            if (firstInvalidInput) {
                firstInvalidInput.focus();
            }
            return;
        }

        const formValues = Object.fromEntries(new FormData(formEl));
        onValidSubmit(formValues, formEl);
    });
}

// Show a status banner message (.form-msg) inside a form ('good' for green, 'bad' for red)
function showMsg(formEl, messageText, messageKind) {
    const msgBanner = formEl.querySelector('.form-msg');
    msgBanner.textContent = messageText;
    msgBanner.className = 'form-msg show ' + messageKind;
}

// Global click listener for "Show / Hide" password toggle buttons
document.addEventListener('click', (event) => {
    const toggleBtn = event.target.closest('[data-toggle-pw]');
    if (!toggleBtn) {
        return;
    }

    const passwordInput = document.getElementById(toggleBtn.dataset.togglePw);
    const shouldShowText = passwordInput.type === 'password';

    passwordInput.type = shouldShowText ? 'text' : 'password';
    toggleBtn.textContent = shouldShowText ? 'Hide' : 'Show';
    toggleBtn.setAttribute('aria-pressed', shouldShowText);
});
