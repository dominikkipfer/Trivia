const TriviaSolve = {
    load(quizId) { trivia_load_board(quizId); },
    cancel() { cancel_quiz(); },
    submit() { submit_quiz(); }
};

function trivia_load_board(quizId) {
    const quizData = tremola.trivia.active[quizId];
    if (!quizData) {
        console.error("Quiz not found:", quizId);
        return;
    }
    tremola.trivia.current = quizId;

    document.getElementById('solve_quiz_title').innerText = quizData.quiz.title;
    const container = document.getElementById('solve_quiz_container');
    container.innerHTML = ''; // Container leeren

    quizData.quiz.questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question_item';
        let content = `<h3>Question ${index + 1}: ${q.question}</h3>`;

        if (q.type === 'single_choice' || q.type === 'multiple_choice') {
            const inputType = q.type === 'single_choice' ? 'radio' : 'checkbox';
            content += q.answers.map((ans, i) => `
                <div class="form_group">
                    <input type="${inputType}" id="q${index}_ans${i}" name="q_${index}" value="${i}">
                    <label for="q${index}_ans${i}">${ans}</label>
                </div>
            `).join('');
        } else if (q.type === 'open_ended') {
            content += `<div class="form_group"><input type="text" class="form_input" placeholder="Your answer"></div>`;
        }
        questionDiv.innerHTML = content;
        container.appendChild(questionDiv);
    });

    setTriviaScenario('trivia-solve');
}

function cancel_quiz() {
    const quizId = tremola.trivia.current;
    if (!quizId) return;

    const json = {
        type: 'trivia-giveup',
        nm: quizId,
        from: myId
    };
    writeLogEntry(JSON.stringify(json));

    setTriviaScenario('trivia-list');
}

function submit_quiz() {
    const quizId = tremola.trivia.current;
    const quiz = tremola.trivia.active[quizId];
    if (!quiz) return;

    const questions = quiz.quiz.questions;
    const answers = [];

    questions.forEach((q, idx) => {
        let answer = null;

        if (q.type === 'single_choice' || q.type === 'multiple_choice') {
            const inputs = document.querySelectorAll(`input[name="q_${idx}"]:checked`);
            if (q.type === 'single_choice') {
                answer = inputs.length ? parseInt(inputs[0].value) : null;
            } else {
                answer = Array.from(inputs).map(i => parseInt(i.value));
            }
        } else if (q.type === 'open_ended') {
            const input = document.querySelector(`#solve_quiz_container .question_item:nth-child(${idx + 1}) input[type="text"]`);
            answer = input ? input.value.trim() : '';
        }

        answers.push({
            questionIndex: idx,
            answer: answer
        });
    });

    const result = {
        type: 'trivia-result',
        nm: quizId,
        from: myId,
        answers: answers
    };
    writeLogEntry(JSON.stringify(result));

    tremola.trivia.active[quizId].state = 'solved';
    persist();

    setTriviaScenario('trivia-list');
}
