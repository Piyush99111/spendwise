# JAVASCRIPT UNDERSTANDING: what every script does

A file-by-file guide to the JavaScript in SpendWise, written so any team member can explain and modify it in the viva.
UPI (`upi.js`) is an experiment and is only summarised at the end.

## 0. Core ideas used everywhere

| Idea | Meaning | Where you see it |
|---|---|---|
| **JSON** | Text format for objects and arrays | `JSON.stringify` to save, `JSON.parse` to load |
| **localStorage** | Browser storage that survives refresh; stores strings only | `store.js` |
| **DOM** | The page as objects JavaScript can read and change | `getElementById`, `innerHTML`, `classList` |
| **Event** | Something the user does (click, submit, blur, input) | `addEventListener` |
| **Event delegation** | One listener on `document` handles many buttons, found with `e.target.closest(...)` | tabs, delete, pay |
| **render()** | A function that reads saved data and redraws the page | `money.js`, `investment.js`, `academy.js` |
| **Template string** | Text in backticks with `${value}` inside | building rows of HTML |
| **Arrow function** | Short function: `x => x * 2` | everywhere |
| **Array methods** | `map` (transform), `filter` (keep some), `find` (first match), `reduce` (add up), `some` (any match) | everywhere |

The flow of every feature:

```
event  ->  validate  ->  Store.update(change data)  ->  render()  ->  page shows new data
```

---

## 1. `js/store.js`: the data layer

### 1.1 `daysAgo(n, hm)`
Builds a date string `YYYY-MM-DDThh:mm` for `n` days before today. The demo transactions use it, so the weekly chart always has data on demo day.

### 1.2 `DEMO`
The demo user's data object: `transactions`, `bills`, `cash`, `holdings`, `sandboxCash`, `sandboxStart`, `modules`, `xp`, `streak`, `goals`.

### 1.3 `newUserData()`
Returns the starting data for a new account: empty transactions and bills, `cash: 0`, the same four assets at value 0, ₹1,00,000 of sandbox credit, modules with no lessons done, `xp: 0`, and empty goals. `DEMO.holdings.map(h => ({...h, value: 0}))` copies each asset with value set to 0 (`...h` spreads the old fields).

### 1.4 The `Store` object

| Member | What it does |
|---|---|
| `KEY` | The localStorage key, `spendwise.db.v2` |
| `ok` | `true` if localStorage works. Tested once by writing and deleting a test key inside try/catch |
| `root()` | Reads the whole saved object. If nothing is saved (first visit) it builds a fresh one with the demo user and saves it |
| `saveRoot(r)` | `JSON.stringify` the object and `setItem`. If the browser refuses (full or blocked) it shows a toast |
| `updateRoot(fn)` | Load the whole object, run `fn` to change it, save it |
| `load()` | Returns the signed-in user's own data: `root.data[root.session]` |
| `save(d)` | Replaces the signed-in user's data |
| `update(fn)` | Load, let `fn` change the user's data, save. **Most changes in the app go through this** |
| `uid(p)` | Random id like `t4k9x2`: a prefix plus a random base-36 string |
| `reset()` | Deletes everything (Account page) |
| `user()` | The user record (name, email, upi) for the current session, or `null` |
| `login(id, pw)` | Finds a user whose email (case-insensitive) and password match. If found it stores `session = user.id` and returns `true` |
| `createUser(name, email, pw)` | Makes an id, adds the user, gives them `newUserData()`, signs them in |
| `logout()` | Sets `session` to `null` and goes to the login page |
| `exportJson()` | Builds `{ exportedAt, profile, data }` (never the password), makes a `Blob`, a temporary `<a download>`, clicks it, and cleans up |

Saved shape: `{ users: [...], session, data: { [userId]: {...} } }`. This is how each user gets their own data.

### 1.5 Helpers
- `money(n)` formats a number as rupees: `₹1,03,450` (`toLocaleString('en-IN')`).
- `Ui.toast(msg)` shows a small message bottom-right for about 3 seconds. It creates the toast element once and reuses it.
- `totals(db)` returns `{ total, committed, disposable }`. Committed is the sum of the bills, and disposable is cash minus committed.

### 1.6 Error handling at the bottom
- A `window` `error` listener shows a toast if any script crashes.
- On `DOMContentLoaded`, if `Store.ok` is false it inserts a red banner: the browser is blocking storage.

