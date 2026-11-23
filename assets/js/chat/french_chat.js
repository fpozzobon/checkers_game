export const FRENCH_PERSONAS = Object.freeze([
  Object.freeze({ name: "Camille", nationality: "Belgique" }),
  Object.freeze({ name: "Alex", nationality: "Canada" }),
  Object.freeze({ name: "Aïssatou", nationality: "Sénégal" }),
  Object.freeze({ name: "Léa", nationality: "Suisse" }),
  Object.freeze({ name: "Noé", nationality: "France" })
]);

export const FRENCH_CONVERSATION_TREE = Object.freeze([
  Object.freeze({
    intent: "greeting",
    keywords: ["bonjour", "salut", "coucou", "hello", "bonsoir"],
    replies: ["Salut ! Prêt à jouer ? Je garde un œil sur les prises.", "Bonjour ! La partie commence, à toi de jouer."]
  }),
  Object.freeze({
    intent: "praise",
    keywords: ["bien joue", "bravo", "super", "joli coup", "merci"],
    replies: [
      context => context.result === "win"
        ? "Merci ! Tu as très bien joué et tu as remporté la partie."
        : context.playerCaptures > context.computerCaptures
          ? "Merci ! Tes prises te donnent l'avantage, continue comme ça."
          : context.computerCaptures > context.playerCaptures
            ? "Merci ! La partie reste ouverte, le prochain coup peut tout changer."
            : "Merci ! Tu joues avec attention, chaque coup compte."
    ]
  }),
  Object.freeze({
    intent: "capture",
    keywords: ["prise", "prendre", "capture", "mange"],
    replies: [
      context => context.playerCaptures > 0
        ? `Tu as déjà réalisé ${context.playerCaptures} prise${context.playerCaptures > 1 ? "s" : ""}. Pense à vérifier les prises obligatoires.`
        : "Les prises sont obligatoires quand elles sont possibles. Cherche bien les diagonales !"
    ]
  }),
  Object.freeze({
    intent: "strategy",
    keywords: ["conseil", "strategie", "astuce", "aide", "que faire"],
    replies: [
      context => context.moves > 12
        ? "Protège tes pions isolés et prépare une prise sans offrir la suivante."
        : "Essaie de garder tes pions groupés et surveille les prises obligatoires."
    ]
  }),
  Object.freeze({
    intent: "rules",
    keywords: ["regle", "dame", "roi", "comment jouer"],
    replies: ["Un pion qui atteint la dernière rangée devient une dame. Les prises sont obligatoires."]
  }),
  Object.freeze({
    intent: "encouragement",
    keywords: ["dur", "difficile", "perdu", "dommage", "triste"],
    replies: [
      context => context.result === "loss"
        ? "La partie est terminée, mais tu peux repartir sur une nouvelle stratégie. Bien joué d'être allé jusqu'au bout !"
        : "Rien n'est joué ! Prends ton temps et cherche les coups qui protègent tes pions."
    ]
  }),
  Object.freeze({
    intent: "farewell",
    keywords: ["au revoir", "a bientot", "a plus", "bye"],
    replies: ["À bientôt pour une nouvelle partie !"]
  }),
  Object.freeze({
    intent: "default",
    keywords: [],
    replies: [
      context => context.computerCaptures > context.playerCaptures
        ? "La partie est serrée. Tu veux parler stratégie, prises ou règles ?"
        : "Je t'écoute ! On peut parler de stratégie, de prises ou des règles."
    ]
  })
]);

const normalize = value =>
  value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function chooseFrenchPersona(random = Math.random) {
  return FRENCH_PERSONAS[Math.floor(random() * FRENCH_PERSONAS.length)];
}

