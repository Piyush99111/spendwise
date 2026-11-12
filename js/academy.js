/* ==========================================================================
   academy.js — Learning Modules, Quizzes, XP Progression & Lesson Videos
   ========================================================================== */

let activeCategoryFilter = 'All';
const CATS = ['All', 'Tax Laws', 'Equities & Indices'];

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

// Quiz bank: 3 multiple-choice questions per module [questionText, optionsArray, correctOptionIndex]
const QUIZ = {
    m1: [
        [
            'What does "cash flow" mean?',
            ['Money moving in and out over a period', 'Only your savings balance', 'Interest paid by a bank'],
            0
        ],
        [
            'In the 50/30/20 rule, what does the 20 stand for?',
            ['Wants', 'Savings and investing', 'Rent'],
            1
        ],
        [
            'Which of these is a fixed expense?',
            ['Monthly rent', 'Eating out', 'Movie tickets'],
            0
        ]
    ],
    m2: [
        [
            'Which is a fixed liability?',
            ['A loan EMI', 'A birthday gift', 'A snack'],
            0
        ],
        [
            'Disposable capital is best described as…',
            ['Money left after committed payments', 'Your total salary', 'Your investments'],
            0
        ],
        [
            'Which is an income stream for a student?',
            ['A part-time stipend', 'A phone bill', 'A library fine'],
            0
        ]
    ],
    m3: [
        [
            "India's financial year runs…",
            ['1 April to 31 March', '1 January to 31 December', '1 July to 30 June'],
            0
        ],
        [
            'PAN stands for…',
            ['Permanent Account Number', 'Personal Asset Name', 'Public Amount Note'],
            0
        ],
        [
            'TDS stands for…',
            ['Tax Deducted at Source', 'Total Deposit Slip', 'Tax Due Statement'],
            0
        ]
    ],
    m4: [
        [
            'ITR stands for…',
            ['Income Tax Return', 'Interest Transfer Receipt', 'Investment Tax Rate'],
            0
        ],
        [
            'Form 16 is…',
            ['A TDS certificate on salary from an employer', 'A bank loan form', 'A passport form'],
            0
        ],
        [
            'Income tax returns are filed on…',
            ['The income tax e-filing portal', 'A stock exchange app', 'A bank ATM'],
            0
        ]
    ],
    m5: [
        [
            'The Nifty 50 tracks…',
            ['50 large companies listed on the NSE', '50 government bonds', '50 gold funds'],
            0
        ],
        [
            'NSE stands for…',
            ['National Stock Exchange', 'National Savings Exchange', 'Net Share Estimate'],
            0
        ],
        [
            'An index fund aims to…',
            ['Mirror an index such as the Nifty 50', 'Beat every other fund every year', 'Guarantee returns'],
            0
        ]
    ]
};

// Extract the 11-character YouTube video ID from standard watch, short, or embed URLs
const ytId = (url) => {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
    );
    return (match || [])[1];
};

Rules.youtube = (value) => {
    return ytId(value.trim()) ? '' : 'Paste a YouTube link (watch, youtu.be, embed or shorts).';
};

// Helpers to check if a module is completed or unlocked
const full = (moduleItem) => moduleItem.done >= moduleItem.lessons;
const unlocked = (userData, moduleItem) => {
    if (!moduleItem.needs) {
        return true;
    }
    const prereqModule = userData.modules.find(item => item.id === moduleItem.needs);
    return full(prereqModule);
};

// DOM references
const categoryTabsEl = document.getElementById('tabs');
const modulesListEl = document.getElementById('mods');
const xpTextEl = document.getElementById('xp');
const xpBarEl = document.getElementById('xpb');
const levelTextEl = document.getElementById('lvl');
const badgesListEl = document.getElementById('badges');
const videoModuleSelect = document.getElementById('vm');
const videoForm = document.getElementById('vf');
const searchInput = document.getElementById('q');

