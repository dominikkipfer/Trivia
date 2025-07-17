const globalWindow = window.top || window;

if (!globalWindow.miniApps) {
    globalWindow.miniApps = {};
}

globalWindow.miniApps["trivia"] = {
    handleRequest: function (command, args) {
        console.log("Trivia handling request:", command);
        switch (command) {
            case "onBackPressed":
                TriviaUi.onBackPressed();
                break;
            case "members_confirmed":
                TriviaCreate.onContactsConfirmed();
                break;
            case "b2f_initialize":
            case "b2f_new_event":
                TriviaUi.refresh();
                break;
            case "incoming_notification":
                TriviaLogic.onIncoming(args.args);
                break;
        }
        return "Response from Trivia";
    }
};

const TriviaLogic = {
    onIncoming(raw) {
        let msgs = Array.isArray(raw) ? raw : JSON.parse(raw.content || raw);
        if (!Array.isArray(msgs)) return;

        if (!tremola.trivia) tremola.trivia = { active: {}, closed: {} };
        msgs.forEach(msg => {
            if (!msg?.type || !msg.quiz) return;
            tremola.trivia.active[msg.quiz.nm] = {
                nm: msg.quiz.nm,
                from: msg.from || 'unknown',
                quiz: msg.quiz,
                isOwn: false,
                state: 'new'
            };
            persist();
            if (TriviaScenario === 'trivia-list') TriviaUi.refresh();
        });
    }
};

console.log("Trivia loaded");