---

## 2. `js/validate.js`: form checking

### 2.1 `Rules`
Each rule takes the typed value and returns an error text, or `''` if it is fine.

| Rule | Passes when |
|---|---|
| `required` | Not empty after `trim()` |
| `email` | Regex `^[^\s@]+@[^\s@]+$`: something, `@`, something, no spaces |
| `password` | 8 or more characters, at least one letter and one digit |
| `amount` | `Number(v) > 0` |

### 2.2 `validateField(input, rules)`
1. Finds the wrapper `.field` of the input.
2. Runs the rules in order; the first error wins.
3. Toggles the class `invalid` (red border, shows the error line), writes the message into `.err`, and sets `aria-invalid`.
4. Returns `true` or `false`.

### 2.3 `wireForm(form, spec, onValid)`
- `spec` maps field names to rule lists.
- **blur** on a field: validate just that field.
- **submit**: `e.preventDefault()` (stops the page reload), validate all fields; if any fail, focus the first bad one and stop.
- If all pass, builds `Object.fromEntries(new FormData(form))` (every field, including dropdowns) and calls `onValid(values, form)`.

### 2.4 `showMsg(form, text, kind)`
Shows the form's banner (`.form-msg`) in red (`bad`) or green (`good`). Used for errors that are not about one field, like "wrong password".

### 2.5 Show/hide password
A single `click` listener on `document` looks for `[data-toggle-pw]`. It flips the input's `type` between `password` and `text` and updates the button text.

---

## 3. `js/shell.js`: login guard, sidebar, top bar

It is an IIFE (a function that runs immediately), so its variables stay private.

1. `Store.user()`: if nobody is signed in, `location.replace('login.html')` and stop.
2. Reads `data-page`, `data-title`, `data-sub`, `data-section` from `<body>`.
3. Builds the sidebar (links array, the current page gets `aria-current="page"`), the status box, and the top bar (title, search box, name chip with initials).
4. `shell.querySelector('.main').append(content)` moves the page's own `#content` into the new layout.
5. Sign out link calls `Store.logout()`. The Menu button toggles the `open` class on the sidebar (mobile) and updates `aria-expanded`.

---

## 4. Auth pages

### `js/login.js`
- If already signed in, redirect to the dashboard.
- `wireForm` with `id` and `password` required. On success, `Store.login(...)`: if true go to the dashboard, otherwise show an error. After 3 misses the message suggests "Forgot password?".

### `js/register.js`
- Rules: name required, email format, password strength, and `confirm` must equal the first password (a small inline rule function).
- On success: refuses an already-registered email; otherwise `Store.createUser`, then `Store.exportJson()` (the **automatic download**), then replaces the card with a success screen with "Download my details again" (the **manual download**) and a Continue link.

### `js/forgot.js`
- Checks the email exists; `Store.updateRoot` changes that user's password; shows a green message and redirects to login after 1.2 seconds (`setTimeout`).

---

## 5. `js/dashboard.js`

1. Loads data and `totals`. `budget = weeklyCap / 7` is the daily budget.
2. `days`: an array of the last 7 days, each `{ key, name, out: 0 }`. Loops over expense transactions (ignoring category "Savings goal") and adds each amount to the matching day by comparing `toDateString()`.
3. Shows the liquid capital (disposable), today's inflow, and the cap bar: `weekSpend / cap` as a percent (capped at 100).
4. `draw(mode)`: for "out" it uses each day's spending; for "save" it uses `budget - spending` (never below 0). Bar heights are scaled to the largest value; the two buttons set `aria-pressed`. Called on load and on each tab click.
5. Instruments list (`.map` builds rows): weekly cap left, sandbox holdings value, current module and XP.
6. Advisory text: if yesterday's spending was under the daily budget it says how much was saved; otherwise it warns.
7. **Budget goals:** fills the form from `db.goals`, shows saved/target progress. `gf` saves cap, name and target and reloads the page. `af` ("Move to goal") checks a goal exists and the amount does not exceed disposable capital; then subtracts from `cash`, adds to `goals.saved`, logs a "Savings goal" transaction, and reloads.

---

## 6. `js/money.js`

State: `cat` (the active category filter). `esc()` escapes `& < > "` so typed text cannot inject HTML.