// Quiz modal DOM references
const quizDialog = document.getElementById('qd');
const quizForm = document.getElementById('qf');
const quizTitleEl = document.getElementById('qt');
const quizBodyEl = document.getElementById('qb');
const quizMsgEl = document.getElementById('qm');
const quizSubmitBtn = document.getElementById('qs');
const quizCloseBtn = document.getElementById('qx');

// Render curriculum modules, XP progress, achievement badges, and video form options
function render() {
    const userData = Store.load();
    const searchQuery = searchInput.value.trim().toLowerCase();
    const quizScores = userData.quizzes || {};

    // 1. Render category filter tabs
    categoryTabsEl.innerHTML = CATS
        .map(categoryName => {
            const isSelected = categoryName === activeCategoryFilter;
            const safeLabel = categoryName.replace('&', '&amp;');
            return `<button class="tab" aria-pressed="${isSelected}" data-c="${categoryName}">${safeLabel}</button>`;
        })
        .join('');

    // 2. Filter and render module cards
    const matchingModules = userData.modules.filter(moduleItem => {
        const matchesCategory = activeCategoryFilter === 'All' || moduleItem.cat === activeCategoryFilter;
        const matchesSearch = moduleItem.title.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (matchingModules.length) {
        modulesListEl.innerHTML = matchingModules
            .map(moduleItem => {
                const progressPct = Math.round((moduleItem.done / moduleItem.lessons) * 100);
                const prereqModule = userData.modules.find(item => item.id === moduleItem.needs);
                const isUnlocked = unlocked(userData, moduleItem);
                const isCompleted = full(moduleItem);
                const moduleVideos = moduleItem.videos || [];

                // Determine action button or status badge
                let actionHtml = '';
                if (isCompleted) {
                    actionHtml = '<span class="badge g">Completed</span>';
                } else if (isUnlocked) {
                    const btnLabel = moduleItem.done ? 'Resume' : 'Start';
                    actionHtml = `<button class="btn sm" data-l="${moduleItem.id}">${btnLabel}</button>`;
                } else {
                    actionHtml = '<span class="badge r">Locked</span>';
                }

                // Determine subtitle status text
                let statusNote = '';
                if (isCompleted) {
                    statusNote = `Module completed · +${moduleItem.xp} XP earned`;
                } else if (isUnlocked) {
                    statusNote = `${moduleItem.done} of ${moduleItem.lessons} lessons · +${moduleItem.xp} XP`;
                } else {
                    statusNote = `Finish “${esc(prereqModule.title)}” to unlock`;
                }

                // Determine quiz button (shown for unlocked modules)
                const hasTakenQuiz = quizScores[moduleItem.id] !== undefined;
                const quizBtnLabel = hasTakenQuiz ? `Quiz ${quizScores[moduleItem.id]}/3` : 'Take quiz';
                const quizBtnHtml = isUnlocked
                    ? `<button class="btn ghost sm" data-q="${moduleItem.id}">${quizBtnLabel}</button>`
                    : '';

                // Build collapsible attached lesson videos section if any exist
                let videosHtml = '';
                if (moduleVideos.length) {
                    const countLabel = `${moduleVideos.length} video${moduleVideos.length > 1 ? 's' : ''}`;
                    const videoItemsHtml = moduleVideos
                        .map((video, index) => `
                            <div style="margin:.6rem 0">
                                <p style="font-size:.82rem;font-weight:600">
                                    ${esc(video.title)}
                                    <button class="btn ghost sm" data-rv="${moduleItem.id}:${index}" aria-label="Remove ${esc(video.title)}">Remove</button>
                                </p>
                                <iframe
                                    title="${esc(video.title)}"
                                    src="https://www.youtube-nocookie.com/embed/${video.id}"
                                    loading="lazy"
                                    allowfullscreen
                                    style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px;margin-top:.3rem">
                                </iframe>
                            </div>
                        `)
                        .join('');

                    videosHtml = `
                        <details style="margin-top:.5rem">
                            <summary style="cursor:pointer;font-size:.82rem;font-weight:600">${countLabel}</summary>
                            ${videoItemsHtml}
                        </details>
                    `;
                }

                const statusIcon = isCompleted ? '✓' : (isUnlocked ? progressPct + '%' : '🔒');

                return `
                    <div class="row" style="align-items:flex-start">
                        <span class="ic">${statusIcon}</span>
                        <div class="grow">
                            <b>${esc(moduleItem.title)}</b>
                            <span>${statusNote}</span>
                            <div class="bar" style="margin-top:.4rem"><i style="width:${progressPct}%"></i></div>
                            ${videosHtml}
                        </div>
                        <div style="display:grid;gap:.4rem;justify-items:end">
                            ${actionHtml}
                            ${quizBtnHtml}
                        </div>
                    </div>
                `;
            })
            .join('');
    } else {
        modulesListEl.innerHTML = '<p class="empty">No modules match your search.</p>';
    }

    // 3. Update XP bar and scholar level (every 250 XP is 1 level)
    const currentLevel = Math.floor(userData.xp / 250) + 1;
    const nextLevelXp = 250 * currentLevel;

    xpTextEl.textContent = `${userData.xp} / ${nextLevelXp} XP`;
    xpBarEl.style.width = ((userData.xp % 250) / 250) * 100 + '%';
    levelTextEl.textContent = `Level ${currentLevel} scholar · ${userData.streak}-day streak`;

    // 4. Compute and render achievement badges
    const completedModulesCount = userData.modules.filter(full).length;
    const passedQuizzesCount = Object.values(quizScores).filter(score => score >= 2).length;
    const taxModule = userData.modules.find(moduleItem => moduleItem.id === 'm4');

    const badgeDefinitions = [
        ['Foundations', completedModulesCount >= 1],
        ['Budget Pro', completedModulesCount >= 2],
        ['3-day streak', userData.streak >= 3],
        ['Quiz taker', passedQuizzesCount >= 1],
        ['Tax ready', taxModule.done >= 6]
    ];

    badgesListEl.innerHTML = badgeDefinitions
        .map(([badgeName, isEarned]) => `
            <div class="row">
                <span class="ic">${isEarned ? '★' : '·'}</span>
                <div class="grow"><b>${badgeName}</b></div>
                <span class="badge ${isEarned ? 'g' : ''}">${isEarned ? 'Earned' : 'Not yet'}</span>
            </div>
        `)
        .join('');

    // 5. Populate module dropdown in "Add a lesson video" form
    const previousSelectedModule = videoModuleSelect.value;
    videoModuleSelect.innerHTML = userData.modules
        .map(moduleItem => `<option value="${moduleItem.id}">${esc(moduleItem.title)}</option>`)
        .join('');

    if (previousSelectedModule) {
        videoModuleSelect.value = previousSelectedModule;
    }
}

/* ---- Module Quiz Modal Logic ---- */

let activeQuizModuleId = null;

// Build and open the 3-question quiz dialog for a module
function openQuiz(moduleId) {
    activeQuizModuleId = moduleId;
    const targetModule = Store.load().modules.find(item => item.id === moduleId);

    quizTitleEl.textContent = 'Quiz: ' + targetModule.title;
    quizMsgEl.className = 'form-msg';
    quizSubmitBtn.hidden = false;

    quizBodyEl.innerHTML = QUIZ[moduleId]
        .map(([questionText, options, _correctIdx], qIndex) => {
            const optionsHtml = options
                .map((optionText, optIndex) => `
                    <label style="display:block;padding:.3rem 0">
                        <input type="radio" name="q${qIndex}" value="${optIndex}">
                        ${esc(optionText)}
                    </label>
                `)
                .join('');

            return `
                <fieldset style="border:0;margin:0 0 1rem;padding:0">
                    <legend style="font-weight:600;margin-bottom:.4rem">${qIndex + 1}. ${esc(questionText)}</legend>
                    ${optionsHtml}
                </fieldset>
            `;
        })
        .join('');

    quizDialog.showModal();
}

// Grade the quiz when "Submit answers" is clicked
quizSubmitBtn.addEventListener('click', () => {
    const questions = QUIZ[activeQuizModuleId];
    const selectedInputs = questions.map(
        (_, qIndex) => quizForm.querySelector(`input[name=q${qIndex}]:checked`)
    );

    if (selectedInputs.some(input => !input)) {
        quizMsgEl.textContent = 'Answer every question before submitting.';
        quizMsgEl.className = 'form-msg show bad';
        return;
    }

    const correctCount = selectedInputs.filter(
        (input, qIndex) => Number(input.value) === questions[qIndex][2]
    ).length;

    const existingQuizzes = Store.load().quizzes || {};
    const isFirstAttempt = existingQuizzes[activeQuizModuleId] === undefined;
    const hasPassed = correctCount >= 2;

    Store.update(userData => {
        userData.quizzes = userData.quizzes || {};
        userData.quizzes[activeQuizModuleId] = Math.max(
            correctCount,
            userData.quizzes[activeQuizModuleId] || 0
        );
        if (isFirstAttempt && hasPassed) {
            userData.xp += 20;
        }
    });

    const passStatusText = hasPassed
        ? (isFirstAttempt ? ' Passed! +20 XP.' : ' Passed.')
        : ' You need 2 to pass. Try again.';

    const answerKeySummary = questions
        .map((question, qIndex) => `${qIndex + 1}) ${question[1][question[2]]}`)
        .join('; ');

    quizMsgEl.textContent =
        `You scored ${correctCount}/3.${passStatusText} Correct answers: ${answerKeySummary}`;
    quizMsgEl.className = 'form-msg show ' + (hasPassed ? 'good' : 'bad');

    render();
});

quizCloseBtn.addEventListener('click', () => {
    quizDialog.close();
});

// Event delegation for category tabs, lesson progress, opening quizzes, and removing videos
document.addEventListener('click', (event) => {
    const categoryBtn = event.target.closest('[data-c]');
    const lessonBtn = event.target.closest('[data-l]');
    const quizBtn = event.target.closest('[data-q]');
    const removeVideoBtn = event.target.closest('[data-rv]');

    if (categoryBtn) {
        activeCategoryFilter = categoryBtn.dataset.c;
        render();
    }

    if (quizBtn) {
        openQuiz(quizBtn.dataset.q);
    }

    if (removeVideoBtn) {
        const [moduleId, videoIndex] = removeVideoBtn.dataset.rv.split(':');
        Store.update(userData => {
            const targetModule = userData.modules.find(item => item.id === moduleId);
            targetModule.videos.splice(Number(videoIndex), 1);
        });
        Ui.toast('Video removed');
        render();
    }

    if (lessonBtn) {
        Store.update(userData => {
            const targetModule = userData.modules.find(item => item.id === lessonBtn.dataset.l);
            targetModule.done++;

            if (targetModule.done === targetModule.lessons) {
                userData.xp += targetModule.xp;
                Ui.toast(`Module complete! +${targetModule.xp} XP`);
            } else {
                Ui.toast('Lesson complete');
            }
        });
        render();
    }
});

// Re-render when typing in the top search bar
searchInput.addEventListener('input', render);

// Handle adding a new YouTube lesson video to a module
wireForm(
    videoForm,
    {
        title: [Rules.required],
        url: [Rules.youtube]
    },
    (formValues, formEl) => {
        Store.update(userData => {
            const targetModule = userData.modules.find(item => item.id === formValues.module);
            targetModule.videos = targetModule.videos || [];
            targetModule.videos.push({
                title: formValues.title.trim(),
                id: ytId(formValues.url.trim())
            });
        });

        formEl.reset();
        Ui.toast('Video added');
        render();
    }
);

render();