export function getFrenchReply(message, context = {}, random = Math.random) {
  const normalizedMessage = normalize(message);
  const node = FRENCH_CONVERSATION_TREE.find(
    candidate =>
      candidate.intent === "default" ||
      candidate.keywords.some(keyword => normalizedMessage.includes(keyword))
  );
  const replies = node.replies;
  const reply = replies[Math.floor(random() * replies.length)];
  return typeof reply === "function" ? reply(context) : reply;
}

export class FrenchChat {
  constructor({
    toggleButton,
    panel,
    log,
    personaLabel,
    form,
    input,
    sendButton,
    getContext
  }) {
    this.toggleButton = toggleButton;
    this.panel = panel;
    this.log = log;
    this.personaLabel = personaLabel;
    this.form = form;
    this.input = input;
    this.sendButton = sendButton;
    this.getContext = getContext;
    this.persona = null;
    this.playerCaptures = 0;
    this.computerCaptures = 0;
    this.result = null;
    this.active = false;
    this.pending = false;
    this.compactScreen = window.matchMedia(
      "(max-width: 900px), (max-height: 720px)"
    );

    this.toggleButton.addEventListener("click", () => this.toggle());
    this.form.addEventListener("submit", event => {
      event.preventDefault();
      this.send();
    });
    document.addEventListener("checkers:move", event => this.recordMove(event.detail));
    document.addEventListener("checkers:gameover", event => {
      this.result =
        event.detail.winner === window.checkersBoard.playerColor.slice(6)
          ? "win"
          : "loss";
    });
    this.compactScreen.addEventListener("change", () => {
      if (this.active) this.setOpen(!this.compactScreen.matches);
    });
  }

  start() {
    this.active = true;
    document.getElementById("center").classList.add("chat-active");
    this.pending = false;
    this.playerCaptures = 0;
    this.computerCaptures = 0;
    this.result = null;
    this.persona = chooseFrenchPersona();
    this.personaLabel.textContent = `${this.persona.name} · ${this.persona.nationality}`;
    this.log.replaceChildren();
    this.toggleButton.hidden = false;
    this.setOpen(!this.compactScreen.matches);
    this.input.disabled = true;
    this.scheduleReply(`Salut ! Je m'appelle ${this.persona.name}. Bonne partie, et que le meilleur gagne !`);
  }

  toggle() {
    if (!this.active) return;
    this.setOpen(this.panel.hidden);
  }

  setOpen(open) {
    this.panel.hidden = !open;
    this.toggleButton.setAttribute("aria-expanded", String(open));
    this.toggleButton.setAttribute(
      "aria-label",
      open ? "Masquer la conversation" : "Afficher la conversation"
    );
    if (open && !this.pending) this.input.focus();
  }

  recordMove(move) {
    if (!this.active) return;
    const playerColor = window.checkersBoard.playerColor.slice(6);
    if (move.mover === playerColor) {
      this.playerCaptures += move.captures.length;
    } else {
      this.computerCaptures += move.captures.length;
    }
  }

  send() {
    const message = this.input.value.trim();
    if (!message || this.pending) return;
    this.appendMessage(message, "player");
    this.input.value = "";
    this.input.disabled = true;
    this.sendButton.disabled = true;
    this.scheduleReply(getFrenchReply(message, this.getContext()));
  }

  scheduleReply(reply) {
    this.pending = true;
    this.input.disabled = true;
    this.sendButton.disabled = true;
    const thinking = this.appendMessage("Je réfléchis…", "thinking");
    const delay = 700 + Math.floor(Math.random() * 1101);
    window.setTimeout(() => {
      thinking.remove();
      this.appendMessage(reply, "computer");
      this.pending = false;
      this.input.disabled = false;
      this.sendButton.disabled = false;
      if (!this.panel.hidden) this.input.focus();
    }, delay);
  }

  appendMessage(message, author) {
    const element = document.createElement("div");
    element.className = `chat-message chat-message-${author}`;
    element.textContent = message;
    this.log.appendChild(element);
    this.log.scrollTop = this.log.scrollHeight;
    return element;
  }
}
