import assert from "node:assert/strict";
import test from "node:test";
import {
  createSmartFrenchCheckersConversation,
  FrenchChat
} from "../../assets/js/chat/french_chat.js";

function createElement() {
  const listeners = new Map();
  const classes = new Set();
  return {
    children: [],
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      contains: name => classes.has(name)
    },
    listeners,
    addEventListener(name, callback) {
      listeners.set(name, callback);
    },
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
    },
    replaceChildren() {
      this.children = [];
    },
    remove() {
      if (this.parent) {
        this.parent.children = this.parent.children.filter(child => child !== this);
      }
    },
    setAttribute() {},
    focus() {},
    get scrollHeight() {
      return this.children.length;
    }
  };
}

test("the default factory adapts SmartFrenchCheckersBot to the chat contract", () => {
  const conversation = createSmartFrenchCheckersConversation({ name: "Camille" });

  assert.equal(conversation.name, "Camille");
  assert.equal(typeof conversation.start, "function");
  assert.equal(typeof conversation.sendMessage, "function");
  assert.equal(typeof conversation.updateBoardState, "function");
});

test("FrenchChat delegates to an injected conversation and renders its callbacks", () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const elements = {
    toggleButton: createElement(),
    panel: createElement(),
    log: createElement(),
    personaLabel: createElement(),
    form: createElement(),
    input: createElement(),
    sendButton: createElement(),
    center: createElement()
  };
  const documentListeners = new Map();
  globalThis.window = {
    matchMedia: () => ({ matches: false, addEventListener() {} })
  };
  globalThis.document = {
    addEventListener: (name, callback) => documentListeners.set(name, callback),
    createElement,
    getElementById: () => elements.center
  };

  try {
    let conversationOptions;
    let started = 0;
    let sentMessage;
    const chat = new FrenchChat({
      ...elements,
      conversationFactory: options => {
        conversationOptions = options;
        return {
          name: "Camille",
          start() {
            started++;
            options.onMessage({ text: "Salut !" });
          },
          sendMessage(message) {
            sentMessage = message;
            options.onTypingChange(true);
            options.onMessage({ text: "On joue tranquillement." });
          }
        };
      }
    });

    chat.start();

    assert.equal(started, 1);
    assert.equal(conversationOptions.name, "Lucas");
    assert.equal(elements.personaLabel.textContent, "Camille");
    assert.equal(elements.log.children[0].textContent, "Salut !");
    assert.equal(elements.input.disabled, false);

    elements.input.value = "Bonjour";
    elements.form.listeners.get("submit")({ preventDefault() {} });

    assert.equal(sentMessage, "Bonjour");
    assert.deepEqual(
      elements.log.children.map(message => message.textContent),
      ["Salut !", "Bonjour", "On joue tranquillement."]
    );
    assert.equal(elements.log.children.some(message =>
      message.classList && message.classList.contains("chat-thinking")
    ), false);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
