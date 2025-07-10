"use strict";

var TriviaScenario = null;

function setTriviaScenario(s) {
    console.log("setTriviaScenario", s);

    console.log("scenarioDisplay", scenarioDisplay);

    var lst = scenarioDisplay[s];
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

    if (s == 'trivia-list') {
        document.getElementById("tremolaTitle").style.display = 'none';
        var c = document.getElementById("conversationTitle");
        c.style.display = null;
        c.innerHTML = "<font size=+1><strong>Trivia</strong><br>Pick or create a new game</font>";
        trivia_load_list();
    }
    if (s == 'trivia-board') {
        document.getElementById("tremolaTitle").style.display = 'none';
        var c = document.getElementById("conversationTitle");
        c.style.display = null;
        let fed = tremola.trivia.active[tremola.trivia.current].peer
        c.innerHTML = `<font size=+1><strong>Trivia with ${fid2display(fed)}</strong></font>`;
    }
}


function load_board_list() {
}