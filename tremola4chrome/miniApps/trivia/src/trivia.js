const globalWindow = window.top || window;
const keyRing = new Map();

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

        if (!tremola.trivia) tremola.trivia = {
            active: {},
            closed: {}
        };

        data.forEach(item => {
            const msg = item.args ? item.args[0] : item;
            if (!msg) return;

            switch (msg.type) {
                case 'trivia-key':
                    if (msg.keys && Array.isArray(msg.keys)) {
                        receivePublicKey(msg.keys);
                    }
                    break;
                case 'trivia-quiz':
                    if (msg.to && msg.to.includes(myId)) {
                        const isOwnQuiz = msg.from === myId;
                        (async () => {
                            try {
                                const senderPubKey = keyRing.get(msg.from);
                                if (!senderPubKey) {
                                    return;
                                }

                                const sharedKey = await TriviaCrypto.deriveAES(
                                    tremola.trivia.keys.private,
                                    senderPubKey
                                );

                                const decrypted = await TriviaCrypto.decrypt(msg.content, sharedKey);
                                if (decrypted) {
                                    const quizData = JSON.parse(decrypted);
                                    console.log("Received quiz data:", quizData);
                                    tremola.trivia.active[msg.nm] = {
                                        nm: msg.nm,
                                        from: msg.from,
                                        quiz: quizData,
                                        isOwn: isOwnQuiz,
                                        state: 'new',
                                    };
                                    persist();
                                    if (TriviaScenario === 'trivia-list') TriviaUi.refresh();
                                }
                            } catch (error) {
                                console.error("Decryption failed: ", error);
                            }
                        })();
                    }
                    break;
                case 'trivia-result':
                    if (msg.to && msg.to.includes(myId)) {
                        (async () => {
                            try {
                                const senderPubKey = keyRing.get(msg.from);
                                if (!senderPubKey) {
                                    console.error(`No public key for sender ${msg.from}`);
                                    return;
                                }

                                const sharedKey = await TriviaCrypto.deriveAES(
                                    tremola.trivia.keys.private,
                                    senderPubKey
                                );

                                const decrypted = await TriviaCrypto.decrypt(msg.content, sharedKey);
                                if (decrypted) {
                                    const resultData = JSON.parse(decrypted);
                                    if (tremola.trivia.active[msg.nm]) {
                                        tremola.trivia.active[msg.nm].results = tremola.trivia.active[msg.nm].results || {};
                                        tremola.trivia.active[msg.nm].results[msg.from] = resultData;
                                        persist();
                                        if (TriviaScenario === 'trivia-list') TriviaUi.refresh();
                                    }
                                }
                            } catch (error) {
                                console.error("Decryption failed:", error);
                            }
                        })();
                    }
                    break;
                default:
                    console.warn("Unknown trivia message type:", msg.type);
                    break;
            }
        });
    }
};

console.log("Trivia loaded");