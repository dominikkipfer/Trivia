const TriviaResults = {
    show(quiz, results) {
        displayResults(quiz, results);
    }
};

function closeResults() {
    setTriviaScenario('trivia-list');
}

function displayResults(quiz, results) {
    setTriviaScenario('trivia-results');
    document.getElementById('results_title').textContent = `Quiz Results: ${quiz.quiz.title}`;
    const solverName = fid2display(results.from || myId);
    document.getElementById('results_subtitle').textContent = `solved from: ${solverName}`;
    const container = document.getElementById('results_quiz_container');
    container.innerHTML = '';

    results.forEach((result, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question_item';

        const questionTitle = document.createElement('h3');
        questionTitle.textContent = `Question ${index + 1}: ${quiz.quiz.questions[index].question}`;
        questionDiv.appendChild(questionTitle);

        const userAnswerDiv = document.createElement('div');
        userAnswerDiv.textContent = `Your answer: ${formatAnswer(result.userAnswer, quiz.quiz.questions[index].type, quiz.quiz.questions[index].answers)}`;
        questionDiv.appendChild(userAnswerDiv);

        const correctAnswerDiv = document.createElement('div');
        correctAnswerDiv.textContent = `Correct answer: ${formatCorrectAnswer(result.correctAnswer, quiz.quiz.questions[index].type, quiz.quiz.questions[index].answers)}`;
        questionDiv.appendChild(correctAnswerDiv);

        const statusDiv = document.createElement('div');
        statusDiv.textContent = result.isCorrect ? 'Correct' : 'Incorrect';
        statusDiv.className = result.isCorrect ? 'correct' : 'incorrect';
        questionDiv.appendChild(statusDiv);

        container.appendChild(questionDiv);
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
