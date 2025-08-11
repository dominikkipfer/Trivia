const TriviaSolve = {
    load(quizId) {
        trivia_load_board(quizId);
    }
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
    container.innerHTML = '';

    quizData.quiz.questions.forEach((q, index) => {
        const questionSolve = document.createElement('div');
        questionSolve.className = 'question_item';

        const questionHeader = document.createElement('h3');
        questionHeader.textContent = `Question ${index + 1}: ${q.question}`;
        questionSolve.appendChild(questionHeader);

        if (q.type === 'single_choice' || q.type === 'multiple_choice') {
            const inputType = q.type === 'single_choice' ? 'radio' : 'checkbox';

            q.answers.forEach((ans, i) => {
                const answerGroup = document.createElement('div');
                answerGroup.className = 'form_group answer_group';

                const input = document.createElement('input');
                input.type = inputType;
                input.id = `q${index}_ans${i}`;
                input.name = `q_${index}`;
                input.value = i;

                const label = document.createElement('label');
                label.htmlFor = `q${index}_ans${i}`;
                label.textContent = ans;

                answerGroup.appendChild(input);
                answerGroup.appendChild(label);
                questionSolve.appendChild(answerGroup);
            });
        } else if (q.type === 'open_ended') {
            const formGroup = document.createElement('div');
            formGroup.className = 'form_group';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form_input';
            input.id = `q${index}_open`;
            input.name = `q_${index}`;
            input.placeholder = 'Your answer.';

            formGroup.appendChild(input);
            questionSolve.appendChild(formGroup);
        }

        container.appendChild(questionSolve);
    });

    setTriviaScenario('trivia-solve');
}

function cancel_quiz() {
    setTriviaScenario('trivia-list');
}

async function submit_quiz() {
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

    if (quiz.from !== myId) {
        const creatorPubKey = keyRing.get(quiz.from);
        if (!creatorPubKey) {
            console.error(`No public key found for quiz creator ${quiz.from}`);
            alert("Cannot send results: No public key for quiz creator.");
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
            alert("Error encrypting quiz results.");
            return;
        }
    } else {
        tremola.trivia.active[quizId].selfSent = true;
    }

    tremola.trivia.active[quizId].state = 'solved';
    tremola.trivia.active[quizId].results = tremola.trivia.active[quizId].results || {};
    tremola.trivia.active[quizId].results[myId] = result;

    TriviaResults.show(quiz, results, myId);
    persist();
}
