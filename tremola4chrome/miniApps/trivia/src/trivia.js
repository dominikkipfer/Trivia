window.miniApps["trivia"] = {
    handleRequest: function(command, args) {
        console.log("Trivia handling request:", command);
        switch (command) {
            case "onBackPressed":
                if (TriviaScenario === 'trivia-board') {
                    setTriviaScenario('trivia-list');
                } else if (TriviaScenario === 'trivia-list') {
                    quitApp();
                }
                break;
            case "plus_button":
                console.log("Trivia plus_button");
                trivia_new_quiz();
                break;
        }
        return "Response from Trivia";
    }
};

console.log("Trivia loaded");

function trivia_new_quiz() {
    showQuizCreationForm();
}

function trivia_give_up() {
    let nm = tremola.trivia.current;
    let json = { type: 'G', nm: nm, from: myId };
    writeLogEntry(JSON.stringify(json));
    setTriviaScenario('trivia-list');
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

function setTriviaScenario(s) {
    if (s === 'trivia-list') {
        document.getElementById('div:trivia-list').style.display = '';
        document.getElementById('div:trivia-board').style.display = 'none';
        renderTriviaLists();
        showTriviaTab('solvable');
    }
}

function renderTriviaLists() {
    if (!window.tremola) window.tremola = {};
    if (!tremola.trivia) tremola.trivia = {};
    if (!tremola.trivia.active) tremola.trivia.active = {};

    let todoQuizzes = Object.values(tremola.trivia.active).filter(q => !q.isOwn);
    let ownQuizzes = Object.values(tremola.trivia.active).filter(q => q.isOwn);

    document.getElementById('trivia_solving_list').innerHTML = todoQuizzes.length > 0
        ? todoQuizzes.map(q =>
            `<button onclick="trivia_load_board('${q.nm}')">${q.quiz.title || 'Quiz'}</button>`
        ).join('')
        : '<p style="text-align: center; color: #666;">No quizzes available to solve.</p>';

    document.getElementById('trivia_created_quizzes').innerHTML = ownQuizzes.length > 0
        ? ownQuizzes.map(q =>
            `<button onclick="trivia_load_board('${q.nm}')">${q.quiz.title || 'Quiz'}</button>`
        ).join('')
        : '<p style="text-align: center; color: #666;">No quizzes created yet.</p>';
    document.getElementById('trivia_leaderboard_list').innerHTML = ''; // Optional: Anpassung je nach Bedarf
}

function showQuizCreationForm() {
    setTriviaScenario('trivia-create');

    document.getElementById("tremolaTitle").style.display = 'none';
    let c = document.getElementById("conversationTitle");
    c.style.display = null;
    c.innerHTML = "<font size=+1><strong>Trivia</strong><br>Create a new quiz</font>";

    document.getElementById('quiz_title').value = '';
    document.getElementById('quiz_description').value = '';
    document.getElementById('questions_container').innerHTML = `
    <div class="question_item">
      <div class="form_group">
        <label>Question 1:</label>
        <input type="text" class="question_text form_input" placeholder="Type your question here">
      </div>
      
      <div class="answers_container">
        <div class="form_group">
          <input type="text" class="answer_text form_input" placeholder="Answer A">
          <input type="radio" name="correct_1" value="0" checked>
        </div>
        <div class="form_group">
          <input type="text" class="answer_text form_input" placeholder="Answer B">
          <input type="radio" name="correct_1" value="1">
        </div>
        <div class="form_group">
          <input type="text" class="answer_text form_input" placeholder="Answer C">
          <input type="radio" name="correct_1" value="2">
        </div>
        <div class="form_group">
          <input type="text" class="answer_text form_input" placeholder="Answer D">
          <input type="radio" name="correct_1" value="3">
        </div>
      </div>
    </div>
  `;
}

function addQuizQuestion() {
    const questionsContainer = document.getElementById('questions_container');
    const questionCount = questionsContainer.getElementsByClassName('question_item').length + 1;

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question_item';
    questionDiv.innerHTML = `
    <div class="form_group">
      <label>Question ${questionCount}:</label>
      <input type="text" class="question_text form_input" placeholder="Type your question here">
    </div>
    
    <div class="answers_container">
      <div class="form_group">
        <input type="text" class="answer_text form_input" placeholder="Answer A">
        <input type="radio" name="correct_${questionCount}" value="0" checked>
      </div>
      <div class="form_group">
        <input type="text" class="answer_text form_input" placeholder="Answer B">
        <input type="radio" name="correct_${questionCount}" value="1">
      </div>
      <div class="form_group">
        <input type="text" class="answer_text form_input" placeholder="Answer C">
        <input type="radio" name="correct_${questionCount}" value="2">
      </div>
      <div class="form_group">
        <input type="text" class="answer_text form_input" placeholder="Answer D">
        <input type="radio" name="correct_${questionCount}" value="3">
      </div>
    </div>
  `;

    questionsContainer.appendChild(questionDiv);
}

function saveQuiz() {
    const title = document.getElementById('quiz_title').value;
    const description = document.getElementById('quiz_description').value;
    const questionItems = document.getElementsByClassName('question_item');

    let questions = [];
    for (let i = 0; i < questionItems.length; i++) {
        const item = questionItems[i];
        const questionText = item.querySelector('.question_text').value;
        const answerInputs = item.querySelectorAll('.answer_text');
        const correctRadio = item.querySelector('input[type="radio"]:checked');

        let answers = [];
        for (let j = 0; j < answerInputs.length; j++) {
            answers.push(answerInputs[j].value);
        }

        questions.push({
            question: questionText,
            answers: answers,
            correct: parseInt(correctRadio.value)
        });
    }

    const quiz = {
        title: title,
        description: description,
        questions: questions,
        isOwn: true,
        created: new Date().toISOString()
    };

    if (!window.tremola) window.tremola = {};
    if (!tremola.trivia) tremola.trivia = {};
    if (!tremola.trivia.active) tremola.trivia.active = {};

    const quizId = 'quiz_' + Date.now();
    tremola.trivia.active[quizId] = {
        nm: quizId,
        quiz: quiz,
        isOwn: true
    };

    setTriviaScenario('trivia-list');
    renderTriviaLists();
}

function cancelQuizCreation() {
    setTriviaScenario('trivia-list');
}