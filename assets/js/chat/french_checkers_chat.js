/**
 * SmartFrenchCheckersBot (v3 - Intent Scoring, Context Memory & Compositional NLG)
 * Zero-dependency, ~18KB pure JS conversational engine for HTML5 Checkers.
 */
class SmartFrenchCheckersBot {
    constructor(options = {}) {
        this.name = options.name || 'Lucas';
        this.onTypingChange = options.onTypingChange || (() => { });
        this.onMessage = options.onMessage || (() => { });

        // Dynamic emotional & psychological state
        this.state = {
            botMood: 'chill',         // 'chill' | 'confident' | 'nervous' | 'tilted'
            playerMorale: 0,          // -10 (very down) to +10 (hyped)
            turnCount: 0,
            consecutivePlayerLosses: this._loadStat('losses', 0),
            gamesPlayed: this._loadStat('games', 0),
            discussedTopics: new Set(),
            lastBotTopic: null,
            lastPlayerEntities: {}
        };

        this.lastMessageTime = 0;
        this.cooldownMs = options.cooldownMs || 7500;
        this.usedSignatures = new Set();
        this.idleTimer = null;
        this.isTyping = false;

        // 1. Weighted Keyword & Stem Dictionary for Intent + Sentiment Scoring
        this.lexicon = {
            greeting: { words: ['salut', 'bonjour', 'coucou', 'hello', 'slt', 'bjr', 'wsh', 'yo', 'hey', 'bonsoir'], weight: 3 },
            weather_bad: { words: ['pluie', 'pleut', 'froid', 'caille', 'gris', 'nuage', 'neige', 'vent', 'orage', 'moche', 'pourri'], weight: 2.5 },
            weather_good: { words: ['soleil', 'chaud', 'beau', 'ciel bleu', 'canicule', 'printemps', 'ete'], weight: 2.5 },
            weather_generic: { words: ['temps', 'meteo', 'dehors', 'saison'], weight: 2 },
            low_morale: { words: ['nul', 'nulle', 'mauvais', 'marre', 'saoule', 'fatigue', 'triste', 'deprime', 'moral', 'galere', 'abandonne', 'impossible', 'dur', 'creve', 'stresse', 'perdu', 'catastrophe'], weight: 3 },
            high_morale: { words: ['super', 'genial', 'top', 'content', 'tranquille', 'pose', 'parfait', 'cool', 'forme', 'chaud'], weight: 2 },
            bot_check: { words: ['bot', 'robot', 'ordi', 'ordinateur', 'fake', 'humain', 'algorithme', 'programme', 'script'], weight: 4 },
            compliment: { words: ['gg', 'bien joue', 'joli', 'beau coup', 'fort', 'pro', 'bravo', 'malin', 'bien vu'], weight: 2.5 },
            luck: { words: ['chance', 'bol', 'chatte', 'veine', 'hasard', 'coup de bol'], weight: 2.5 },
            rematch: { words: ['revanche', 'encore', 'rejouer', 'refaire', 'autre partie'], weight: 3 },
            humor: { words: ['mdr', 'lol', 'ptdr', 'haha', 'xd', 'hihi', 'mort de rire'], weight: 1.5 },
            question: { words: ['pourquoi', 'comment', 'quoi', 'quel', 'quelle', 'ou', 'tu fais', 'tu joues', 'ca va'], weight: 2 }
        };

        // 2. Compositional Blocks (Opener + Core + Closer) for organic sentence generation
        this.blocks = {
            openers: {
                chill: ['', 'haha ', 'ouais ', 'franchement ', 'bah écoute '],
                confident: ['héhé ', 'mdr ', 'tranquille, ', 'écoute ', ''],
                supportive: ['hé ', 'tkt ', 'franchement ', 'courage, ', ''],
                nervous: ['oulà ', 'attends ', 'aïe ', 'pfff ', ''],
                tilted: ['nan mais ', 'pfff ', 'bon ', 'sérieux ', '']
            },
            closers: {
                chill: ['', ' :)', ' mdr', ' haha', ' !'],
                confident: [' ;)', ' mdrrr', ' haha', ' !'],
                supportive: [' :)', ' !', ' tkt', ''],
                nervous: ['...', ' mdr', ' !', ''],
                tilted: ['...', ' mdrrr', '']
            }
        };
    }

    // --- TEXT NORMALIZATION & NLU ENGINE ---

