const TriviaResults = {
    show(quiz, results, participantId) {
        displayResults(quiz, results, participantId);
    }
};

function closeResults() {
    if (tremola.trivia.previousScenario && tremola.trivia.previousScenario === 'trivia-quiz-info') {
        setTriviaScenario('trivia-quiz-info');
    } else {
        setTriviaScenario('trivia-list');
    }
}

function displayResults(quiz, results, participantId) {
    setTriviaScenario('trivia-results');
    document.getElementById('results_title').textContent = `Quiz Results: ${quiz.quiz.title}`;
    const solverName = fid2display(participantId);
    document.getElementById('results_subtitle').textContent = `solved from: ${solverName}`;
    const container = document.getElementById('results_quiz_container');
    container.innerHTML = '';

    results.forEach((result, index) => {
        const questionResult = document.createElement('div');
        questionResult.className = 'question_item';

        const questionTitle = document.createElement('h3');
        questionTitle.textContent = `Question ${index + 1}: ${quiz.quiz.questions[index].question}`;
        questionResult.appendChild(questionTitle);

        const userAnswerDiv = document.createElement('div');
        userAnswerDiv.textContent = `Your answer: ${formatAnswer(result.userAnswer, quiz.quiz.questions[index].type, quiz.quiz.questions[index].answers)}`;
        questionResult.appendChild(userAnswerDiv);

        const correctAnswerDiv = document.createElement('div');
        correctAnswerDiv.textContent = `Correct answer: ${formatCorrectAnswer(result.correctAnswer, quiz.quiz.questions[index].type, quiz.quiz.questions[index].answers)}`;
        questionResult.appendChild(correctAnswerDiv);

        const statusDiv = document.createElement('div');
        statusDiv.textContent = result.isCorrect ? 'Correct' : 'Incorrect';
        statusDiv.className = result.isCorrect ? 'correct' : 'incorrect';
        questionResult.appendChild(statusDiv);

        container.appendChild(questionResult);
    });
}

function formatAnswer(answer, type, answers) {
    if (type === 'single_choice') {
        return answers && answer !== null ? answers[answer] : 'No answer provided';
    } else if (type === 'multiple_choice') {
        return answers && answer ? answer.map(a => answers[a]).join(', ') : 'No answer provided';
    } else if (type === 'open_ended') {
        return answer || 'No answer provided';
    }
}

function formatCorrectAnswer(correctAnswer, type, answers) {
    if (type === 'single_choice') {
        return answers[correctAnswer.correct];
    } else if (type === 'multiple_choice') {
        return correctAnswer.correct.map(a => answers[a]).join(', ');
    } else if (type === 'open_ended') {
        return correctAnswer.correctAnswers.join(', ');
    }
}

function openQuizInfo() {
    const quizId = tremola.trivia.current;
    const quiz = tremola.trivia.active[quizId];
    if (!quiz) return;

    setTriviaScenario('trivia-quiz-info');
    tremola.trivia.previousScenario = 'trivia-quiz-info';
    document.getElementById('quiz_info_title').textContent = `Quiz Info: ${quiz.quiz.title}`;

    const container = document.getElementById('quiz_info_container');
    container.innerHTML = `
        <p id="quiz_info_description">${quiz.quiz.description || ''}</p>
        <div class="form_group">
            <h4>Results from participants:</h4>
            <div id="quiz_participants"></div>
        </div>
    `;

    const participantsContainer = document.getElementById('quiz_participants');

    if (!quiz.results || Object.keys(quiz.results).length === 0) {
        participantsContainer.innerHTML = '<p>No results available yet.</p>';
        return;
    }

    for (const participantId in quiz.results) {
        const participantButton = document.createElement('button');
        participantButton.className = 'trivia_button trivia_list_button spotlight';
        participantButton.style.marginBottom = '10px';
        participantButton.innerHTML = `
            <div class="quiz_item">
                <div class="quiz_title">${fid2display(participantId)}</div>
            </div>
        `;

        participantButton.addEventListener('click', () => {
            tremola.trivia.previousScenario = 'trivia-quiz-info';
            const results = quiz.results[participantId].results;
            TriviaResults.show(quiz, results, participantId);
        });

        participantsContainer.appendChild(participantButton);
    }
}

function closeQuizInfo() {
    setTriviaScenario('trivia-list');
}
