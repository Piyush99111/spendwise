const daysAgo = (n, hm) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const p = x => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${hm}`;
};
const DEMO = {
    transactions: [{
        id: 't1',
        merchant: 'Swiggy Gourmet Delivery',
        category: 'Dining & Provisions',
        amount: 340,
        type: 'out',
        date: daysAgo(1, '14:30')
    }, {
        id: 't2',
        merchant: 'Amazon Prime Subscription',
        category: 'Digital Services',
        amount: 1299,
        type: 'out',
        date: daysAgo(1, '11:15')
    }, {
        id: 't3',
        merchant: 'Metro Transit Line',
        category: 'Transportation',
        amount: 180,
        type: 'out',
        date: daysAgo(2, '09:10')
    }, {
        id: 't5',
        merchant: 'Campus Canteen',
        category: 'Dining & Provisions',
        amount: 260,
        type: 'out',
        date: daysAgo(3, '13:00')
    }, {
        id: 't6',
        merchant: 'Uber Ride',
        category: 'Transportation',
        amount: 420,
        type: 'out',
        date: daysAgo(4, '19:20')
    }, {
        id: 't7',
        merchant: 'Stationery Hub',
        category: 'Education',
        amount: 550,
        type: 'out',
        date: daysAgo(5, '16:00')
    }, {
        id: 't8',
        merchant: 'Cafe Coffee Day',
        category: 'Dining & Provisions',
        amount: 310,
        type: 'out',
        date: daysAgo(6, '17:40')
    }, {
        id: 't4',
        merchant: 'Pocket money (UPI)',
        category: 'Income',
        amount: 35000,
        type: 'in',
        date: daysAgo(28, '10:00')
    }],
    bills: [{
        id: 'b1',
        name: 'Spotify Premium',
        amount: 119,
        due: 'Due Today'
    }, {
        id: 'b2',
        name: 'Netflix 4K Plan',
        amount: 649,
        due: 'Due Tomorrow'
    }, {
        id: 'b3',
        name: 'Apartment Lease',
        amount: 8000,
        due: 'In 5 Days'
    }, {
        id: 'b4',
        name: 'Fitness Membership',
        amount: 1500,
        due: 'Next Week'
    }],
    cash: 24800,
    holdings: [{
        id: 'h1',
        name: 'Reliance Industries Ltd.',
        sym: 'RELIANCE',
        kind: 'Equities',
        value: 32400,
        change: 1.2
    }, {
        id: 'h2',
        name: 'Sovereign Digital Gold',
        sym: '24K 99.9%',
        kind: 'Gold',
        value: 36300,
        change: 0.8
    }, {
        id: 'h3',
        name: 'SBI Bluechip Largecap Fund',
        sym: 'Direct Growth',
        kind: 'Mutual Funds',
        value: 29000,
        change: -0.3
    }, {
        id: 'h4',
        name: 'HDFC Bank Ltd.',
        sym: 'HDFCBANK',
        kind: 'Equities',
        value: 18500,
        change: 2.1
    }],
    sandboxCash: 20000,
    sandboxStart: 136200,
    modules: [{
        id: 'm1',
        title: 'Principles of Budgeting & Cash Flow',
        cat: 'Tax Laws',
        lessons: 5,
        done: 5,
        xp: 50,
        needs: null
    }, {
        id: 'm2',
        title: 'Income Streams vs Fixed Liabilities',
        cat: 'Tax Laws',
        lessons: 4,
        done: 4,
        xp: 50,
        needs: null
    }, {
        id: 'm3',
        title: 'Introduction to Indian Taxation & Regimes',
        cat: 'Tax Laws',
        lessons: 5,
        done: 2,
        xp: 100,
        needs: 'm2'
    }, {
        id: 'm4',
        title: 'Advanced Tax Filing for Independent Professionals',
        cat: 'Tax Laws',
        lessons: 6,
        done: 0,
        xp: 100,
        needs: 'm3'
    }, {
        id: 'm5',
        title: 'Reading an Index: Nifty 50 Basics',
        cat: 'Equities & Indices',
        lessons: 4,
        done: 0,
        xp: 80,
        needs: 'm2'
    }],
    xp: 320,
    streak: 4,
    goals: {
        weeklyCap: 5600,
        saveName: 'Goa trip',
        saveTarget: 15000,
        saved: 3000
    }
};

/* A brand-new account starts empty, with ₹1,00,000 of virtual sandbox credit and four tradable assets at ₹0. */
const newUserData = () => ({
    transactions: [],
    bills: [],
    cash: 0,
    holdings: DEMO.holdings.map(h => ({
        ...h,
        value: 0,
        change: 0
    })),
    sandboxCash: 100000,
    sandboxStart: 100000,
    modules: DEMO.modules.map(m => ({
        ...m,
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

/* Data shape: { users: [...], session: userId|null, data: { [userId]: that user's own data } } */
const Store = {
    KEY: 'spendwise.db.v2',
    ok: (() => {
        try {
            localStorage.setItem('_t', '1');
            localStorage.removeItem('_t');
            return true;
        } catch (e) {
            return false;
        }
    })(),
    root() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            /* corrupted or blocked: fall back to seed */ }
        const fresh = {
            users: [{
                id: 'u1',
                name: 'Tanvi Bansal',
                email: 'tanvi.bansal@paytm',
                password: 'Spend@123',
                upi: 'SBI UPI Node • 4521'
            }],
            session: null,
            data: {
                u1: structuredClone(DEMO)
            }
        };
        this.saveRoot(fresh);
        return fresh;
    },
    saveRoot(r) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(r));
        } catch (e) {
            Ui.toast('Could not save your changes. Browser storage is full or blocked.');
        }
    },
    updateRoot(fn) {
        const r = this.root();
        fn(r);
        this.saveRoot(r);
        return r;
    },
    /* load/save/update work on the signed-in user's own data only */
    load() {
        const r = this.root();
        return r.data[r.session] || null;
    },
    save(d) {
        this.updateRoot(r => {
            r.data[r.session] = d;
        });
    },
    update(fn) {
        const r = this.root();
        fn(r.data[r.session]);
        this.saveRoot(r);
        return r.data[r.session];
    },
    uid: (p) => p + Math.random().toString(36).slice(2, 8),
    reset() {
        localStorage.removeItem(this.KEY);
    },
    user() {
        const r = this.root();
        return r.users.find(u => u.id === r.session) || null;
    },
    login(id, password) {
        const r = this.root();
        const key = id.trim().toLowerCase();
        const u = r.users.find(x => x.email.toLowerCase() === key && x.password === password);
        if (!u) return false;
        r.session = u.id;
        this.saveRoot(r);
        return true;
    },
    createUser(name, email, password) {
        const id = this.uid('u');
        this.updateRoot(r => {
            r.users.push({
                id,
                name,
                email,
                password,
                upi: 'Not linked'
            });
            r.data[id] = newUserData();
            r.session = id;
        });
        return id;
    },
    logout() {
        this.updateRoot(r => {
            r.session = null;
        });
        location.href = 'login.html';
    },
    /* Downloads the signed-in user's profile + data as a .json file (never includes the password). */
    exportJson() {
        const u = this.user();
        if (!u) return;
        const out = {
            exportedAt: new Date().toISOString(),
            profile: {
                name: u.name,
                email: u.email,
                upi: u.upi
            },
            data: this.load()
        };
        const blob = new Blob([JSON.stringify(out, null, 2)], {
            type: 'application/json'
        });
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(blob),
            download: 'spendwise-' + u.name.toLowerCase().replace(/\W+/g, '-') + '.json'
        });
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }
};

const money = (n) => '₹' + Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});
const Ui = {
    toast(msg) {
        let t = document.querySelector('.toast');
        if (!t) {
            t = Object.assign(document.createElement('div'), {
                className: 'toast',
                role: 'status'
            });
            document.body.append(t);
        }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(this._t);
        this._t = setTimeout(() => t.classList.remove('show'), 3200);
    }
};
const totals = (db) => {
    const committed = db.bills.reduce((a, b) => a + b.amount, 0);
    return {
        total: db.cash,
        committed,
        disposable: db.cash - committed
    };
};

/* Friendly error handling: tell the user instead of failing silently. */
window.addEventListener('error', () => Ui.toast(
    'Something went wrong. Please refresh the page and try again.'));
window.addEventListener('DOMContentLoaded', () => {
    if (Store.ok) return;
    const b = Object.assign(document.createElement('div'), {
        className: 'banner',
        role: 'alert',
        textContent: 'Your browser is blocking storage (private mode or cookies off). SpendWise cannot save your data until you allow it.'
    });
    document.body.prepend(b);
});