    _normalize(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Strip accents (météo -> meteo)
            .replace(/['’]/g, ' ')
            .trim();
    }

    _analyzeInput(rawText) {
        const clean = this._normalize(rawText);
        const scores = {};
        const matchedWords = [];

        for (const [intent, data] of Object.entries(this.lexicon)) {
            let score = 0;
            for (const word of data.words) {
                if (clean.includes(word)) {
                    score += data.weight;
                    matchedWords.push(word);
                }
            }
            if (score > 0) scores[intent] = score;
        }

        // Check short 2-letter tokens safely (like "ia")
        if (/\bia\b/.test(clean)) scores.bot_check = (scores.bot_check || 0) + 4;
        if (rawText.includes('?')) scores.question = (scores.question || 0) + 1.5;

        // Sort intents from highest score to lowest
        const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        return {
            clean,
            scores,
            topIntent: ranked[0] ? ranked[0][0] : 'fallback',
            secondIntent: ranked[1] ? ranked[1][0] : null,
            matchedWords
        };
    }

    // --- BOARD & PSYCHOLOGICAL STATE TRACKING ---

    updateBoardState(botScore, playerScore) {
        this.state.turnCount++;
        const diff = botScore - playerScore;

        // Adjust psychological morale gradually based on board momentum
        if (diff >= 5) {
            this.state.playerMorale = Math.max(-10, this.state.playerMorale - 2);
        } else if (diff <= -2) {
            this.state.playerMorale = Math.min(10, this.state.playerMorale + 2);
        }

        // Update bot's own emotional state
        if (diff >= 4) this.state.botMood = 'confident';
        else if (diff <= -5) this.state.botMood = 'tilted';
        else if (diff <= -2) this.state.botMood = 'nervous';
        else this.state.botMood = 'chill';
    }

    _getEffectiveTone() {
        // Empathy override: if player is down emotionally or on a losing streak, drop the ego
        if (this.state.playerMorale <= -3 || this.state.consecutivePlayerLosses >= 2) {
            return 'supportive';
        }
        return this.state.botMood;
    }

    // --- GAME EVENT TRIGGERS ---

    triggerEvent(eventName, force = false) {
        this.resetIdleTimer();

        // Context-aware opening: remembers returning players & weaves in weather naturally
        if (eventName === 'start') {
            this.state.gamesPlayed++;
            this._saveStat('games', this.state.gamesPlayed);

            const greeting = this._buildStartGreeting();
            this._sendHumanLike(greeting);

            // 45% chance to follow up with a weather/vibe check after 6 seconds
            if (Math.random() < 0.45 && !this.state.discussedTopics.has('weather')) {
                setTimeout(() => {
                    if (!this.isTyping) this._sendHumanLike(this._buildWeatherPrompt());
                }, 6200);
            }
            return;
        }

        if (eventName === 'botWin') {
            this.state.consecutivePlayerLosses++;
            this._saveStat('losses', this.state.consecutivePlayerLosses);
        } else if (eventName === 'botLose') {
            this.state.consecutivePlayerLosses = 0;
            this._saveStat('losses', 0);
        }

        const now = Date.now();
        const isCritical = ['botWin', 'botLose', 'botMultiCapture', 'playerMultiCapture'].includes(eventName);

        if (!force && !isCritical) {
            if (now - this.lastMessageTime < this.cooldownMs) return;
            if (Math.random() > 0.45) return;
        }

        const reply = this._generateEventLine(eventName);
        if (reply) this._sendHumanLike(reply);
    }

    startPlayerTurnTimer() {
        this.resetIdleTimer();
        this.idleTimer = setTimeout(() => {
            if (Math.random() < 0.7) {
                this.triggerEvent('playerIdle', true);
            }
        }, 22000);
    }

    resetIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    // --- SMART CONVERSATIONAL RESPONSE GENERATOR ---

    receivePlayerMessage(playerText) {
        if (!playerText || !playerText.trim()) return;
        const nlu = this._analyzeInput(playerText);

        // Update psychological model from player's words
        if (nlu.scores.low_morale) {
            this.state.playerMorale = Math.max(-10, this.state.playerMorale - 4);
        } else if (nlu.scores.high_morale || nlu.scores.humor) {
            this.state.playerMorale = Math.min(10, this.state.playerMorale + 2);
        }

        let reply = '';

        // Compound handling: Bad weather + Low morale ("il pleut et j'ai passé une mauvaise journée")
        if (nlu.scores.low_morale && (nlu.scores.weather_bad || nlu.scores.weather_generic)) {
            this.state.discussedTopics.add('weather');
            reply = this._compose('supportive', [
                "avec ce temps gris en plus ça aide pas pour le moral... pose-toi tranquille, on joue sans pression",
                "journée pourrie + météo moche le combo classique mdr, prends cette partie juste pour te vider la tête"
            ]);
        }
        // Pure Low Morale / Discouragement
        else if (nlu.topIntent === 'low_morale') {
            reply = this._compose('supportive', [
                "on a tous des jours sans, te mets pas la pression pour une partie de dames",
                "c'est juste pour se détendre hein, et puis aux dames un seul coup peut tout retourner",
                "respire un coup, tu joues pas si mal c'est juste moi qui ai eu un peu de réussite là",
                "te décourage pas, j'ai l'habitude de faire des grosses boulettes en fin de partie haha"
            ]);
        }
        // Weather Bad
        else if (nlu.topIntent === 'weather_bad') {
            this.state.discussedTopics.add('weather');
            const word = nlu.matchedWords.find(w => ['pluie', 'pleut', 'froid', 'neige', 'vent'].includes(w));
            const hook = word === 'neige' ? "de la neige carrément ?!" : word === 'froid' ? "grave ça caille aujourd'hui," : "ouais un vrai temps à rester au chaud,";
            reply = this._compose(this._getEffectiveTone(), [
                `${hook} au moins on est bien posés devant une partie de dames`,
                `${hook} parfait pour lancer une game tranquille sous le plaid`
            ]);
        }
        // Weather Good
        else if (nlu.topIntent === 'weather_good') {
            this.state.discussedTopics.add('weather');
            reply = this._compose(this._getEffectiveTone(), [
                "la chance ! profite bien, moi je suis coincé à l'intérieur pour l'instant",
                "ça met direct de bonne humeur ce temps, ça donne la pêche pour jouer"
            ]);
        }
        // Generic Weather
        else if (nlu.topIntent === 'weather_generic') {
            this.state.discussedTopics.add('weather');
            reply = this._buildWeatherPrompt();
        }
        // Bot / AI Suspicion
        else if (nlu.topIntent === 'bot_check') {
            reply = this._compose('chill', [
                "non je suis juste dans le bus sur mon tel là",
                "un bot qui rate autant de coups évidents ? merci du compliment",
                "tkt je suis bien humain, j'ai juste le cerveau un peu lent aujourd'hui"
            ]);
        }
        // Greetings (Contextualized if they already started playing)
        else if (nlu.topIntent === 'greeting') {
            reply = this.state.turnCount > 3
                ? this._compose('chill', ["re-salut ! concentré sur le plateau ?", "yo ! désolé j'étais à fond dans mon coup"])
                : this._compose('chill', ["salut ! prêt ? bonne game", "yo ! à toi de jouer"]);
        }
        // Compliments
        else if (nlu.topIntent === 'compliment') {
            reply = this._getEffectiveTone() === 'tilted'
                ? "merci mais bon j'ai quand même fait n'importe quoi avant mdr"
                : this._compose(this._getEffectiveTone(), ["merci ! toi aussi tu gères bien", "coup de chance j'avoue mais je prends"]);
        }
        // Luck
        else if (nlu.topIntent === 'luck') {
            reply = this._compose(this._getEffectiveTone(), [
                "c'est du talent pur pas de la chance",
                "j'avoue j'ai eu un gros coup de bol sur celle-là"
            ]);
        }
        // Rematch
        else if (nlu.topIntent === 'rematch') {
            reply = this._compose('chill', ["carrément, relance quand tu veux !", "avec plaisir, je suis chaud pour une autre"]);
        }
        // Questions (Context-aware based on last topic)
        else if (nlu.topIntent === 'question') {
            if (this.state.lastBotTopic === 'weather') {
                reply = this._compose('chill', ["chez moi il fait tout gris et un peu frais, et toi ?", "plutôt nuageux par ici, rien de fou"]);
            } else {
                reply = this._compose(this._getEffectiveTone(), [
                    "bonne question, je joue surtout au feeling aujourd'hui",
                    "attends je regarde mes pions en même temps je suis perdu haha"
                ]);
            }
        }
        // Intelligent Fallback using current emotional state
        else {
            const tone = this._getEffectiveTone();
            const fallbacks = {
                chill: ["carrément", "je vois ce que tu veux dire", "grave"],
                confident: ["on verra ça à la fin de la partie", "gère déjà tes pions avant de discuter"],
                supportive: ["on joue tranquille, prends ton temps", "tkt pas de pression"],
                nervous: ["attends me déconcentre pas je suis en danger là", "laisse-moi réfléchir 2 secondes"],
                tilted: ["ouais...", "parle pas trop vite j'essaie de sauver les meubles"]
            };
            reply = this._compose(tone, fallbacks[tone]);
        }
        this._sendHumanLike(reply);
    }
    // --- COMPOSITIONAL SENTENCE BUILDERS ---
    _compose(tone, coreList) {
        const core = this._pickUnique(coreList);
        const openers = this.blocks.openers[tone] || this.blocks.openers.chill;
        const closers = this.blocks.closers[tone] || this.blocks.closers.chill;
        // 50% chance to add an opener, 60% chance to add a closer (keeps variety high without overdoing it)
        const opener = Math.random() < 0.5 ? openers[Math.floor(Math.random() * openers.length)] : '';
        const closer = Math.random() < 0.6 ? closers[Math.floor(Math.random() * closers.length)] : '';
        return `${opener}${core}${closer}`.trim();
    }
    _buildStartGreeting() {
        const hour = new Date().getHours();
        const timeGreeting = hour >= 18 ? 'bonsoir' : 'salut';
        if (this.state.consecutivePlayerLosses >= 2) {
            return timeGreeting != "prêt pour la revanche" ? "cette fois c'est la bonne :);" : timeGreeting;
        }
        if (this.state.gamesPlayed > 1) {
            return timeGreeting != "content de te recroiser" ? "content de te recroiser, bonne partie;" : timeGreeting;
        }
        return this._compose('chill', [
            timeGreeting != "bonne partie" ? "bonne partie," : timeGreeting,
            "yo, prêt ? à toi de jouer",
            timeGreeting != "on se fait une petite partie tranquille" ? "on se fait une petite partie tranquille" : timeGreeting
        ]);
    }
    _buildWeatherPrompt() {
        this.state.lastBotTopic = 'weather';
        this.state.discussedTopics.add('weather');
        return this._compose('chill', [
            "il fait un temps gris chez moi aujourd'hui, parfait pour jouer au chaud. il fait beau chez toi ?",
            "ça caille un peu dehors aujourd'hui nan ? rien de mieux qu'une petite partie tranquille",
            "j'espère qu'il pleut pas chez toi comme ici mdr"
        ]);
    }
    _generateEventLine(eventName) {
        const tone = this._getEffectiveTone();
        const bank = {
            botCapture: {
                chill: ["hop, un de moins", "je prends celui-là merci"],
                confident: ["et un pion en moins", "t'as laissé traîner celui-là"],
                supportive: ["j'ai pris celui-là mais rien n'est joué encore", "accroche-toi, une bonne rafle et tu reviens"],
                nervous: ["ouf, j'avais vraiment besoin de celui-là", "ok je respire un peu"],
                tilted: ["enfin j'en prends un", "bon au moins j'ai ça"]
            },
            botMultiCapture: {
                chill: ["oh la belle rafle", "boom, j'ai tout ramassé là"],
                confident: ["t'as pas vu la rafle venir ?", "le carnage sur le plateau"],
                supportive: ["oups désolé pour la rafle... mais lâche rien c'est pas fini", "j'ai eu un gros coup de bol là, te décourage pas"],
                nervous: ["le coup de bol qui me sauve !", "ok là je reviens dans la partie"],
                tilted: ["enfin un vrai coup", "pas encore mort hein"]
            },
            playerCapture: {
                chill: ["bien vu", "ah mince j'avais pas fait gaffe"],
                confident: ["cadeau, je t'en laisse un pour le suspense", "bien joué mais j'ai encore de l'avance"],
                supportive: ["ah voilà ! super bien vu ça", "et boom, tu vois que t'as encore de beaux coups"],
                nervous: ["aïe ça commence à piquer", "oulà je fais n'importe quoi"],
                tilted: ["n'importe quoi mon coup d'avant", "j'ai cliqué trop vite"]
            },
            playerMultiCapture: {
                chill: ["ah ouais carrément, bien joué", "j'ai ouvert toute la porte là"],
                confident: ["j'avoue j'avais zéro anticipé ça", "j'ai pris la confiance trop vite"],
                supportive: ["énorme !! magnifique remontée, j'avais rien vu venir", "et voilà le réveil ! trop bien joué"],
                nervous: ["non mais le massacre...", "je suis dans la sauce là"],
                tilted: ["je joue les yeux fermés aujourd'hui", "ok t'as gagné là c'est bon"]
            },
            botKing: {
                chill: ["et hop, une dame", "je suis à dame"],
                confident: ["la dame est là, ça va devenir compliqué pour toi", "et voilà le travail, dame"],
                supportive: ["j'ai ma dame mais t'as encore de quoi bloquer, lâche rien", "bon j'ai une dame mais rien n'est joué"],
                nervous: ["enfin une dame ! je suis encore vivant"],
                tilted: ["bon j'ai une dame mais vu mes pions..."]
            },
            playerKing: {
                chill: ["bien joué pour la dame", "j'ai pas pu te bloquer"],
                confident: ["bon ok t'as une dame, ça change rien"],
                supportive: ["yes !! bravo pour la dame, ça relance tout", "super bien joué pour ta dame"],
                nervous: ["oh non pas une dame..."],
                tilted: ["et vas-y une dame en plus..."]
            },
            playerIdle: {
                chill: ["t'endors pas hein", "tu calcules 10 coups à l'avance là ?"],
                confident: ["cherche pas y'a pas de solution", "prends ton temps, je contrôle"],
                supportive: ["prends ton temps, pas de pression", "réfléchis tranquille, on joue pour se détendre"],
                nervous: ["me fais pas stresser comme ça joue !"],
                tilted: ["achève-moi vite stp"]
            },
            botWin: {
                chill: ["gg ! bonne partie, revanche ?", "bien joué, c'était serré"],
                confident: ["gg ! trop facile aujourd'hui, revanche ?"],
                supportive: ["gg ! merci pour la partie, tu t'es bien battu jusqu'au bout", "bien joué ! si tu veux une revanche pour te refaire je suis chaud"],
                nervous: ["ouf j'ai eu chaud !! gg à toi"],
                tilted: ["j'ai gagné je sais même pas comment, gg"]
            },
            botLose: {
                chill: ["gg ! tu m'as bien eu, revanche ?"],
                confident: ["ok j'ai trop pris la confiance, gg"],
                supportive: ["et voilà ! je t'avais dit de rien lâcher, énorme gg", "super remontée, franchement bravo"],
                nervous: ["gg, tu mérites largement"],
                tilted: ["gg, j'ai vraiment joué comme un pied"]
            }
        };
        const pool = bank[eventName]?.[tone] || bank[eventName]?.chill;
        return pool ? this._compose(tone, pool) : null;
    }
    // --- UTILITIES & STORAGE ---
    _pickUnique(list) {
        const unused = list.filter(item => !this.usedSignatures.has(item));
        const source = unused.length > 0 ? unused : list;
        if (unused.length === 0) list.forEach(item => this.usedSignatures.delete(item));
        const chosen = source[Math.floor(Math.random() * source.length)];
        this.usedSignatures.add(chosen);
        return chosen;
    }
    _loadStat(key, fallback) {
        try {
            const val = localStorage.getItem(`checkers_bot_${key}`);
            return val !== null ? parseInt(val, 10) : fallback;
        } catch {
            return fallback;
        }
    }
    _saveStat(key, val) {
        try {
            localStorage.setItem(`checkers_bot_${key}`, String(val));
        } catch { /* ignore private mode errors */ }
    }
    _sendHumanLike(text) {
        if (!text || this.isTyping) return;
        this.isTyping = true;
        this.lastMessageTime = Date.now();
        const readDelay = 950 + Math.random() * 1400;
        setTimeout(() => {
            this.onTypingChange(true, this.name);
            const typeDuration = Math.min(3400, Math.max(850, text.length * 42 + Math.random() * 450));
            setTimeout(() => {
                this.onTypingChange(false, this.name);
                this.isTyping = false;
                this.onMessage({
                    sender: this.name,
                    text,
                    tone: this._getEffectiveTone(),
                    timestamp: Date.now()
                });
            }, typeDuration);
        }, readDelay);
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartFrenchCheckersBot;
} else if (typeof window !== 'undefined') {
    window.SmartFrenchCheckersBot = SmartFrenchCheckersBot;
}

export default SmartFrenchCheckersBot;