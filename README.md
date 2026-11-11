# SpendWise
A student fintech web app: UPI spend tracking, a risk-free trading sandbox and a gamified finance academy. Built for CSE 2022 Web Programming.

**Demo login:** `tanvi.bansal@paytm` / `Spend@123` (or register a new account)

## Pages
`index` landing · `login` · `register` · `forgot` · `dashboard` · `money` · `investment` · `academy` · `account`

## Phase 2 (this version)
- All pages linked; the app pages share one shell (`js/shell.js`) and redirect to login when signed out.
- Forms with validation (`js/validate.js`): login, register, reset key, add transaction, practice order, profile.
- Event handling: filter tabs, live search, chart toggle, pay bill, delete transaction, buy/sell, complete lessons.
- Each account has its own data, saved as JSON in the browser's localStorage (`js/store.js`).
- Registering downloads the user's details as a `.json` file automatically; "Download my data (JSON)" on the Account page and the registration success screen do it manually.
- Budget goals on the dashboard: weekly spending cap and a savings goal.
- Friendly errors: inline form messages, storage-blocked banner, toast on failures, and a 404 page.

- **UPI tools** (`upi.html`): save your UPI ID, create `upi://pay` links with a QR code (vendored `js/vendor/qrcode.js`, MIT), import a CSV statement with auto-categorisation.
- **Academy**: scored quizzes (+20 XP on first pass), per-module YouTube videos added through a validated form, and a link to free Zerodha Varsity reading.

## Documentation
`docs/HOW_TO_WORK.md` (run, demo, extend) and `docs/JAVASCRIPT_UNDERSTANDING.md` (what every script does).

## Structure
Each page has its own `css/<page>.css` and `js/<page>.js`; shared code is in `css/styles.css` and `js/store.js`, `js/validate.js`, `js/shell.js`.

## Run
Open `index.html` in a browser (no build step).

## Next (Phase 3)
Node + Express APIs and MongoDB replace `js/store.js`; the data shape stays the same.

Design: Figma prototype (see `design.md`). Fonts: Arapey and Plus Jakarta Sans.
