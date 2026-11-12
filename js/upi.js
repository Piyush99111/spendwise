/* ==========================================================================
   upi.js — UPI Payment Link & QR Generator + Bank Statement CSV Importer
   ========================================================================== */

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;

Rules.upi = (value) => {
    return UPI_REGEX.test(value.trim()) ? '' : 'Enter a valid UPI ID like name@bank.';
};

// DOM references for UPI ID & QR generator
const upiIdForm = document.getElementById('lf');
const paymentQrForm = document.getElementById('pf');
const qrOutputBox = document.querySelector('#content #out');
const qrImageContainer = document.getElementById('qr');
const paymentLinkTextEl = document.getElementById('link');
const openInAppLinkEl = document.getElementById('open');
const copyLinkBtn = document.getElementById('copy');
const logPaymentBtn = document.getElementById('log');

let currentPaymentDetails = null;

// Save the user's own UPI ID to their profile
wireForm(
    upiIdForm,
    {
        upi: [Rules.upi]
    },
    (formValues, formEl) => {
        Store.updateRoot(rootData => {
            const signedInUser = rootData.users.find(user => user.id === rootData.session);
            signedInUser.upi = formValues.upi.trim();
        });
        showMsg(formEl, 'UPI ID saved.', 'good');
    }
);

const savedUpiId = Store.user().upi || '';
upiIdForm.elements.upi.value = savedUpiId.includes('@') ? savedUpiId : '';

// Generate a standard upi://pay link and SVG QR code from form inputs
wireForm(
    paymentQrForm,
    {
        pa: [Rules.upi],
        pn: [Rules.required],
        amount: [Rules.amount]
    },
    (formValues) => {
        const queryParams = new URLSearchParams({
            pa: formValues.pa.trim(),
            pn: formValues.pn.trim(),
            am: Number(formValues.amount).toFixed(2),
            cu: 'INR'
        });

        if (formValues.note.trim()) {
            queryParams.set('tn', formValues.note.trim());
        }

        const upiPaymentUrl = 'upi://pay?' + queryParams.toString();

        currentPaymentDetails = {
            name: formValues.pn.trim(),
            amount: Number(formValues.amount)
        };

        // Render SVG QR code using qrcode.js library
        const qrGenerator = qrcode(0, 'M');
        qrGenerator.addData(upiPaymentUrl);
        qrGenerator.make();

        qrImageContainer.innerHTML = qrGenerator.createSvgTag({
            cellSize: 5,
            margin: 0
        });

        paymentLinkTextEl.textContent = upiPaymentUrl;
        openInAppLinkEl.href = upiPaymentUrl;
        qrOutputBox.hidden = false;
        qrOutputBox.style.display = 'flex';
    }
);

// Copy the generated upi://pay link to the clipboard
copyLinkBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(paymentLinkTextEl.textContent);
        Ui.toast('Link copied');
    } catch (error) {
        Ui.toast('Could not copy. Select the link and copy it manually.');
    }
});

// Log the generated UPI payment into the user's transaction ledger
logPaymentBtn.addEventListener('click', () => {
    const userData = Store.load();

    if (currentPaymentDetails.amount > userData.cash) {
        Ui.toast('Not enough balance to log this payment.');
        return;
    }

    Store.update(data => {
        data.cash -= currentPaymentDetails.amount;
        data.transactions.push({
            id: Store.uid('t'),
            merchant: currentPaymentDetails.name,
            category: 'Other',
            amount: currentPaymentDetails.amount,
            type: 'out',
            date: new Date().toISOString().slice(0, 16)
        });
    });

    Ui.toast('Payment logged in Money & UPI');
});

/* ---- Bank Statement CSV Import Section ---- */

const CATS = [
    [/swiggy|zomato|cafe|restaurant|dominos|canteen|food/i, 'Dining & Provisions'],
    [/uber|ola|rapido|metro|irctc|fuel|petrol|bus/i, 'Transportation'],
    [/netflix|spotify|prime|hotstar|youtube|subscription/i, 'Digital Services'],
    [/fee|tuition|book|stationery|course|exam/i, 'Education'],
    [/salary|stipend|pocket|received|refund|cashback/i, 'Income']
];

// Automatically guess transaction category based on description keywords
const categorize = (descriptionText, txType) => {
    if (txType === 'in') {
        return 'Income';
    }
    const matchedRule = CATS.find(([regex]) => regex.test(descriptionText));
    return matchedRule ? matchedRule[1] : 'Other';
};

// Parse CSV text into an array of rows, handling quoted fields that contain commas
function parseCsv(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];

        if (insideQuotes) {
            if (char === '"' && csvText[i + 1] === '"') {
                currentCell += '"';
                i++;
            } else if (char === '"') {
                insideQuotes = false;
            } else {
                currentCell += char;
            }
        } else if (char === '"') {
            insideQuotes = true;
        } else if (char === ',') {
            currentRow.push(currentCell);
            currentCell = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && csvText[i + 1] === '\n') {
                i++;
            }
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }

    if (currentCell || currentRow.length) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    return rows.filter(row => row.some(cell => cell.trim()));
}