### `render()`
1. Loads data and the search text.
2. Shows total, disposable, committed.
3. Builds category tabs from the categories that exist (`new Set` removes duplicates).
4. Filters transactions by category and search text, sorts newest first (`localeCompare` on date strings), and builds rows with `.map(...).join('')`. If none, shows an empty message.
5. Builds the bills list. Computes income and spending (ignoring "Savings goal"), then sets the widths of the savings and spending bars and the text.

### Events
- One `click` listener on `document` (delegation):
  - `[data-cat]` sets the filter and re-renders.
  - `[data-del]` deletes a transaction and undoes its effect on `cash`.
  - `[data-pay]` pays a bill: checks balance, subtracts cash, removes the bill, adds a "Bills" transaction.
- The top-bar search box `input` event calls `render()` on every keystroke.
- `wireForm` for the add form: merchant required, amount above 0. Pushes a transaction and adjusts cash up or down by Type, resets the form, shows a toast, re-renders.

---

## 7. `js/investment.js`

State: `f` (filter). `KINDS = ['All', 'Equities', 'Gold', 'Mutual Funds']`.

### `render()`
- `inv` is the sum of holdings; `total = inv + sandboxCash`. Gain percent is measured against `sandboxStart` (the value when the sandbox opened).
- Allocation bar: one coloured segment per kind (and Cash) with width `value / total`.
- Holdings list filtered by tab and search. The asset dropdown is rebuilt and keeps the current selection.

### Trading form
`wireForm` on `amount`. For Buy: refuses if the amount exceeds `sandboxCash`. For Sell: refuses if it exceeds that holding's value. Otherwise one `Store.update` moves money: `value += sign * amount` and `sandboxCash -= sign * amount`, where `sign` is 1 for buy and -1 for sell. Prices are simulated; no live market data yet.

---

## 8. `js/academy.js`

- `QUIZ`: an object with 3 questions per module `[text, options, indexOfCorrect]`.
- `full(m)` is true when all lessons are done. `unlocked(db, m)` is true when the module has no prerequisite or the prerequisite is complete. This drives the **Locked / Start / Resume / Completed** states.
- `render()`: builds filter tabs, module rows (progress bar, buttons by state, quiz button showing the best score), the XP bar (level = `floor(xp / 250) + 1`), and the badges (earned by conditions like modules completed or streak).
- **Lesson button:** increments `done`; when it reaches `lessons` the XP is added and a toast shows.
- **Quiz:** `openQuiz` builds radio buttons inside a `<dialog>` and calls `showModal()`. On Submit it requires every question answered, counts the correct ones, keeps the best score, gives +20 XP only the first time you pass (2 of 3), and shows the correct answers.
- **Add a lesson video (odd feature):** the `ytId` regex extracts the 11-character ID from watch, youtu.be, embed or shorts links; the `youtube` rule rejects other links; the video is stored on the module and shown in an iframe on `youtube-nocookie.com`. This is a content-admin feature on the user side, so describe it as a placeholder.

---

## 9. `js/account.js`

Shows the name and email (email read-only). The profile form updates the user's name with `Store.updateRoot`. The Download button calls `Store.exportJson()`. Reset asks `confirm(...)`, then `Store.reset()` and goes to login.

---

## 10. `js/upi.js` (experimental)

Say: **"we are experimenting with UPI features."** In one line each: it builds a standard `upi://pay` link and QR code from a form, saves a UPI ID, and reads a CSV statement with `FileReader`, validates each row, guesses a category from keywords, and imports new rows. `js/vendor/qrcode.js` is a third-party MIT-licensed library that draws the QR code.

---

## 11. Likely viva questions

| Question | Short answer |
|---|---|
| Why `preventDefault()` on submit? | Otherwise the browser reloads the page before our code runs |
| Why `JSON.stringify`/`parse`? | localStorage holds only strings |
| What is event delegation? | One listener on `document` handles buttons that are created later by `render()` |
| What does `Store.update` do? | Loads, lets a function change the data, saves; keeps every change consistent |
| How does each user get their own data? | Data is saved under `data[userId]`; `load()` returns the signed-in user's part |
| Why escape text with `esc()`? | To stop typed HTML or scripts from breaking the page (XSS) |
| What are the weaknesses? | Plain-text passwords, data lives only in one browser, prices are simulated |
| What changes in A3? | `Store.load/save` become `fetch()` calls to Express routes backed by MongoDB; the data shape stays |
