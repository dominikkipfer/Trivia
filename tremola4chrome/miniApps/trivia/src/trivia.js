"use strict";


/*

  Trivia command:
    NEW peerID    create new game
    ACC refG       accept referenced game
    END refG       close referenced game (can also be used to decline)
    MOV refG int
    GUP refG       give up
    VIO refG refM       report a violation

    state diagram:

           0=inviting ---rcvA.
                              \  2=open --> 3=closed
                              /
   rcvN -> 1=invited --sendA-'

   trivia data structure:
     closed = [ref_to_old_games]
     active = {ref : {
       peer: FID,
       state: 0-3
       close_reason:
       board:  []9x -1=other, 0=empty, 1=me
       mov_cnt: even=my turn, odd=other's turn
     } }
*/

// Ensure miniApps is attached to the topmost window (global scope)
const globalWindow = window.top || window; // Ensures cross-context access

if (!globalWindow.miniApps) {
    globalWindow.miniApps = {};
}

globalWindow.miniApps["trivia"] = {
    handleRequest: function(command, args) {
        console.log("Trivia handling request:", command);
        switch (command) {
            case "onBackPressed":
                console.log("TriviaScenario: ", TriviaScenario);
                if (TriviaScenario == 'trivia-board') {
                    setTriviaScenario('trivia-list');
                } else if (TriviaScenario == 'trivia-list') {
                    quitApp();
                }
                break;
            case "plus_button":
                console.log("Trivia plus_button");
                trivia_new_game();
                break;
            case "members_confirmed":
                console.log("Trivia members_confirmed");
                trivia_new_game_confirmed();
                break;
            case "edit_confirmed":
                console.log("Trivia edit_confirmed");
                kanban_edit_confirmed();
                break;
            case "b2f_initialize":
                console.log("Trivia b2f_initialize");
                trivia_load_list();
                break;
            case "b2f_new_event":
                console.log("Trivia b2f_new_event");
                trivia_load_list();
                break;
            case "incoming_notification": //incoming_notification
                console.log("Trivia incoming_notification:", JSON.stringify(args, null, 2));
                decodeRequest(args.args);
                break;
        }
        return "Response from Trivia";
    }
};

// ✅ Debugging Log: Ensure it's available globally
console.log("✅ Global MiniApps Object AFTER assignment:", globalWindow.miniApps);


console.log("Trivia loaded");

var trivia_iwon = '(I won)';
var trivia_ilost = '(I lost)';
var trivia_ogaveup = '(peer gave up)';
var trivia_igaveup = '(I gave up)';

function decodeRequest(request) {
    var args = request; // request is a stringified JSON array
    console.log("Type: ", args[0]?.type); // Add optional chaining to avoid errors
    trivia_on_rx(args, 0);
}

function trivia_load_list() {
    closeOverlay();
    let lst = document.getElementById('div:trivia-list');
    lst.innerHTML = '';
    if (typeof tremola.trivia == "undefined")
        tremola.trivia = { 'active': {}, 'closed': {} }
    for (var nm in tremola.trivia.active) {
        if (nm == "undefined")
            continue
        let g = tremola.trivia.active[nm];
        let item = document.createElement('div');
        // item.setAttribute('class', 'chat_item_div'); // old JS (SDK 23)
        // item.setAttribute('onclick', `trivia_load_board(${nm})`)
        var row = "<button class='trivia_list_button' onclick='trivia_load_board(\"" + nm + "\");' style='overflow: hidden; width: 70%; background-color: #ebf4fa;'>";
        row += "<div style='white-space: nowrap;'><div style='text-overflow: ellipsis; overflow: hidden;'>"
        row += "Trivia with " + fid2display(g.peer) + "<br>";
        row += g.state;
        if (g.state == 'closed')
            row += " " + g.close_reason;
        else if (g.state == 'invited')
            row += " (click here to accept)"
        row += "</div></button></div>"
        var btxt;
        if (g.state == 'invited')     btxt = 'decline';
        else if (g.state == 'closed') btxt = 'delete';
        else                          btxt = 'end';
        row += `<button class='trivia_list_button' style='width: 20%; text-align: center;' onclick='trivia_list_callback("${nm}","${btxt}")'>${btxt}</button>`;
        // console.log("list building " + row)
        item.innerHTML = row;
        lst.appendChild(item);
    }
}

