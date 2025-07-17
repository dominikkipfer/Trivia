const TriviaCreate = {
    addQuestion() { addQuizQuestion(); },
    save() { saveQuiz(); },
    cancel(){ setTriviaScenario('trivia-list'); },
    onContactsConfirmed() { trivia_contacts_confirmed(); }
};

function showQuizCreationForm() {
    setTriviaScenario('trivia-create');
    document.getElementById("tremolaTitle").style.display = 'none';
    document.getElementById('quiz_title').value = '';
    document.getElementById('quiz_description').value = '';
    document.getElementById('questions_container').innerHTML = '';
}

function cancelQuizCreation() {
    setTriviaScenario('trivia-list');
}

function trivia_new_quiz() {
    showQuizCreationForm();
}

function addQuizQuestion() {
    const questionsContainer = document.getElementById('questions_container');
    const questionCount = questionsContainer.getElementsByClassName('question_item').length + 1;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question_item';
    questionDiv.innerHTML = `
        <div class="form_group">
            <div class="question_header">
                <div class="question_header_left">
                    <button class="trivia_button spotlight" style="width: 40px;" onclick="toggleQuestion(this)">
                        <img src="../miniApps/trivia/assets/arrow-down.svg" class="trivia_button_icon" alt="v" />
                    </button>
                    <button class="trivia_button spotlight" style="width: 40px;" onclick="deleteQuestion(this)">
                        <img src="../miniApps/trivia/assets/x.svg" class="trivia_button_icon" alt="X" />
                    </button>
                </div>
                <label class="question_label">Question ${questionCount}</label>
                <div class="question_header_right">
                    <button type="button" class="reorder_answer">
                        <img src="../miniApps/trivia/assets/threelines.svg" class="trivia_button_icon" style="filter: invert(75%);"/>
                    </button>
                </div>
            </div>
            <input type="text" class="question_text form_input" placeholder="Type your question here">
        </div>
        <div class="form_group">
            <div class="question_type_tabs">
                <button class="question_type_tab question_type_tab_active" data-type="single_choice">Single Choice</button>
                <button class="question_type_tab" data-type="multiple_choice">Multiple Choice</button>
                <button class="question_type_tab" data-type="open_ended">Open Ended</button>
            </div>
        </div>
        <div class="question_details"></div>
    `;

    const detailsDiv = questionDiv.querySelector('.question_details');
    detailsDiv.innerHTML = generateChoiceDetails('single_choice', questionCount);

    const typeTabs = questionDiv.querySelectorAll('.question_type_tab');
    typeTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            typeTabs.forEach(t => t.classList.remove('question_type_tab_active'));
            this.classList.add('question_type_tab_active');

            const type = this.dataset.type;
            const questionItem = this.closest('.question_item');
            const detailsDiv = questionItem.querySelector('.question_details');
            const existingAnswers = getExistingAnswers(detailsDiv);

            if (type === 'single_choice' || type === 'multiple_choice') {
                detailsDiv.innerHTML = generateChoiceDetails(type, questionCount, existingAnswers);
                attachAnswerManagementListeners(detailsDiv, questionCount, type);
            } else if (type === 'open_ended') {
                detailsDiv.innerHTML = generateOpenEndedDetails(questionCount, existingAnswers);
                attachOpenEndedListeners(detailsDiv, questionCount);
            }
        });
    });

    questionsContainer.appendChild(questionDiv);
    attachAnswerManagementListeners(detailsDiv, questionCount, 'single_choice');
}

function toggleQuestion(button) {
    const questionItem = button.closest('.question_item');
    const questionText = questionItem.querySelector('.question_text');
    const typeTabsGroup = questionItem.querySelector('.question_type_tabs').closest('.form_group');
    const detailsDiv = questionItem.querySelector('.question_details');
    const arrowIcon = button.querySelector('img');

    const isVisible = typeTabsGroup.style.display !== 'none';

    [questionText, typeTabsGroup, detailsDiv].forEach(el => {
        if (el) el.style.display = isVisible ? 'none' : 'block';
    });

    arrowIcon.style.transform = isVisible ? 'rotate(180deg)' : 'rotate(0deg)';
    arrowIcon.style.transition = 'transform 0.3s';

    if (!isVisible) {
        setTimeout(() => {
            const tabs = questionItem.querySelectorAll('.question_type_tab');
            tabs.forEach(tab => {
                tab.style.flex = '1 1 33%';
            });
        }, 10);
    }

    questionItem.style.padding = isVisible ? '10px 10px' : '10px 10px 20px 10px';
}

function deleteQuestion(button) {
    const questionItem = button.closest('.question_item');
    if (!questionItem) return;
    questionItem.remove();
    updateQuestionLabels();
}

