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
        let data = Array.isArray(raw) ? raw : JSON.parse(raw.content || raw);
        if (!Array.isArray(data)) return;

        if (!tremola.trivia) tremola.trivia = { active: {}, closed: {} };

        data.forEach(item => {
            const msg = item.args ? item.args[0] : item;
            if (!msg || msg.type !== 'trivia-quiz' || !msg.quiz) return;

            if (msg.to && msg.to.includes(myId)) {
                const isOwnQuiz = msg.from === myId;
                const selfSent = isOwnQuiz && msg.to.includes(myId);

                tremola.trivia.active[msg.nm] = {
                    nm: msg.nm,
                    from: msg.from,
                    quiz: msg.quiz,
                    isOwn: isOwnQuiz,
                    state: 'new',
                    selfSent: selfSent
                };
                persist();
                if (TriviaScenario === 'trivia-list') TriviaUi.refresh();
            }
        });
    }
};

console.log("Trivia loaded");
