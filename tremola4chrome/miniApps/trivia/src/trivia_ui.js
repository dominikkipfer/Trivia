let TriviaScenario = null;

const TriviaUi = {
    onBackPressed() {
        if (TriviaScenario === 'trivia-create' || TriviaScenario === 'trivia-solve') {
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
    TriviaScenario = s;
    scenarioDisplay[s].forEach(id => document.getElementById(id).style.display = null);
    display_or_not.forEach(id => {
        if (!scenarioDisplay[s].includes(id)) document.getElementById(id).style.display = 'none';
    });
    if (s === 'trivia-list') {
        document.getElementById("tremolaTitle").style.display = 'none';
        const c = document.getElementById("conversationTitle");
        c.style.display = null;
        c.innerHTML = "<strong>Trivia</strong><br>Pick or create a new quiz";
        TriviaUi.refresh();
    }
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

document.querySelectorAll('.spotlight').forEach(btn => {
    btn.onmousemove = e => {
        btn.style.setProperty('--x', (e.pageX - btn.offsetLeft) + 'px');
        btn.style.setProperty('--y', (e.pageY - btn.offsetTop) + 'px');
    };
});