function updateQuestionLabels() {
    const questionItems = document.querySelectorAll('.question_item');
    questionItems.forEach((item, index) => {
        const label = item.querySelector('.question_label');
        if (label) {
            label.textContent = `Question ${index + 1}`;
        }
    });
}

function getExistingAnswers(detailsDiv) {
    const textInputs = detailsDiv.querySelectorAll('input[type="text"]');
    return Array.from(textInputs).map(input => input.value.trim()).filter(val => val !== '');
}

function generateChoiceDetails(type, questionCount, existingAnswers = []) {
    const inputType = type === 'single_choice' ? 'radio' : 'checkbox';
    const nameAttr = type === 'single_choice' ? `name="correct_${questionCount}"` : '';
    let answersHtml = '';
    const numAnswers = Math.max(2, existingAnswers.length);
    for (let i = 0; i < numAnswers; i++) {
        const answerValue = existingAnswers[i] || '';
        answersHtml += `
            <div class="form_group answer_group" draggable="true" data-index="${i}">
                <button type="button" class="remove_answer spotlight">
                    <img src="../miniApps/trivia/assets/minus.svg" class="trivia_button_icon_small" alt="-" />
                </button>
                <input type="${inputType}" class="correct_input" value="${i}" ${nameAttr}>
                <input type="text" class="answer_text form_input" placeholder="Answer ${String.fromCharCode(65 + i)}" value="${answerValue}">
                <button type="button" class="reorder_answer">
                    <img src="../miniApps/trivia/assets/threelines.svg" class="trivia_button_icon" style="filter: invert(75%);"/>
                </button>
            </div>
        `;
    }
    return `
        <div class="answers_container" data-type="${type}">
            ${answersHtml}
            <button type="button" class="add_answer spotlight">
                <img src="../miniApps/trivia/assets/plus.svg" class="trivia_button_icon_small" alt="-" />
            </button>
        </div>
    `;
}

function generateOpenEndedDetails(questionCount, existingAnswers = []) {
    let answersHtml = existingAnswers.length > 0
        ? existingAnswers.map((answer, index) => `
        <div class="form_group answer_group">
            <button type="button" class="remove_answer spotlight">
                <img src="../miniApps/trivia/assets/minus.svg" class="trivia_button_icon_small" alt="-" />
            </button>
            <input type="text" class="correct_answer form_input" placeholder="Correct Answer ${index + 1}" value="${answer}">
        </div>
    `).join('')
        : `
        <div class="form_group answer_group">
            <button type="button" class="remove_answer spotlight">
                <img src="../miniApps/trivia/assets/minus.svg" class="trivia_button_icon_small" alt="-" />
            </button>
            <input type="text" class="correct_answer form_input" placeholder="Correct Answer 1">
        </div>
    `;

    return `
    <div class="correct_answers_container" data-type="open_ended">
        ${answersHtml}
        <button type="button" class="add_answer spotlight">
            <img src="../miniApps/trivia/assets/plus.svg" class="trivia_button_icon_small" alt="-" />
        </button>
    </div>
    <div class="form_group">
        <label>Options:</label>
        <div>
            <input type="checkbox" name="case_sensitive" id="case_sensitive_${questionCount}">
            <label for="case_sensitive_${questionCount}">Case Sensitive</label>
        </div>
        <div>
            <input type="checkbox" name="numbers_only" id="numbers_only_${questionCount}">
            <label for="numbers_only_${questionCount}">Numbers Only</label>
        </div>
    </div>
`;
}

function attachOpenEndedListeners(detailsDiv, questionCount) {
    const addAnswerBtn = detailsDiv.querySelector('.add_answer');
    addAnswerBtn.addEventListener('click', function() {
        const container = detailsDiv.querySelector('.correct_answers_container');
        const newAnswerDiv = document.createElement('div');
        newAnswerDiv.className = 'form_group answer_group';
        newAnswerDiv.innerHTML = `
            <button type="button" class="remove_answer spotlight">
                <img src="../miniApps/trivia/assets/minus.svg" class="trivia_button_icon_small" alt="-" />
            </button>
            <input type="text" class="correct_answer form_input" placeholder="Correct Answer">
        `;
        container.insertBefore(newAnswerDiv, addAnswerBtn);
        const removeBtn = newAnswerDiv.querySelector('.remove_answer');
        removeBtn.addEventListener('click', function() {
            container.removeChild(newAnswerDiv);
        });
    });

    const removeBtns = detailsDiv.querySelectorAll('.remove_answer');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const answerDiv = this.closest('.form_group');
            answerDiv.parentNode.removeChild(answerDiv);
        });
    });
}

