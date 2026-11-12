/* ==========================================================================
   investment.js — Simulated Investment Sandbox & Asset Allocation
   ========================================================================== */

let activeAssetFilter = 'All';
const KINDS = ['All', 'Equities', 'Gold', 'Mutual Funds'];
const START = 100000;

// DOM references
const totalAssetsEl = document.getElementById('tot');
const sandboxCashEl = document.getElementById('cash');
const gainNoteEl = document.getElementById('gain');
const allocationBarEl = document.getElementById('alloc');
const allocationLegendEl = document.getElementById('legend');
const filterTabsEl = document.getElementById('tabs');
const holdingsListEl = document.getElementById('list');
const assetSelectEl = document.getElementById('as');
const searchInput = document.getElementById('q');
const tradeForm = document.getElementById('tf');

// Redraw portfolio totals, asset allocation bar, holdings list, and trade dropdown
function render() {
    const userData = Store.load();
    const searchQuery = searchInput.value.trim().toLowerCase();

    // 1. Compute total holdings value, sandbox cash, and percentage gain
    const investedTotal = userData.holdings.reduce((sum, holding) => sum + holding.value, 0);
    const totalPortfolioValue = investedTotal + userData.sandboxCash;

    totalAssetsEl.textContent = money(totalPortfolioValue);
    sandboxCashEl.textContent = money(userData.sandboxCash);

    const startingBalance = userData.sandboxStart || totalPortfolioValue;
    const gainPercentage = ((totalPortfolioValue - startingBalance) / startingBalance) * 100;
    const gainSign = gainPercentage >= 0 ? '+' : '';
    gainNoteEl.textContent = `${gainSign}${gainPercentage.toFixed(1)}% since you opened the sandbox`;

    // 2. Render asset allocation bar and legend percentages
    const categoryColors = {
        Equities: 'var(--cyan)',
        Gold: 'var(--amber)',
        'Mutual Funds': 'var(--green)',
        Cash: '#94a3b8'
    };

    const assetCategories = ['Equities', 'Gold', 'Mutual Funds'];
    const allocationParts = [
        ...assetCategories.map(kindName => {
            const kindSum = userData.holdings
                .filter(holding => holding.kind === kindName)
                .reduce((sum, holding) => sum + holding.value, 0);
            return [kindName, kindSum];
        }),
        ['Cash', userData.sandboxCash]
    ];

    allocationBarEl.innerHTML = allocationParts
        .map(([kindName, amount]) => {
            const widthPct = (amount / totalPortfolioValue) * 100;
            return `<i style="width:${widthPct}%;background:${categoryColors[kindName]}"></i>`;
        })
        .join('');

    allocationLegendEl.textContent = allocationParts
        .map(([kindName, amount]) => `${kindName} ${Math.round((amount / totalPortfolioValue) * 100)}%`)
        .join(' · ');

    // 3. Render asset class filter tabs
    filterTabsEl.innerHTML = KINDS
        .map(kindName => {
            const isSelected = kindName === activeAssetFilter;
            return `<button class="tab" aria-pressed="${isSelected}" data-k="${kindName}">${kindName}</button>`;
        })
        .join('');

    // 4. Filter and render holdings list
    const visibleHoldings = userData.holdings.filter(holding => {
        const matchesKind = activeAssetFilter === 'All' || holding.kind === activeAssetFilter;
        const matchesSearch = (holding.name + holding.sym).toLowerCase().includes(searchQuery);
        return matchesKind && matchesSearch;
    });

    if (visibleHoldings.length) {
        holdingsListEl.innerHTML = visibleHoldings
            .map(holding => {
                const iconLetters = holding.name.slice(0, 2).toUpperCase();
                const changeClass = holding.change >= 0 ? 'up' : 'down';
                const changeSign = holding.change >= 0 ? '+' : '';

                return `
                    <div class="row">
                        <span class="ic">${iconLetters}</span>
                        <div class="grow">
                            <b>${holding.name}</b>
                            <span>${holding.kind} · ${holding.sym}</span>
                        </div>
                        <div style="text-align:right">
                            <b>${money(holding.value)}</b><br>
                            <span class="${changeClass}" style="font-size:.78rem">${changeSign}${holding.change}%</span>
                        </div>
                    </div>
                `;
            })
            .join('');
    } else {
        holdingsListEl.innerHTML = '<p class="empty">No holdings in this view.</p>';
    }

    // 5. Populate asset selector in the sandbox trade form while preserving current selection
    const previousSelection = assetSelectEl.value;
    assetSelectEl.innerHTML = userData.holdings
        .map(holding => `<option value="${holding.id}">${holding.name}</option>`)
        .join('');

    if (previousSelection) {
        assetSelectEl.value = previousSelection;
    }
}

// Switch active asset filter tab on click
document.addEventListener('click', (event) => {
    const filterTabBtn = event.target.closest('[data-k]');
    if (filterTabBtn) {
        activeAssetFilter = filterTabBtn.dataset.k;
        render();
    }
});

// Re-render when typing in the top search bar
searchInput.addEventListener('input', render);

// Handle simulated Buy / Sell orders in the practice sandbox
wireForm(
    tradeForm,
    {
        amount: [Rules.amount]
    },
    (formValues, formEl) => {
        const orderAmount = Number(formValues.amount);
        const userData = Store.load();
        const selectedHolding = userData.holdings.find(item => item.id === formValues.asset);

        if (formValues.action === 'buy' && orderAmount > userData.sandboxCash) {
            showMsg(formEl, 'Not enough sandbox cash for that order.', 'bad');
            return;
        }

        if (formValues.action === 'sell' && orderAmount > selectedHolding.value) {
            showMsg(
                formEl,
                `You cannot sell more than the holding is worth (${money(selectedHolding.value)}).`,
                'bad'
            );
            return;
        }

        // Apply the buy (+1) or sell (-1) order to the holding and sandbox cash
        Store.update(data => {
            const targetHolding = data.holdings.find(item => item.id === formValues.asset);
            const directionSign = formValues.action === 'buy' ? 1 : -1;

            targetHolding.value += directionSign * orderAmount;
            data.sandboxCash -= directionSign * orderAmount;
        });

        formEl.querySelector('.form-msg').className = 'form-msg';
        formEl.reset();

        const actionLabel = formValues.action === 'buy' ? 'Bought' : 'Sold';
        Ui.toast(`${actionLabel} ${money(orderAmount)} of ${selectedHolding.name}`);
        render();
    }
);

render();
