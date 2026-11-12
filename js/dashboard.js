/* ==========================================================================
   dashboard.js — Portfolio Overview, Weekly Flow Chart & Budget Goals
   ========================================================================== */

const userData = Store.load();
const balanceSummary = totals(userData);
const ONE_DAY_MS = 86400000;
const dailyBudget = userData.goals.weeklyCap / 7;

// Build an array for the last 7 days (oldest to today)
const lastSevenDays = [...Array(7)].map((_, index) => {
    const dateObj = new Date(Date.now() - (6 - index) * ONE_DAY_MS);
    return {
        key: dateObj.toDateString(),
        name: dateObj.toLocaleDateString('en-IN', { weekday: 'short' }),
        out: 0
    };
});

// Sum outgoing spending for each of the last 7 days (excluding savings goal transfers)
userData.transactions
    .filter(tx => tx.type === 'out' && tx.category !== 'Savings goal')
    .forEach(tx => {
        const txDateKey = new Date(tx.date).toDateString();
        const matchingDay = lastSevenDays.find(day => day.key === txDateKey);
        if (matchingDay) {
            matchingDay.out += tx.amount;
        }
    });

// Calculate today's incoming UPI money
const todayDateKey = new Date().toDateString();
const todayInflow = userData.transactions
    .filter(tx => tx.type === 'in' && new Date(tx.date).toDateString() === todayDateKey)
    .reduce((sum, tx) => sum + tx.amount, 0);

// Render top liquid capital card and weekly spending cap bar
document.getElementById('liquid').textContent = money(balanceSummary.disposable);
document.getElementById('today').textContent = todayInflow
    ? `+${money(todayInflow)} today from UPI`
    : 'No inflow yet today';

const weeklySpend = lastSevenDays.reduce((sum, day) => sum + day.out, 0);
const weeklyCap = userData.goals.weeklyCap;
const capPercentage = Math.min(100, Math.round((weeklySpend / weeklyCap) * 100));
const remainingCap = Math.max(0, weeklyCap - weeklySpend);

document.getElementById('capbar').style.width = capPercentage + '%';
document.getElementById('capnote').textContent =
    `${money(remainingCap)} left of this week's ${money(weeklyCap)} spending cap`;

// Draw the 7-day bar chart ('out' = daily outflows, 'save' = daily budget saved)
function draw(mode) {
    const barValues = lastSevenDays.map(day => {
        return mode === 'out' ? day.out : Math.max(0, dailyBudget - day.out);
    });
    const maxBarValue = Math.max(...barValues, 1);
    const barColor = mode === 'out' ? 'var(--ink)' : 'var(--green-deep)';

    document.getElementById('chart').innerHTML = lastSevenDays
        .map((day, index) => {
            const barHeightPx = Math.max(4, (barValues[index] / maxBarValue) * 130);
            return `
                <div>
                    <small>${money(barValues[index])}</small>
                    <i style="height:${barHeightPx}px;background:${barColor}"></i>
                    <small>${day.name}</small>
                </div>
            `;
        })
        .join('');

    document.querySelectorAll('[data-mode]').forEach(tabBtn => {
        tabBtn.setAttribute('aria-pressed', tabBtn.dataset.mode === mode);
    });
}

document.querySelectorAll('[data-mode]').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
        draw(tabBtn.dataset.mode);
    });
});
draw('out');

// Render portfolio instruments summary list
const totalInvested = userData.holdings.reduce((sum, holding) => sum + holding.value, 0);
const currentModule = userData.modules.find(moduleItem => {
    const isIncomplete = moduleItem.done < moduleItem.lessons;
    if (!moduleItem.needs) {
        return isIncomplete;
    }
    const prereqModule = userData.modules.find(item => item.id === moduleItem.needs);
    return isIncomplete && prereqModule.done === prereqModule.lessons;
});

