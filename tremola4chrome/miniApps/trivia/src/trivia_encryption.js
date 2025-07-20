const keyBroadcastTimers = new Map();

(() => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    window.TriviaCrypto = {
        async generateKeyPair() {
            const pair = await crypto.subtle.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                false,
                ['deriveKey']
            );
            const pubBytes = await crypto.subtle.exportKey('raw', pair.publicKey);
            return {
                pub: pubBytes,
                private: pair.privateKey
            };
        },
        async deriveAES(myPrivate, theirPub) {
            const theirKey = await crypto.subtle.importKey(
                'raw', theirPub,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                false, []
            );
            return crypto.subtle.deriveKey(
                {
                    name: 'ECDH',
                    public: theirKey
                },
                myPrivate,
                {
                    name: 'AES-GCM',
                    length: 256
                },
                false,
                ['encrypt', 'decrypt']
            );
        },
        async encrypt(plain, aesKey) {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const cipherBuf = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv
                },
                aesKey,
                enc.encode(plain)
            );
            const full = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
            full.set(iv, 0);
            full.set(new Uint8Array(cipherBuf), iv.byteLength);
            return btoa(String.fromCharCode(...full));
        },
        async decrypt(b64, aesKey) {
            try {
                const bytes = new Uint8Array(
                    atob(b64).split('').map(c => c.charCodeAt(0))
                );
                const iv = bytes.slice(0, 12);
                const cipher = bytes.slice(12);
                const plainBuf = await crypto.subtle.decrypt(
                    {
                        name: 'AES-GCM',
                        iv
                    },
                    aesKey,
                    cipher
                );
                return dec.decode(plainBuf);
            } catch {
                return null;
            }
        },
        bufToBase64(buf) {
            return btoa(String.fromCharCode(...new Uint8Array(buf)));
        },
        base64ToBuf(b64) {
            return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
        }
    };
})();

function receivePublicKey(messageData) {
    messageData.forEach(keyEntry => {
        if (keyEntry.id && keyEntry.key && keyEntry.id !== myId) {
            processKey(keyEntry.id, keyEntry.key);
        }
    });

    if (!messageData.some(entry => entry.id === myId)) {
        scheduleBroadcast();
    } else {
        clearBroadcastTimers();
    }

    return true;
}

function processKey(ownerId, publicKey) {
    const existingKey = keyRing.get(ownerId);
    const newKeyB64 = TriviaCrypto.base64ToBuf(publicKey);

    let isKeyNew = true;
    if (existingKey) {
        isKeyNew = !compareKeys(existingKey, newKeyB64);
    }

    if (isKeyNew) {
        keyRing.set(ownerId, newKeyB64);
    }
}

function compareKeys(buf1, buf2) {
    if (buf1.byteLength !== buf2.byteLength) return false;

    const dv1 = new Uint8Array(buf1);
    const dv2 = new Uint8Array(buf2);

    for (let i = 0; i < buf1.byteLength; i++) {
        if (dv1[i] !== dv2[i]) return false;
    }
    return true;
}

function clearBroadcastTimers() {
    for (const timerId of keyBroadcastTimers.values()) {
        clearTimeout(timerId);
    }
    keyBroadcastTimers.clear();
}

function scheduleBroadcast() {
    clearBroadcastTimers();

    const allIds = new Set([...keyRing.keys(), myId]);
    const sortedIds = Array.from(allIds).sort();
    const myPosition = sortedIds.indexOf(myId);

    const delay = (myPosition + 1) * 5000;
    console.log(`Plane Broadcast in ${delay/1000} Sekunden (Position: ${myPosition + 1})`);

    const timerId = setTimeout(() => {
        broadcastPublicKey();
    }, delay);

    keyBroadcastTimers.set(myId, timerId);
}

function broadcastPublicKey() {
    if (!tremola.trivia || !tremola.trivia.keys || !tremola.trivia.keys.pub) {
        return;
    }

    clearBroadcastTimers();

    const myPubKey = TriviaCrypto.bufToBase64(tremola.trivia.keys.pub);
    if (!myPubKey) return;

    const allKeys = [{ id: myId, key: myPubKey }];

    for (const [id, keyBuffer] of keyRing.entries()) {
        if (id !== myId) {
            const keyBase64 = TriviaCrypto.bufToBase64(keyBuffer);
            allKeys.push({ id, key: keyBase64 });
        }
    }

    const keyMsg = {
        type: 'trivia-key',
        keys: allKeys,
        timestamp: Date.now()
    };

    backend("customApp:writeEntry trivia " + JSON.stringify(keyMsg));
}

if (!tremola.trivia) {
    tremola.trivia = { active: {}, closed: {} };
}

TriviaCrypto.generateKeyPair().then(keys => {
    tremola.trivia.keys = keys;
    persist();
    setTimeout(() => {
        broadcastPublicKey();
    }, 5000);
});