function attachAnswerManagementListeners(detailsDiv, questionCount, type) {
    const answersContainer = detailsDiv.querySelector('.answers_container');
    const addAnswerBtn = answersContainer.querySelector('.add_answer');

    answersContainer.addEventListener('dragstart', function(e) {
        const answerGroup = e.target.closest('.answer_group');
        if (answerGroup) {
            e.dataTransfer.setData('text/plain', answerGroup.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    answersContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    answersContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        const draggedIndex = e.dataTransfer.getData('text/plain');
        const target = e.target.closest('.answer_group');
        if (target && target.dataset.index !== draggedIndex) {
            const draggedElement = answersContainer.querySelector(`[data-index="${draggedIndex}"]`);
            if (draggedElement && target) {
                answersContainer.insertBefore(draggedElement, target);
                updateAnswerIndices(answersContainer, questionCount, type);
            }
        }
    });

    addAnswerBtn.addEventListener('click', function() {
        const numAnswers = answersContainer.querySelectorAll('.answer_group').length;
        const inputType = type === 'single_choice' ? 'radio' : 'checkbox';
        const nameAttr = type === 'single_choice' ? `name="correct_${questionCount}"` : '';
        const newAnswerDiv = document.createElement('div');
        newAnswerDiv.className = 'form_group answer_group';
        newAnswerDiv.setAttribute('draggable', 'true');
        newAnswerDiv.dataset.index = numAnswers;
        newAnswerDiv.innerHTML = `
            <button type="button" class="remove_answer spotlight">
                <img src="../miniApps/trivia/assets/minus.svg" class="trivia_button_icon_small" alt="-" />
            </button>
            <input type="${inputType}" class="correct_input" value="${numAnswers}" ${nameAttr}>
            <input type="text" class="answer_text form_input" placeholder="Answer ${String.fromCharCode(65 + numAnswers)}">
            <button type="button" class="reorder_answer">
                <img src="../miniApps/trivia/assets/threelines.svg" class="trivia_button_icon" style="filter: invert(75%);"/>
            </button>
        `;
        answersContainer.insertBefore(newAnswerDiv, addAnswerBtn);
        attachRemoveAnswerListener(newAnswerDiv, questionCount, type);
        updateAnswerIndices(answersContainer, questionCount, type);
    });

    const removeAnswerBtns = answersContainer.querySelectorAll('.remove_answer');
    removeAnswerBtns.forEach(btn => attachRemoveAnswerListener(btn.parentNode, questionCount, type));
}

function attachRemoveAnswerListener(answerDiv, questionCount, type) {
    const removeBtn = answerDiv.querySelector('.remove_answer');
    removeBtn.addEventListener('click', function() {
        const answersContainer = answerDiv.parentNode;
        if (answersContainer.querySelectorAll('.answer_group').length > 2) {
            answersContainer.removeChild(answerDiv);
            updateAnswerIndices(answersContainer, questionCount, type);
        } else {
            alert("A question must have at least two answers.");
        }
    });
}

function updateAnswerIndices(answersContainer, questionCount, type) {
    const answerGroups = answersContainer.querySelectorAll('.answer_group');
    answerGroups.forEach((group, index) => {
        const correctInput = group.querySelector('.correct_input');
        correctInput.value = index;
        if (type === 'single_choice') {
            correctInput.name = `correct_${questionCount}`;
        }
        group.querySelector('.answer_text').placeholder = `Answer ${String.fromCharCode(65 + index)}`;
        group.dataset.index = index;
    });
}

function saveQuiz() {
    const title = document.getElementById('quiz_title').value.trim();
    const description = document.getElementById('quiz_description').value.trim();
    const questionItems = document.getElementsByClassName('question_item');
    const contactsContainer = document.getElementById('quiz_contacts_container');
    const selectedContacts = Array.from(contactsContainer.children).map(el => el.dataset.contactId);

    let hasError = false;
    let errorMessages = [];

    if (!title) {
        errorMessages.push("Please enter a title for the quiz.");
        hasError = true;
    }

    if (selectedContacts.length === 0) {
        errorMessages.push("Please select at least one contact to send the quiz to.");
        hasError = true;
    }

    let questions = [];
    for (let i = 0; i < questionItems.length; i++) {
        const item = questionItems[i];
        const questionText = item.querySelector('.question_text').value.trim();
        if (!questionText) {
            errorMessages.push(`Question ${i+1} has no text.`);
            hasError = true;
            continue;
        }

        const questionType = item.querySelector('.question_type_tab.question_type_tab_active').dataset.type;
        if (questionType === 'single_choice') {
            const correctRadio = item.querySelector('input[type="radio"]:checked');
            if (!correctRadio) {
                errorMessages.push(`Question ${i+1} (Single Choice) has no correct answer selected.`);
                hasError = true;
            } else {
                const correct = parseInt(correctRadio.value);
                const answerInputs = item.querySelectorAll('.answer_text');
                let answers = [];
                for (let j = 0; j < answerInputs.length; j++) {
                    const answerText = answerInputs[j].value.trim();
                    if (!answerText) {
                        errorMessages.push(`Question ${i+1} has an empty answer.`);
                        hasError = true;
                    } else {
                        answers.push(answerText);
                    }
                }
                if (!hasError && correct >= 0 && correct < answers.length) {
                    questions.push({
                        type: 'single_choice',
                        question: questionText,
                        answers: answers,
                        correct: correct
                    });
                } else if (correct < 0 || correct >= answers.length) {
                    errorMessages.push(`Question ${i+1} has an invalid correct answer index.`);
                    hasError = true;
                }
            }
        } else if (questionType === 'multiple_choice') {
            const correctCheckboxes = item.querySelectorAll('input[type="checkbox"]:checked');
            const correct = Array.from(correctCheckboxes).map(cb => parseInt(cb.value));
            if (correct.length === 0) {
                errorMessages.push(`Question ${i+1} (Multiple Choice) has no correct answers selected.`);
                hasError = true;
            } else {
                const answerInputs = item.querySelectorAll('.answer_text');
                let answers = [];
                for (let j = 0; j < answerInputs.length; j++) {
                    const answerText = answerInputs[j].value.trim();
                    if (!answerText) {
                        errorMessages.push(`Question ${i+1} has an empty answer.`);
                        hasError = true;
                    } else {
                        answers.push(answerText);
                    }
                }
                if (!hasError) {
                    questions.push({
                        type: 'multiple_choice',
                        question: questionText,
                        answers: answers,
                        correct: correct
                    });
                }
            }
        } else if (questionType === 'open_ended') {
            const correctAnswerInputs = item.querySelectorAll('.correct_answer');
            const correctAnswers = Array.from(correctAnswerInputs).map(input => input.value.trim()).filter(answer => answer !== '');
            if (correctAnswers.length === 0) {
                errorMessages.push(`Question ${i+1} (Open Ended) has no correct answers provided.`);
                hasError = true;
            } else {
                const caseSensitiveCheckbox = item.querySelector('input[name="case_sensitive"]');
                const numbersOnlyCheckbox = item.querySelector('input[name="numbers_only"]');
                const caseSensitive = caseSensitiveCheckbox ? caseSensitiveCheckbox.checked : false;
                const numbersOnly = numbersOnlyCheckbox ? numbersOnlyCheckbox.checked : false;
                questions.push({
                    type: 'open_ended',
                    question: questionText,
                    correctAnswers: correctAnswers,
                    options: {
                        caseSensitive: caseSensitive,
                        numbersOnly: numbersOnly
                    }
                });
            }
        }
    }

    if (hasError) {
        alert("Please fix the following errors:\n" + errorMessages.join("\n"));
        return;
    }

    if (questions.length === 0) {
        alert("Please add at least one question.");
        return;
    }

    const quizData = {
        title: title,
        description: description,
        questions: questions,
        recipients: selectedContacts,
        created: new Date().toISOString()
    };

    const nm = myId + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    quizData.nm = nm;

    const quizMessage = {
        type: 'trivia-quiz',
        from: myId,
        nm: nm,
        quiz: quizData
    };

    writeLogEntry(JSON.stringify(quizMessage));

    setTriviaScenario('trivia-list');
}

function add_contacts() {
    launchContactsMenu("Trivia", "Pick players to invite to the quiz");
}

function trivia_contacts_confirmed() {
    const contactsContainer = document.getElementById('quiz_contacts_container');

    const existingPills = contactsContainer.querySelectorAll('.contact_pill');
    existingPills.forEach(pill => pill.remove());

    if (window.tremola && tremola.contacts) {
        for (const contactId in tremola.contacts) {
            const contactElement = document.getElementById(contactId);
            if (contactElement && contactElement.checked) {
                const displayName = fid2display(contactId);
                const contactPill = document.createElement('div');
                contactPill.className = 'contact_pill';
                contactPill.textContent = displayName;
                contactPill.dataset.contactId = contactId;

                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove_contact';
                removeBtn.innerHTML = '&times;';
                removeBtn.onclick = () => {
                    contactPill.remove();
                };

                contactPill.appendChild(removeBtn);
                contactsContainer.appendChild(contactPill);
            }
        }
    }

    setTriviaScenario('trivia-create');
}