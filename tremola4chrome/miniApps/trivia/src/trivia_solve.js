const TriviaSolve = {
    load(quizId) { trivia_load_board(quizId); },
    cancel() { cancel_quiz(); },
    submit() { submit_quiz(); }
};

function trivia_load_board(quizId) {
    tremola.trivia.isResultsView = false;
    const quizData = tremola.trivia.active[quizId];
    if (!quizData) {
        console.error("Quiz not found:", quizId);
        return;
    }
    tremola.trivia.current = quizId;

    document.getElementById('solve_quiz_title').innerText = quizData.quiz.title;
    const container = document.getElementById('solve_quiz_container');
    container.innerHTML = '';

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
    if (tremola.trivia.isResultsView) {
        setTriviaScenario('trivia-list');
    } else {
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
}

async function submit_quiz() {
    if (tremola.trivia.isResultsView) {
        setTriviaScenario('trivia-list'); // Schließt Ergebnisse und kehrt zur Liste zurück
    } else {
        const quizId = tremola.trivia.current;
        const quiz = tremola.trivia.active[quizId];
        if (!quiz) return;

        const questions = quiz.quiz.questions;
        const answers = [];
        const results = [];

        let solutions;
        try {
            const solutionKeyBytes = TriviaCrypto.base64ToBuf(quiz.quiz.solutionKey);
            const solutionKey = await crypto.subtle.importKey(
                'raw',
                solutionKeyBytes,
                {name: 'AES-GCM'},
                false,
                ['decrypt']
            );
            const decryptedSolutions = await TriviaCrypto.decrypt(quiz.quiz.encryptedSolutions, solutionKey);
            solutions = JSON.parse(decryptedSolutions);
        } catch (error) {
            console.error("Failed to decrypt solutions:", error);
            return;
        }

        questions.forEach((q, idx) => {
            let userAnswer = null;
            let isCorrect = false;

            if (q.type === 'single_choice') {
                const inputs = document.querySelectorAll(`input[name="q_${idx}"]:checked`);
                userAnswer = inputs.length ? parseInt(inputs[0].value) : null;
                isCorrect = userAnswer !== null && userAnswer === solutions[idx].correct;
            } else if (q.type === 'multiple_choice') {
                const inputs = document.querySelectorAll(`input[name="q_${idx}"]:checked`);
                userAnswer = Array.from(inputs).map(i => parseInt(i.value)).sort((a, b) => a - b);
                const correctAnswers = solutions[idx].correct.sort((a, b) => a - b);
                isCorrect = userAnswer.length === correctAnswers.length &&
                    userAnswer.every((val, i) => val === correctAnswers[i]);
            } else if (q.type === 'open_ended') {
                const input = document.querySelector(`#solve_quiz_container .question_item:nth-child(${idx + 1}) input[type="text"]`);
                userAnswer = input ? input.value.trim() : '';
                const correctAnswers = solutions[idx].correctAnswers;
                const options = solutions[idx].options || {
                    caseSensitive: false,
                    numbersOnly: false
                };
                if (options.numbersOnly) {
                    const numAnswer = parseFloat(userAnswer);
                    isCorrect = !isNaN(numAnswer) && correctAnswers.some(ans => parseFloat(ans) === numAnswer);
                } else if (options.caseSensitive) {
                    isCorrect = correctAnswers.includes(userAnswer);
                } else {
                    isCorrect = correctAnswers.some(ans => ans.toLowerCase() === userAnswer.toLowerCase());
                }
            }

            answers.push({
                questionIndex: idx,
                answer: userAnswer
            });
            results.push({
                questionIndex: idx,
                userAnswer: userAnswer,
                correctAnswer: solutions[idx],
                isCorrect: isCorrect
            });
        });

        const result = {
            type: 'trivia-result',
            nm: quizId,
            from: myId,
            to: [quiz.from],
            answers: answers,
            results: results
        };

        const creatorPubKey = keyRing.get(quiz.from);
        if (!creatorPubKey) {
            console.error(`No public key found for quiz creator ${quiz.from}`);
            return;
        }

        try {
            const sharedKey = await TriviaCrypto.deriveAES(
                tremola.trivia.keys.private,
                creatorPubKey
            );
            const resultContent = JSON.stringify(result);
            const encryptedResult = await TriviaCrypto.encrypt(resultContent, sharedKey);

            const encryptedMessage = {
                type: 'trivia-result',
                from: myId,
                to: [quiz.from],
                nm: quizId,
                content: encryptedResult
            };

            writeLogEntry(JSON.stringify(encryptedMessage));
        } catch (error) {
            console.error("Failed to encrypt quiz results:", error);
            return;
        }

        displayResults(quiz, results);

        tremola.trivia.active[quizId].state = 'solved';
        tremola.trivia.active[quizId].results = tremola.trivia.active[quizId].results || {};
        tremola.trivia.active[quizId].results[myId] = result;
        persist();
    }
}

function displayResults(quiz, results) {
    tremola.trivia.isResultsView = true;
    const container = document.getElementById('solve_quiz_container');
    container.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Quiz Results';
    container.appendChild(title);

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
