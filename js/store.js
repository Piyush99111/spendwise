/* ==========================================================================
   store.js — LocalStorage Data Layer & Shared Helpers
   ========================================================================== */

// Helper: returns an ISO-like date string (YYYY-MM-DDTHH:MM) for `days` ago
const daysAgo = (days, timeString) => {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const padTwoDigits = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = padTwoDigits(date.getMonth() + 1);
    const day = padTwoDigits(date.getDate());

    return `${year}-${month}-${day}T${timeString}`;
};

// Default seed data for the demo account (Tanvi Bansal)
const DEMO = {
    transactions: [
        {
            id: 't1',
            merchant: 'Swiggy Gourmet Delivery',
            category: 'Dining & Provisions',
            amount: 340,
            type: 'out',
            date: daysAgo(1, '14:30')
        },
        {
            id: 't2',
            merchant: 'Amazon Prime Subscription',
            category: 'Digital Services',
            amount: 1299,
            type: 'out',
            date: daysAgo(1, '11:15')
        },
        {
            id: 't3',
            merchant: 'Metro Transit Line',
            category: 'Transportation',
            amount: 180,
            type: 'out',
            date: daysAgo(2, '09:10')
        },
        {
            id: 't5',
            merchant: 'Campus Canteen',
            category: 'Dining & Provisions',
            amount: 260,
            type: 'out',
            date: daysAgo(3, '13:00')
        },
        {
            id: 't6',
            merchant: 'Uber Ride',
            category: 'Transportation',
            amount: 420,
            type: 'out',
            date: daysAgo(4, '19:20')
        },
        {
            id: 't7',
            merchant: 'Stationery Hub',
            category: 'Education',
            amount: 550,
            type: 'out',
            date: daysAgo(5, '16:00')
        },
        {
            id: 't8',
            merchant: 'Cafe Coffee Day',
            category: 'Dining & Provisions',
            amount: 310,
            type: 'out',
            date: daysAgo(6, '17:40')
        },
        {
            id: 't4',
            merchant: 'Pocket money (UPI)',
            category: 'Income',
            amount: 35000,
            type: 'in',
            date: daysAgo(28, '10:00')
        }
    ],
    bills: [
        { id: 'b1', name: 'Spotify Premium', amount: 119, due: 'Due Today' },
        { id: 'b2', name: 'Netflix 4K Plan', amount: 649, due: 'Due Tomorrow' },
        { id: 'b3', name: 'Apartment Lease', amount: 8000, due: 'In 5 Days' },
        { id: 'b4', name: 'Fitness Membership', amount: 1500, due: 'Next Week' }
    ],
    cash: 24800,
    holdings: [
        {
            id: 'h1',
            name: 'Reliance Industries Ltd.',
            sym: 'RELIANCE',
            kind: 'Equities',
            value: 32400,
            change: 1.2
        },
        {
            id: 'h2',
            name: 'Sovereign Digital Gold',
            sym: '24K 99.9%',
            kind: 'Gold',
            value: 36300,
            change: 0.8
        },
        {
            id: 'h3',
            name: 'SBI Bluechip Largecap Fund',
            sym: 'Direct Growth',
            kind: 'Mutual Funds',
            value: 29000,
            change: -0.3
        },
        {
            id: 'h4',
            name: 'HDFC Bank Ltd.',
            sym: 'HDFCBANK',
            kind: 'Equities',
            value: 18500,
            change: 2.1
        }
    ],
    sandboxCash: 20000,
    sandboxStart: 136200,
    modules: [
        {
            id: 'm1',
            title: 'Principles of Budgeting & Cash Flow',
            cat: 'Tax Laws',
            lessons: 5,
            done: 5,
            xp: 50,
            needs: null
        },
        {
            id: 'm2',
            title: 'Income Streams vs Fixed Liabilities',
            cat: 'Tax Laws',
            lessons: 4,
            done: 4,
            xp: 50,
            needs: null
        },
        {
            id: 'm3',
            title: 'Introduction to Indian Taxation & Regimes',
            cat: 'Tax Laws',
            lessons: 5,
            done: 2,
            xp: 100,
            needs: 'm2'
        },
        {
            id: 'm4',
            title: 'Advanced Tax Filing for Independent Professionals',
            cat: 'Tax Laws',
            lessons: 6,
            done: 0,
            xp: 100,
            needs: 'm3'
        },
        {
            id: 'm5',
            title: 'Reading an Index: Nifty 50 Basics',
            cat: 'Equities & Indices',
            lessons: 4,
            done: 0,
            xp: 80,
            needs: 'm2'
        }
    ],
    xp: 320,
    streak: 4,
    goals: {
        weeklyCap: 5600,
        saveName: 'Goa trip',
        saveTarget: 15000,
        saved: 3000
    }
};

// Creates empty initial data for a newly registered user (with ₹1,00,000 sandbox cash)
const newUserData = () => ({
    transactions: [],
    bills: [],
    cash: 0,
    holdings: DEMO.holdings.map(holding => ({
        ...holding,
        value: 0,
        change: 0
    })),
    sandboxCash: 100000,
    sandboxStart: 100000,
    modules: DEMO.modules.map(moduleItem => ({
        ...moduleItem,
        done: 0
    })),
    xp: 0,
    streak: 0,
    goals: {
        weeklyCap: 5000,
        saveName: '',
        saveTarget: 0,
        saved: 0
    }
});