function trivia_load_board(nm) {
    console.log("load board " + nm)
    let g = tremola.trivia.active[nm];
    if (g.state == 'inviting')
        return;
    if (g.state == 'invited') {
        trivia_list_callback(nm,'accept');
        return;
    }
    let t = document.getElementById('trivia_title');
    if (g.state == 'open') {
        let m = (g.cnt % 2) ? "my turn ..." : "... not my turn" ;
        t.innerHTML = `<font size=+2><strong>${m}</strong></font>`;
    } else { // must be in close state
        var m;
        if (g.close_reason == trivia_iwon)
            m = 'I win ! 😀';
        else if (g.close_reason == trivia_ilost)
            m = 'I lose ! 🙁';
        else
            m = g.close_reason.slice(1,g.close_reason.length-1);
        t.innerHTML = `<font size=+2 color=red><strong>${m}</strong></font>`
    }
    let f = document.getElementById('trivia_footer')
    f.style.display = g.state == 'closed' ? 'none' : null;

    let board = g.board
    let tab = document.getElementById('trivia_table');
    tab.innerHTML = '';
    for (var i = 0; i < 9; i++) {
        let item = document.createElement('div');
        item.setAttribute('class', 'trivia_cell');
        item.setAttribute('id', 'trivia' + i);
        item.setAttribute('onclick', 'trivia_cellclick(id)');
        if (board[i] == -1)
            item.innerHTML = "<img src='" + miniAppDirectory + "assets/cross.svg' width='100%'>";
        else if (board[i] == 1)
            item.innerHTML = "<img src='" + miniAppDirectory + "assets/dot.svg' width='100%'>";
        tab.appendChild(item);
    }
    tremola.trivia.current = nm;
    setTriviaScenario('trivia-board')
}

function trivia_new_game() {
    launchContactsMenu('Trivia', 'Pick a friend to play with');
    readLogEntries(10);
}

function trivia_new_game_confirmed() {
    console.log("trivia_new_game_confirmed");
    for (var m in tremola.contacts) {
        if (m != myId && document.getElementById(m).checked) {
            console.log("trivia invite " + m)
            //generate random number to use as game reference
            let randomNum = Math.floor(Math.random() * 1000000);
            // json structure with type, from, and to
            let json = { type: 'N', from: myId, to: m, nm: myId + "" + m + "" + randomNum };
            console.log("trivia invite " + JSON.stringify(json))
            writeLogEntry(JSON.stringify(json));
            // console.log("trivia invited: " + m)
            break;
        }
    }
    if (curr_scenario == 'members')
        setTriviaScenario('trivia-list')
}

function trivia_list_callback(nm,action) {
    // console.log("trivia_list_callback " + nm + " " + action)
    let g = tremola.trivia.active[nm]
    if (action == 'accept') {
        let json = { type: 'A', nm: nm };
        writeLogEntry(JSON.stringify(json));
    }
    else if (action == 'end' || action == 'decline') {
        let json = { type: 'E', nm: nm, from: myId };
        writeLogEntry(JSON.stringify(json));
    }
    else if (action == 'delete') {
        delete tremola.trivia.active[nm];
        tremola.trivia.closed[nm] = g.peer; // remember peer
        persist();
    }
    trivia_load_list();
}

function trivia_cellclick(id) {
    // console.log("clicked " + id + ' ' + id[3]);
    let nm = tremola.trivia.current
    let g = tremola.trivia.active[nm]
    console.log("clicked " + id + ' ' + id[3] + ' ' + g.state + ' ' + g.cnt);
    if (g.state != 'open' || (g.cnt % 2) != 1)
        return;
    let i = parseInt(id[3], 10);
    if (g.board[i] == 0) {
        let json = { type: 'M', nm: nm, i: i, from: myId };
        writeLogEntry(JSON.stringify(json));

    }
}