// Escape special characters to prevent HTML injection (XSS)
const esc = (str) => {
    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    };
    return String(str).replace(/[&<>"]/g, char => htmlEntities[char]);
};

// DOM references for CSV import
const csvFileInput = document.getElementById('file');
const previewContainer = document.getElementById('prev');
const importConfirmBtn = document.getElementById('go');
const importMsgEl = document.getElementById('imsg');
const sampleCsvBtn = document.getElementById('sample');

let pendingImportTransactions = [];

function showMsgEl(messageText, messageKind) {
    importMsgEl.textContent = messageText;
    importMsgEl.className = 'form-msg show ' + messageKind;
}

// Read, validate, and preview a selected CSV bank statement
csvFileInput.addEventListener('change', () => {
    const selectedFile = csvFileInput.files[0];
    pendingImportTransactions = [];
    previewContainer.innerHTML = '';
    importConfirmBtn.hidden = true;
    importMsgEl.className = 'form-msg';

    if (!selectedFile) {
        return;
    }

    if (!/\.csv$/i.test(selectedFile.name)) {
        showMsgEl('Please choose a .csv file.', 'bad');
        return;
    }

    if (selectedFile.size > 1e6) {
        showMsgEl('That file is over 1 MB. Export a shorter date range.', 'bad');
        return;
    }

    const fileReader = new FileReader();

    fileReader.onerror = () => {
        showMsgEl('Could not read that file.', 'bad');
    };

    fileReader.onload = () => {
        const csvRows = parseCsv(String(fileReader.result));
        const headerColumns = csvRows.shift().map(col => col.trim().toLowerCase());
        const colIndex = (colName) => headerColumns.indexOf(colName);

        const requiredColumns = ['date', 'description', 'amount', 'type'];
        if (requiredColumns.some(colName => colIndex(colName) < 0)) {
            showMsgEl('Header row must be: date, description, amount, type.', 'bad');
            return;
        }

        const invalidRowNumbers = [];
        const existingTxFingerprints = new Set(
            Store.load().transactions.map(tx => tx.date.slice(0, 10) + tx.merchant + tx.amount)
        );

        csvRows.forEach((row, rowIndex) => {
            const dateStr = row[colIndex('date')].trim();
            const description = row[colIndex('description')].trim();
            const amount = Number(row[colIndex('amount')]);
            const rawType = row[colIndex('type')].trim().toLowerCase();

            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr));
            const isValidRow = isValidDate && description && amount > 0 && ['debit', 'credit'].includes(rawType);

            if (!isValidRow) {
                invalidRowNumbers.push(rowIndex + 2);
                return;
            }

            if (existingTxFingerprints.has(dateStr + description + amount)) {
                return;
            }

            const txType = rawType === 'credit' ? 'in' : 'out';

            pendingImportTransactions.push({
                id: Store.uid('t'),
                merchant: description,
                category: categorize(description, txType),
                amount: amount,
                type: txType,
                date: dateStr + 'T12:00'
            });
        });

        // Render preview table of up to 8 transactions to be imported
        if (pendingImportTransactions.length) {
            const headerRowHtml = `
                <div class="row" style="font-weight:600">
                    <span class="grow">Description</span>
                    <span>Category</span>
                    <span style="width:90px;text-align:right">Amount</span>
                </div>
            `;

            const previewRowsHtml = pendingImportTransactions
                .slice(0, 8)
                .map(tx => {
                    const amountClass = tx.type === 'in' ? 'up' : '';
                    const amountSign = tx.type === 'in' ? '+' : '-';
                    return `
                        <div class="row">
                            <span class="grow">${esc(tx.merchant)}</span>
                            <span class="badge c">${esc(tx.category)}</span>
                            <span style="width:90px;text-align:right" class="${amountClass}">${amountSign}${money(tx.amount)}</span>
                        </div>
                    `;
                })
                .join('');

            const extraCountHtml = pendingImportTransactions.length > 8
                ? `<p class="muted" style="font-size:.8rem;margin-top:.4rem">…and ${pendingImportTransactions.length - 8} more</p>`
                : '';

            previewContainer.innerHTML = headerRowHtml + previewRowsHtml + extraCountHtml;
        } else {
            previewContainer.innerHTML = '';
        }

        importConfirmBtn.hidden = !pendingImportTransactions.length;

        const skippedNote = invalidRowNumbers.length
            ? ` Skipped invalid rows: ${invalidRowNumbers.slice(0, 6).join(', ')}${invalidRowNumbers.length > 6 ? '…' : ''}.`
            : '';
        const emptyNote = !pendingImportTransactions.length ? ' Nothing new to import.' : '';

        showMsgEl(
            `${pendingImportTransactions.length} new transaction(s) ready.${skippedNote}${emptyNote}`,
            pendingImportTransactions.length ? 'good' : 'bad'
        );
    };

    fileReader.readAsText(selectedFile);
});

// Save previewed CSV transactions into the user's ledger
importConfirmBtn.addEventListener('click', () => {
    Store.update(userData => {
        pendingImportTransactions.forEach(tx => {
            userData.transactions.push(tx);
            userData.cash += tx.type === 'in' ? tx.amount : -tx.amount;
        });
    });

    Ui.toast(pendingImportTransactions.length + ' transactions imported');
    pendingImportTransactions = [];
    previewContainer.innerHTML = '';
    importConfirmBtn.hidden = true;
    csvFileInput.value = '';
    importMsgEl.className = 'form-msg';
});

// Download a sample CSV file so the user can test statement import immediately
sampleCsvBtn.addEventListener('click', () => {
    const sampleCsvContent = [
        'date,description,amount,type',
        '2026-10-20,Swiggy order,420,debit',
        '2026-10-21,Uber ride,180,debit',
        '2026-10-22,"Netflix, monthly",649,debit',
        '2026-10-23,Pocket money,5000,credit',
        ''
    ].join('\n');

    const csvBlob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const downloadLink = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(csvBlob),
        download: 'sample-statement.csv'
    });

    downloadLink.click();
});