const instrumentRows = [
    [
        'W1',
        'Weekly liquidity cap',
        `${money(remainingCap)} remaining this week`,
        `${100 - capPercentage}%`
    ],
    [
        'SB',
        'Trading sandbox',
        `Holdings worth ${money(totalInvested)}`,
        `${userData.holdings.length} assets`
    ],
    [
        'XP',
        currentModule ? currentModule.title : 'All modules complete',
        `${userData.streak}-day streak`,
        `${userData.xp} XP`
    ]
];

document.getElementById('inst').innerHTML = instrumentRows
    .map(([iconCode, title, subtitle, badgeText]) => `
        <div class="row">
            <span class="ic">${iconCode}</span>
            <div class="grow">
                <b>${title}</b>
                <span>${subtitle}</span>
            </div>
            <span class="badge c">${badgeText}</span>
        </div>
    `)
    .join('');

// Render daily surplus advisory message based on yesterday's spending
const yesterdaySpend = lastSevenDays[5].out;
const yesterdaySurplus = Math.max(0, dailyBudget - yesterdaySpend);

document.getElementById('advtext').textContent = yesterdaySurplus
    ? `You kept ${money(yesterdaySurplus)} under your daily budget yesterday. Moving it into your practice portfolio puts idle cash to work.`
    : 'Yesterday went over your daily budget. Review Money & UPI before adding to the sandbox.';

/* ---- Budget & Savings Goals Section ---- */

const userGoals = userData.goals;
const weeklyCapInput = document.getElementById('wc');
const goalNameInput = document.getElementById('gn');
const goalTargetInput = document.getElementById('gtg');
const goalSavedEl = document.getElementById('gsaved');
const goalBarEl = document.getElementById('gbar');
const goalNoteEl = document.getElementById('gnote');
const goalForm = document.getElementById('gf');
const addToGoalForm = document.getElementById('af');

weeklyCapInput.value = userGoals.weeklyCap;
goalNameInput.value = userGoals.saveName;
goalTargetInput.value = userGoals.saveTarget || '';
goalSavedEl.textContent = money(userGoals.saved);

const goalProgressPct = userGoals.saveTarget
    ? Math.min(100, Math.round((userGoals.saved / userGoals.saveTarget) * 100))
    : 0;

goalBarEl.style.width = goalProgressPct + '%';
goalNoteEl.textContent = userGoals.saveTarget
    ? `${goalProgressPct}% of ${money(userGoals.saveTarget)} for “${userGoals.saveName}”`
    : 'Set a goal to start saving toward it.';

// Save updated weekly spending cap and savings goal target
wireForm(
    goalForm,
    {
        weeklyCap: [Rules.amount],
        saveName: [Rules.required],
        saveTarget: [Rules.amount]
    },
    (formValues) => {
        Store.update(data => {
            data.goals.weeklyCap = Number(formValues.weeklyCap);
            data.goals.saveName = formValues.saveName.trim();
            data.goals.saveTarget = Number(formValues.saveTarget);
        });
        location.reload();
    }
);

// Move money from available cash into the user's savings goal
wireForm(
    addToGoalForm,
    {
        amount: [Rules.amount]
    },
    (formValues, formEl) => {
        const transferAmount = Number(formValues.amount);

        if (!userData.goals.saveTarget) {
            showMsg(formEl, 'Save a goal first, then move money into it.', 'bad');
            return;
        }

        if (transferAmount > balanceSummary.disposable) {
            const maxAvailable = money(Math.max(0, balanceSummary.disposable));
            showMsg(formEl, `You only have ${maxAvailable} of disposable capital.`, 'bad');
            return;
        }

        Store.update(data => {
            data.cash -= transferAmount;
            data.goals.saved += transferAmount;
            data.transactions.push({
                id: Store.uid('t'),
                merchant: 'Goal: ' + data.goals.saveName,
                category: 'Savings goal',
                amount: transferAmount,
                type: 'out',
                date: new Date().toISOString().slice(0, 16)
            });
        });

        location.reload();
    }
);
