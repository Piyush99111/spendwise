/* ==========================================================================
   money.js — Cashflow, Transactions, Bills & Savings Ratio
   ========================================================================== */

let activeCategory = 'All';

// Escape special characters to prevent HTML injection (XSS) when rendering user text
const esc = (str) => {
    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    };
    return String(str).replace(/[&<>"]/g, char => htmlEntities[char]);
};

// DOM references
const totalBalanceEl = document.getElementById('tot');
const disposableEl = document.getElementById('dis');
const committedEl = document.getElementById('com');
const categoryTabsEl = document.getElementById('cats');
const transactionFeedEl = document.getElementById('feed');
const billsListEl = document.getElementById('bills');
const savingsBarEl = document.getElementById('sv');
const spendBarEl = document.getElementById('sp');
const ratioTextEl = document.getElementById('ratio');
const searchInput = document.getElementById('q');
const transactionForm = document.getElementById('tf');

// Redraw balances, category tabs, transactions list, bills, and savings ratio bar
function render() {
    const userData = Store.load();
    const balanceSummary = totals(userData);
    const searchQuery = searchInput.value.trim().toLowerCase();

    // 1. Update top balance cards
    totalBalanceEl.textContent = money(balanceSummary.total);
    disposableEl.textContent = money(balanceSummary.disposable);
    committedEl.textContent = money(balanceSummary.committed);

    // 2. Render category filter tabs
    const uniqueCategories = ['All', ...new Set(userData.transactions.map(tx => tx.category))];
    categoryTabsEl.innerHTML = uniqueCategories
        .map(categoryName => {
            const isSelected = categoryName === activeCategory;
            return `<button class="tab" aria-pressed="${isSelected}" data-cat="${esc(categoryName)}">${esc(categoryName)}</button>`;
        })
        .join('');

    // 3. Filter and sort transactions (newest first)
    const filteredTransactions = userData.transactions
        .filter(tx => {
            const matchesCategory = activeCategory === 'All' || tx.category === activeCategory;
            const matchesSearch = (tx.merchant + tx.category).toLowerCase().includes(searchQuery);
            return matchesCategory && matchesSearch;
        })
        .sort((txA, txB) => txB.date.localeCompare(txA.date));

    if (filteredTransactions.length) {
        transactionFeedEl.innerHTML = filteredTransactions
            .map(tx => {
                const iconLetters = esc(tx.merchant.slice(0, 2).toUpperCase());
                const formattedDate = new Date(tx.date).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
                const amountClass = tx.type === 'in' ? 'up' : '';
                const amountSign = tx.type === 'in' ? '+' : '-';

                return `
                    <div class="row">
                        <span class="ic">${iconLetters}</span>
                        <div class="grow">
                            <b>${esc(tx.merchant)}</b>
                            <span>${formattedDate} · ${esc(tx.category)}</span>
                        </div>
                        <b class="${amountClass}">${amountSign}${money(tx.amount)}</b>
                        <button class="btn ghost sm" data-del="${tx.id}" aria-label="Delete ${esc(tx.merchant)}">Delete</button>
                    </div>
                `;
            })
            .join('');
    } else {
        transactionFeedEl.innerHTML = '<p class="empty">No transactions match. Add one with the form.</p>';
    }

    // 4. Render immediate upcoming bills
    if (userData.bills.length) {
        billsListEl.innerHTML = userData.bills
            .map(bill => {
                const iconLetters = esc(bill.name.slice(0, 2).toUpperCase());
                return `
                    <div class="row">
                        <span class="ic">${iconLetters}</span>
                        <div class="grow">
                            <b>${esc(bill.name)}</b>
                            <span>${esc(bill.due)}</span>
                        </div>
                        <b>${money(bill.amount)}</b>
                        <button class="btn ghost sm" data-pay="${bill.id}">Pay</button>
                    </div>
                `;
            })
            .join('');
    } else {
        billsListEl.innerHTML = '<p class="empty">Nothing due. You are all caught up.</p>';
    }

    // 5. Calculate and render Savings vs Spend progress bars
    const totalInflow = userData.transactions
        .filter(tx => tx.type === 'in')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const totalOutflow = userData.transactions
        .filter(tx => tx.type === 'out' && tx.category !== 'Savings goal')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const barScaleBase = Math.max(totalInflow, totalOutflow, 1);
    const netSavings = Math.max(0, totalInflow - totalOutflow);
    const savingsRatePct = totalInflow ? Math.round((netSavings / totalInflow) * 100) : 0;

    savingsBarEl.style.width = (netSavings / barScaleBase) * 100 + '%';
    spendBarEl.style.width = (totalOutflow / barScaleBase) * 100 + '%';
    ratioTextEl.textContent =
        `Savings ${money(netSavings)} (${savingsRatePct}% of inflow) · Spent ${money(totalOutflow)}`;
}

// Event delegation for category tabs, transaction deletion, and bill payments
document.addEventListener('click', (event) => {
    const categoryTabBtn = event.target.closest('[data-cat]');
    const deleteTxBtn = event.target.closest('[data-del]');
    const payBillBtn = event.target.closest('[data-pay]');

    // Switch active category filter
    if (categoryTabBtn) {
        activeCategory = categoryTabBtn.dataset.cat;
        render();
    }

    // Delete a transaction and reverse its effect on cash balance
    if (deleteTxBtn) {
        const txIdToDelete = deleteTxBtn.dataset.del;

        Store.update(userData => {
            const targetTx = userData.transactions.find(tx => tx.id === txIdToDelete);
            if (targetTx) {
                userData.cash += targetTx.type === 'out' ? targetTx.amount : -targetTx.amount;
            }
            userData.transactions = userData.transactions.filter(tx => tx.id !== txIdToDelete);
        });

        Ui.toast('Transaction deleted');
        render();
    }

    // Pay a due bill and record it as a transaction
    if (payBillBtn) {
        const userData = Store.load();
        const targetBill = userData.bills.find(bill => bill.id === payBillBtn.dataset.pay);

        if (targetBill.amount > userData.cash) {
            Ui.toast('Not enough balance to pay this bill');
            return;
        }

        Store.update(data => {
            data.cash -= targetBill.amount;
            data.bills = data.bills.filter(bill => bill.id !== targetBill.id);
            data.transactions.push({
                id: Store.uid('t'),
                merchant: targetBill.name,
                category: 'Bills',
                amount: targetBill.amount,
                type: 'out',
                date: new Date().toISOString().slice(0, 16)
            });
        });

        Ui.toast(targetBill.name + ' paid');
        render();
    }
});

// Re-render when typing in the top search bar
searchInput.addEventListener('input', render);

// Handle "Add a transaction" form submission
wireForm(
    transactionForm,
    {
        merchant: [Rules.required],
        amount: [Rules.amount]
    },
    (formValues, formEl) => {
        const txAmount = Number(formValues.amount);

        Store.update(userData => {
            userData.transactions.push({
                id: Store.uid('t'),
                merchant: formValues.merchant.trim(),
                category: formValues.category,
                amount: txAmount,
                type: formValues.type,
                date: new Date().toISOString().slice(0, 16)
            });
            userData.cash += formValues.type === 'in' ? txAmount : -txAmount;
        });

        formEl.reset();
        Ui.toast('Transaction saved');
        render();
    }
);

render();