// Main storage object that reads and writes user data in localStorage
// Saved structure: { users: [...], session: userId | null, data: { [userId]: userData } }
const Store = {
    KEY: 'spendwise.db.v2',

    // Check once if localStorage is available and not blocked by the browser
    ok: (() => {
        try {
            localStorage.setItem('_t', '1');
            localStorage.removeItem('_t');
            return true;
        } catch (error) {
            return false;
        }
    })(),

    // Load the entire database object from localStorage (or initialize with demo user)
    root() {
        try {
            const rawJson = localStorage.getItem(this.KEY);
            if (rawJson) {
                return JSON.parse(rawJson);
            }
        } catch (error) {
            // If storage is corrupted or blocked, fall back to fresh seed data
        }

        const freshDatabase = {
            users: [
                {
                    id: 'u1',
                    name: 'Tanvi Bansal',
                    email: 'tanvi.bansal@paytm',
                    password: 'Spend@123',
                    upi: 'SBI UPI Node • 4521'
                }
            ],
            session: null,
            data: {
                u1: structuredClone(DEMO)
            }
        };

        this.saveRoot(freshDatabase);
        return freshDatabase;
    },

    // Save the entire database object back to localStorage
    saveRoot(rootData) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(rootData));
        } catch (error) {
            Ui.toast('Could not save your changes. Browser storage is full or blocked.');
        }
    },

    // Helper to modify the root database object and immediately save it
    updateRoot(updaterFn) {
        const rootData = this.root();
        updaterFn(rootData);
        this.saveRoot(rootData);
        return rootData;
    },

    // Load only the currently signed-in user's financial data
    load() {
        const rootData = this.root();
        return rootData.data[rootData.session] || null;
    },

    // Replace the currently signed-in user's data
    save(userData) {
        this.updateRoot(rootData => {
            rootData.data[rootData.session] = userData;
        });
    },

    // Modify the signed-in user's data via a callback function and save it
    update(updaterFn) {
        const rootData = this.root();
        const currentUserData = rootData.data[rootData.session];
        updaterFn(currentUserData);
        this.saveRoot(rootData);
        return currentUserData;
    },

    // Generate a short unique ID with a prefix (e.g. 't' for transaction, 'u' for user)
    uid: (prefix) => prefix + Math.random().toString(36).slice(2, 8),

    // Clear all saved data from localStorage (resets back to demo state)
    reset() {
        localStorage.removeItem(this.KEY);
    },

    // Get the profile object (id, name, email, upi) of the signed-in user
    user() {
        const rootData = this.root();
        return rootData.users.find(user => user.id === rootData.session) || null;
    },

    // Check credentials and sign the user in if email and password match
    login(loginId, password) {
        const rootData = this.root();
        const normalizedId = loginId.trim().toLowerCase();

        const matchedUser = rootData.users.find(
            user => user.email.toLowerCase() === normalizedId && user.password === password
        );

        if (!matchedUser) {
            return false;
        }

        rootData.session = matchedUser.id;
        this.saveRoot(rootData);
        return true;
    },

    // Register a new user account, initialize empty data, and sign them in
    createUser(name, email, password) {
        const newUserId = this.uid('u');

        this.updateRoot(rootData => {
            rootData.users.push({
                id: newUserId,
                name: name,
                email: email,
                password: password,
                upi: 'Not linked'
            });
            rootData.data[newUserId] = newUserData();
            rootData.session = newUserId;
        });

        return newUserId;
    },

    // Sign out the current user and redirect to the login page
    logout() {
        this.updateRoot(rootData => {
            rootData.session = null;
        });
        location.href = 'login.html';
    },

    // Download the signed-in user's profile and data as a .json file (excludes password)
    exportJson() {
        const currentUser = this.user();
        if (!currentUser) {
            return;
        }

        const exportPayload = {
            exportedAt: new Date().toISOString(),
            profile: {
                name: currentUser.name,
                email: currentUser.email,
                upi: currentUser.upi
            },
            data: this.load()
        };

        const jsonBlob = new Blob([JSON.stringify(exportPayload, null, 2)], {
            type: 'application/json'
        });

        const safeFileName = currentUser.name.toLowerCase().replace(/\W+/g, '-');
        const downloadLink = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(jsonBlob),
            download: `spendwise-${safeFileName}.json`
        });

        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadLink.href);
    }
};

// Format a number as Indian Rupees (e.g. ₹24,800)
const money = (amount) => {
    return '₹' + Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

// Small UI helper for showing temporary toast notifications at the bottom-right
const Ui = {
    toast(message) {
        let toastEl = document.querySelector('.toast');

        if (!toastEl) {
            toastEl = Object.assign(document.createElement('div'), {
                className: 'toast',
                role: 'status'
            });
            document.body.append(toastEl);
        }

        toastEl.textContent = message;
        toastEl.classList.add('show');

        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3200);
    }
};

// Calculate total cash, committed bills, and remaining disposable balance
const totals = (userData) => {
    const committedBills = userData.bills.reduce((sum, bill) => sum + bill.amount, 0);
    return {
        total: userData.cash,
        committed: committedBills,
        disposable: userData.cash - committedBills
    };
};

// Global error listener: show a friendly message instead of failing silently
window.addEventListener('error', () => {
    Ui.toast('Something went wrong. Please refresh the page and try again.');
});

// Show a warning banner at the top if the browser blocks localStorage
window.addEventListener('DOMContentLoaded', () => {
    if (Store.ok) {
        return;
    }

    const warningBanner = Object.assign(document.createElement('div'), {
        className: 'banner',
        role: 'alert',
        textContent: 'Your browser is blocking storage (private mode or cookies off). SpendWise cannot save your data until you allow it.'
    });

    document.body.prepend(warningBanner);
});
