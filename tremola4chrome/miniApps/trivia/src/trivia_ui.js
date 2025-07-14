"use strict";

let TriviaScenario = null;

function setTriviaScenario(s) {
    let c;
    console.log("setTriviaScenario", s);

    console.log("scenarioDisplay", scenarioDisplay);

    const lst = scenarioDisplay[s];
    console.log("scenarioDisplay", lst);
    load_board_list();

    display_or_not.forEach(function (d) {
        console.log(d);
        let element = document.getElementById(d);
        if (element) {
            if (lst.indexOf(d) < 0) {
                element.style.display = 'none';
            } else {
                element.style.display = null;
            }
        } else {
            console.warn(`Element with ID '${d}' not found.`);
        }
    });

    TriviaScenario = s;

    if (s === 'trivia-list') {
        document.getElementById("tremolaTitle").style.display = 'none';
        c = document.getElementById("conversationTitle");
        c.style.display = null;
        c.innerHTML = "<font size=+1><strong>Trivia</strong><br>Pick or create a new quiz</font>";
        renderTriviaLists();
    }
}

let trivia_buttons = document.querySelectorAll('.spotlight');
trivia_buttons.forEach(trivia_button => {
    trivia_button.onmousemove = function (e) {
        let x = e.pageX - trivia_button.offsetLeft;
        trivia_button.style.setProperty('--x', x + 'px');

        let y = e.pageY - trivia_button.offsetTop;
        trivia_button.style.setProperty('--y', y + 'px');
    }
})
