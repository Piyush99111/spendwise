# HOW TO WORK: SpendWise (A2)

How to run, use, demo and extend the project.

## 1. Run it

No build step and no install.

1. Open `index.html` in a browser (double-click), or serve the folder: `python -m http.server 8000` and visit `http://localhost:8000`.
2. Demo login: `tanvi.bansal@paytm` / `Spend@123`. Or press **Register** to create your own account (it starts empty).

Data is saved in the browser (localStorage), so each browser keeps its own data. Account page, **Reset demo data**, wipes it.

## 2. Folder structure

```
spendwise/
  index.html  login.html  register.html  forgot.html     public pages
  dashboard.html  money.html  investment.html            app pages (need login)
  upi.html  academy.html  account.html                   app pages (need login)
  404.html                                               not-found page
  css/
    styles.css    shared design system (colours, fonts, buttons, forms, cards, sidebar)
    auth.css      split layout shared by login / register / forgot
    <page>.css    one file per page: only the styles that page alone needs
  js/
    store.js      the data layer: JSON saved in localStorage, login, JSON download
    validate.js   form rules and the form helper (wireForm)
    shell.js      login guard + sidebar + top bar for app pages
    <page>.js     one file per page: that page's behaviour
    vendor/qrcode.js   third-party QR library (MIT), used only by upi.js
  assets/         logo images
  docs/           these notes
```

Rule: **HTML holds structure only.** Styles live in `css/`, behaviour lives in `js/`.

## 3. How a page loads

Every app page loads scripts in this order:

1. `store.js` makes `Store`, `Ui`, `money()` and `totals()` available.
2. `validate.js` makes `Rules`, `wireForm()` and `showMsg()` available.
3. `shell.js` checks you are signed in (otherwise redirects to login), then builds the sidebar and top bar around the page's `<main id="content">`.
4. `<page>.js` runs that page's own logic.

The order matters because each file uses things defined by the files before it.

## 4. How data flows

```
user types  ->  form validated (validate.js)  ->  Store.update(...) saves JSON  ->  render() redraws the page
```

- All data is one JSON object under the localStorage key `spendwise.db.v2`.
- Shape: `{ users: [...], session: "u1", data: { u1: {...that user's data...} } }`.
- Each user's own data holds `transactions`, `bills`, `cash`, `holdings`, `sandboxCash`, `modules`, `xp`, `streak`, `goals`, `quizzes`.
- **Download:** registering downloads the user's details as a `.json` file automatically. "Download my data (JSON)" (Account page) and "Download my details again" (registration success screen) do it by hand.

## 5. Demo script (about 5 minutes)

1. **Pages and links:** open the landing page, click Get started, show Register, then sign in as the demo user and click every sidebar item.
2. **Validation:** on Register, submit empty, then a bad email, then mismatched passwords. Show the inline errors.
3. **Form submission and JSON:** register a new account. A `.json` file downloads. Open it and show the profile and data. Press "Download my details again" for the manual download.
4. **Per-user data:** the new account starts empty. Sign out and sign in as Tanvi to show separate data.
5. **Interactions:**
   - Money & UPI: add a transaction, search for it, filter by category, delete it, pay a bill.
   - Dashboard: switch the chart between Outflows and Savings, set a weekly cap and a savings goal.
   - Investment: buy and sell in the practice sandbox, filter holdings.
   - Academy: complete a lesson, take a quiz, watch XP change.
6. **Persistence:** refresh the page. Everything is still there because it is saved as JSON.
7. **Errors:** type a wrong password, type a bad URL (404 page).

## 6. What works and what to say about it

| Area | Status | Notes |
|---|---|---|
| Pages and navigation | Works | Login guard redirects signed-out visitors |
| Form validation | Works | One shared helper for all forms |
| Dashboard (chart, cap, goals) | Works | Chart shows the last 7 days; goal forms reload the page after saving |
| Money & UPI page | Works | Add, search, filter, delete, pay bill |
| Investment sandbox | Works | Prices are simulated (no live market feed yet) |
| Academy lessons, quizzes, XP, badges | Works | |
| Academy "Add a lesson video" | Works but odd | It is a content-admin style feature on the user side; say it is a placeholder |
| UPI tools page | Experimental | Say: "we are experimenting with UPI features" |
| Login, register, reset | Works | Passwords are stored as plain text for now (hashing is planned for A3) |
| JSON saving | Works | localStorage plus downloadable `.json`. Writing a file to disk automatically needs Node (planned) |

## 7. How to add a new page

1. Copy an existing app page, for example `account.html`, to `newpage.html`.
2. Change `data-page`, `data-title`, `data-sub` on `<body>` and the content inside `<main id="content">`.
3. Create `css/newpage.css` and `js/newpage.js`, and link them in the page (CSS in `<head>`, JS at the end after `shell.js`).
4. Add `['newpage', 'Label']` to the `links` array in `js/shell.js` so it appears in the sidebar.

## 8. How to add a new form

1. Put a `<form id="x" novalidate>` in the HTML. Each field is a `div.field` with a `<label>`, the input, and `<span class="err" role="alert">`.
2. In the page's JS call `wireForm(x, { fieldName: [Rules.required, ...] }, (values, form) => { ... })`.
3. Inside the callback, save with `Store.update(db => { ... })` and then redraw.

## 9. Common problems

- **Blank page or redirect to login:** you are signed out, which is intended for app pages.
- **Old data looks strange:** Account page, **Reset demo data**.
- **Nothing saves:** the browser is blocking storage (private mode). A red banner appears at the top.
- **Fonts look different offline:** Arapey and Plus Jakarta Sans load from Google Fonts; offline it falls back to Georgia and a system font.