function trivia_on_rx(args, index=0) {
    console.log("trivia_on_rx args " + JSON.stringify(args));
    if (typeof tremola.trivia == "undefined")
        tremola.trivia = { 'active': {}, 'closed': {} }
    let ta = tremola.trivia.active;
    if (args[index].type == 'N') {
        if (args[index].from != myId && args[index].to != myId)
            return;
        ta[args[index].nm] = {
            'peer': args[index].to == myId ? args[index].from : args[index].to,
            'state': args[index].to == myId ? 'invited' : 'inviting',
            //'peer': args[1] == myId ? from : args[1],
            //'state': args[1] == myId ? 'invited' : 'inviting',
            'close_reason': '',
            'board': [0,0,0,0,0,0,0,0,0], // -1=other, 0=empty, 1=me
            'cnt': 0,
        }
        persist();
        if (TriviaScenario == 'trivia-list')
            trivia_load_list();
        return;
    }
    let g = ta[args[index].nm];
    if (args[index].type == 'A') { // accepts
        if (g.state == 'inviting' || g.state == 'invited') { //
            if (g.state == 'invited')
                g.cnt = 1;
            g.state = 'open';
            persist();
            if (TriviaScenario == 'trivia-list')
                trivia_load_list();
        } // else discard
        return;
    }
    if (args[index].type == 'E') { // end
        g.state = 'closed';
        g.close_reason = 'by ' + (args[index].from == myId ? 'myself' : 'peer');
    } if (args[index].type == 'M') { // move
        // TODO: check that we are open, raise violation error otherwise
        // TODO: check that cell is empty, raise violation error otherwise
        // TODO: check that the turn is made by the right party, raise violation error otherwise
        console.log("move " + args[index].i + " " + args[index].from);
        let ndx = parseInt(args[index].i,10);
        g.board[ndx] = args[index].from == myId ? -1 : 1;
        g.cnt++;
        if (trivia_winning(g.board)) {
            g.state = 'closed'
            g.close_reason = args[index].from == myId ? trivia_iwon : trivia_ilost;
        }
    } else if (args[index].type == 'G') { // give up
        g.state = 'closed';
        g.close_reason = args[index].from == myId ? trivia_igaveup : trivia_ogaveup;
    } else if (args[index].type == 'V') { // violation
        g.state = 'closed';
        g.close_reason = '(protocol violation)';
    }

    persist();
    if (TriviaScenario == 'trivia-list')
        trivia_load_list();
    if (TriviaScenario == 'trivia-board' && args[index].type != 'A' && tremola.trivia.current == args[index].nm)
        trivia_load_board(args[index].nm);
}

function trivia_give_up() {
    let nm = tremola.trivia.current;
    let json = { type: 'G', nm: nm, from: myId };
    writeLogEntry(JSON.stringify(json));
    setTriviaScenario('trivia-list');
}

function trivia_walk_away() {
    let nm = tremola.trivia.current;
    let json = { type: 'E', nm: nm, from: myId };
    writeLogEntry(JSON.stringify(json));
    setTriviaScenario('trivia-list');
}

function trivia_winning(board) {
    var c, w;
    for (var i=0; i < 3; i++ ) {
        // check rows
        c = board[3*i];
        if (c != 0) {
            w = true;
            for (var j=1; j < 3; j++) {
                if (c != board[3*i + j]) {
                    w = false;
                    break;
                }
            }
            if (w) return true;
        }
        // check columns
        c = board[i];
        if (c != 0) {
            w = true;
            for (var j=1; j < 3; j++) {
                if (c != board[3*j + i]) {
                    w = false;
                    break;
                }
            }
            if (w) return true;
        }
    }
    // check diagonals
    c = board[3 + 1]; // center
    if (c != 0) {
        if (board[0] == c && board[8] == c)
            return true;
        if (board[2] == c && board[6] == c)
            return true;
    }
    return false;
}

// eof