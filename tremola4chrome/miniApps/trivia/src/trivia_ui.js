let TriviaScenario = null;
let animationInProgress = false;

const TriviaUi = {
    onBackPressed() {
        if (TriviaScenario === 'trivia-create' || TriviaScenario === 'trivia-solve') {
            setTriviaScenario('trivia-list');
        } else if (TriviaScenario === 'trivia-contacts') {
            setTriviaScenario(tremola.trivia.previousScenario || 'trivia-create');
        } else if (TriviaScenario === 'trivia-results' && tremola.trivia.previousScenario === 'trivia-quiz-info') {
            setTriviaScenario(tremola.trivia.previousScenario || 'trivia-list');
        } else if (TriviaScenario === 'trivia-results' && tremola.trivia.previousScenario === 'trivia-solve') {
            setTriviaScenario('trivia-list');
        } else if (TriviaScenario === 'trivia-list') {
            quitApp();
        }
    },
    refresh() {
        TriviaUi.renderLists();
    },
    renderLists() {
        if (!tremola.trivia) tremola.trivia = { active: {}, closed: {} };

        const allSolvable = Object.values(tremola.trivia.active).filter(q =>
            (!q.isOwn || q.selfSent)
        );

        const todoNew = allSolvable.filter(q => q.state !== 'solved');
        const todoSolved = allSolvable.filter(q => q.state === 'solved');
        const own = Object.values(tremola.trivia.active).filter(q => q.isOwn);

        const formatDate = (dateString) => {
            if (!dateString) return 'Unbekanntes Datum';
            const date = new Date(dateString);
            return date.toLocaleDateString('de-CH', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        const renderSection = (arr, header, isCreated = false) => {
            if (arr.length === 0) return '';

            return `
                <div class="quiz_section">
                    <h3 class="section_header">${header}</h3>
                    ${arr.map(q => {
                    const questions = q.quiz.questions || [];
                    const createdDate = formatDate(q.quiz.created);
    
                    return `<button class="trivia_button trivia_list_button spotlight" onclick="${isCreated ? 'trivia_load_board' : 'TriviaSolve.load'}('${q.nm}')">
                            <div class="quiz_item">
                                <div class="quiz_title">${q.quiz.title || 'No Title'}</div>
                                <div class="quiz_questions">
                                    <span>${questions.length} Question${questions.length > 1 ? 's' : ''}</span>
                                </div>
                                <div class="quiz_info">
                                    ${!isCreated ? `
                                    <div class="author_info">
                                        <img src="../miniApps/trivia/assets/author.svg" class="list_icon" alt="Author:" />
                                        <span>${fid2display(q.from)}</span>
                                    </div>` : ''}
                                    <div class="date_info">
                                        <span>${createdDate}</span>
                                        <img src="../miniApps/trivia/assets/date.svg" class="list_icon" alt="Date:" />
                                    </div>
                                </div>
                            </div>
                        </button>`;
                }).join('')}
                </div>
            `;
        };

        document.getElementById('trivia_solving_list').innerHTML =
            (todoNew.length === 0 && todoSolved.length === 0)
                ? '<p style="text-align:center;color:#666;">No quizzes to solve.</p>'
                : renderSection(todoNew, 'New Quizzes') +
                renderSection(todoSolved, 'Solved Quizzes');

        document.getElementById('trivia_created_quizzes').innerHTML =
            own.length === 0
                ? '<p style="text-align:center;color:#666;">No quizzes created.</p>'
                : renderSection(own, 'Your Quizzes', true);
    }
};

function setTriviaScenario(s) {
    const prevScenario = TriviaScenario;
    TriviaScenario = s;

    if (animationInProgress) {
        return;
    }

    if (s !== prevScenario) {
        if ((s !== 'trivia-list' && prevScenario === 'trivia-list') ||
            (s === 'trivia-contacts' && prevScenario === 'trivia-create') ||
            (s === 'trivia-results' && prevScenario === 'trivia-solve') ||
            (s === 'trivia-quiz-info' && prevScenario === 'trivia-list') ||
            (s === 'trivia-results' && prevScenario === 'trivia-quiz-info')) {
            animationInProgress = true;
            const newElement = document.getElementById(`div:${s}`);
            const oldElement = document.getElementById(`div:${prevScenario}`);

            oldElement.style.clipPath = 'inset(0 0 0 0)';
            oldElement.style.opacity = '1';
            newElement.style.transform = 'translateY(calc(100% - 70px))';
            newElement.style.display = 'block';

            void oldElement.offsetHeight;
            void newElement.offsetHeight;

            oldElement.style.transition = 'clip-path 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
            newElement.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';

            void oldElement.offsetHeight;
            void newElement.offsetHeight;

            oldElement.style.clipPath = 'inset(0 0 calc(100% - 70px) 0)';
            newElement.style.transform = 'translateY(0)';

            setTimeout(() => {
                oldElement.style.display = 'none';
                oldElement.style.clipPath = '';
                oldElement.style.transition = '';
                newElement.style.transform = '';
                newElement.style.transition = '';
                animationInProgress = false;
            }, 500);
        } else if (s === 'trivia-list' && prevScenario && prevScenario !== 'trivia-list' ||
            (s === 'trivia-create' && prevScenario === 'trivia-contacts') ||
            (s === 'trivia-solve' && prevScenario === 'trivia-results') ||
            (s === 'trivia-quiz-info' && prevScenario === 'trivia-results')) {
            animationInProgress = true;
            const oldElement = document.getElementById(`div:${prevScenario}`);
            const newElement = document.getElementById(`div:${s}`);

            newElement.style.display = 'block';
            newElement.style.clipPath = 'inset(0 0 calc(100% - 70px) 0)';
            newElement.style.opacity = '1';

            void oldElement.offsetHeight;
            void newElement.offsetHeight;

            oldElement.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
            newElement.style.transition = 'clip-path 0.5s cubic-bezier(0.25, 1, 0.5, 1)';

            void oldElement.offsetHeight;
            void newElement.offsetHeight;

            oldElement.style.transform = 'translateY(calc(100% - 70px))';
            newElement.style.clipPath = 'inset(0 0 0 0)';

            setTimeout(() => {
                oldElement.style.display = 'none';
                oldElement.style.transform = '';
                oldElement.style.transition = '';
                newElement.style.clipPath = '';
                newElement.style.transition = '';
                animationInProgress = false;
            }, 500);
        } else {
            showScenario(s);
        }
    } else {
        showScenario(s);
    }

    if (s === 'trivia-list') {
        document.getElementById("tremolaTitle").style.display = 'none';
        const c = document.getElementById("conversationTitle");
        c.style.display = null;
        c.innerHTML = "<strong>Trivia</strong><br>Pick or create a new quiz";
        TriviaUi.refresh();
    }
}

function showScenario(s) {
    scenarioDisplay[s].forEach(id => document.getElementById(id).style.display = null);
    display_or_not.forEach(id => {
        if (!scenarioDisplay[s].includes(id)) document.getElementById(id).style.display = 'none';
    });
}

function showTriviaTab(tab) {
    document.getElementById('trivia_solving_list').style.display = (tab === 'solvable') ? '' : 'none';
    document.getElementById('trivia_created_list').style.display = (tab === 'created') ? '' : 'none';
    document.getElementById('trivia_leaderboard_list').style.display = (tab === 'leaderboard') ? '' : 'none';

    document.getElementById('tab_solving').classList.toggle('trivia_tab_active', tab === 'solvable');
    document.getElementById('tab_create').classList.toggle('trivia_tab_active', tab === 'created');
    document.getElementById('tab_leaderboard').classList.toggle('trivia_tab_active', tab === 'leaderboard');

    document.getElementById('trivia_created_list').classList.toggle('active', tab === 'created');
}

function attachDragAndDropListeners(container, itemSelector, afterDropCallback) {
    container.addEventListener('dragstart', function(e) {
        const item = e.target.closest(itemSelector);
        if (item) {
            e.dataTransfer.setData('text/plain', item.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => item.classList.add('dragging'), 0);
        }
    });

    container.addEventListener('dragend', function(e) {
        const item = e.target.closest(itemSelector);
        if (item) {
            item.classList.remove('dragging');
        }
    });

    container.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const target = e.target.closest(itemSelector);
        if (target) {
            const rect = target.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            target.classList.remove('drop-above', 'drop-below');
            target.classList.add(e.clientY < midY ? 'drop-above' : 'drop-below');
        }
    });

    container.addEventListener('dragleave', function(e) {
        const target = e.target.closest(itemSelector);
        if (target) {
            target.classList.remove('drop-above', 'drop-below');
        }
    });

    container.addEventListener('drop', function(e) {
        e.preventDefault();

        const items = container.querySelectorAll(itemSelector);
        items.forEach(item => item.classList.remove('drop-above', 'drop-below'));

        const draggedIndex = e.dataTransfer.getData('text/plain');
        const target = e.target.closest(itemSelector);

        if (target && target.dataset.index !== draggedIndex) {
            const draggedElement = container.querySelector(`${itemSelector}[data-index="${draggedIndex}"]`);
            if (draggedElement && target) {
                container.insertBefore(draggedElement, target);

                if (typeof afterDropCallback === 'function') {
                    afterDropCallback(container);
                }
            }
        }
    });
}

const spotlightElements = new Set();

const handleMouseMove = (e) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    element.style.setProperty('--x', `${x}px`);
    element.style.setProperty('--y', `${y}px`);
};

const attachEventListener = (element) => {
    if (!spotlightElements.has(element)) {
        element.addEventListener('mousemove', handleMouseMove);
        spotlightElements.add(element);
    }
};

const currentSpotlightElements = Array.from(document.getElementsByClassName('spotlight'));
currentSpotlightElements.forEach(attachEventListener);

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('spotlight')) {
                        attachEventListener(node);
                    }
                    const descendants = node.querySelectorAll('.spotlight');
                    descendants.forEach(attachEventListener);
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
