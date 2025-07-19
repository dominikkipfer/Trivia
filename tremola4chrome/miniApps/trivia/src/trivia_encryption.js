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

async function initializeTrivia() {
    if (!tremola.trivia) {
        tremola.trivia = {
            active: {},
            closed: {}
        };
    }
    if (!tremola.trivia.keys) {
        tremola.trivia.keys = await TriviaCrypto.generateKeyPair();
        persist();
        broadcastPublicKey();
    }
}

function broadcastPublicKey() {
    const keyMsg = {
        type: 'trivia-key',
        from: myId,
        pub: TriviaCrypto.bufToBase64(tremola.trivia.keys.pub)
    };
    writeLogEntry(JSON.stringify(keyMsg));
}