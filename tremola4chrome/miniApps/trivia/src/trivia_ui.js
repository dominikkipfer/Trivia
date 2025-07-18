let TriviaScenario = null;
let animationInProgress = false;
let currentAnimationTimeout = null;

const TriviaUi = {
    onBackPressed() {
        if (TriviaScenario === 'trivia-create' || TriviaScenario === 'trivia-solve') {
            setTriviaScenario('trivia-list');
        } else if (TriviaScenario === 'trivia-contacts') {
            setTriviaScenario(tremola.trivia.previousScenario || 'trivia-create');
        } else if (TriviaScenario === 'trivia-list') {
            quitApp();
        }
    },
    refresh() {
        TriviaUi.renderLists();
    },
    renderLists() {
        if (!tremola.trivia) tremola.trivia = { active: {}, closed: {} };

        const todo = Object.values(tremola.trivia.active).filter(q => q.state !== 'solved');
        const own  = Object.values(tremola.trivia.active).filter(q => q.isOwn);

        const render = (arr, html) => html.length ? html.join('') :
            '<p style="text-align:center;color:#666;">Nothing here.</p>';

        document.getElementById('trivia_solving_list').innerHTML = render(todo,
            todo.map(q =>
                `<button class='trivia_list_button' style='width:90%;' onclick="TriviaSolve.load('${q.nm}')">
                    Quiz: ${q.quiz.title || 'No Title'}<br><font size=-1>from ${fid2display(q.from)}</font>
                </button>`));

        document.getElementById('trivia_created_quizzes').innerHTML = render(own,
            own.map(q => `<div class='chat_item_div'>Quiz: ${q.quiz.title || 'No Title'}</div>`));
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
            (s === 'trivia-contacts' && prevScenario === 'trivia-create')) {
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
            (s === 'trivia-create' && prevScenario === 'trivia-contacts')) {
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

document.querySelectorAll('.spotlight').forEach(btn => {
    btn.onmousemove = e => {
        btn.style.setProperty('--x', (e.pageX - btn.offsetLeft) + 'px');
        btn.style.setProperty('--y', (e.pageY - btn.offsetTop) + 'px');
    };
});
