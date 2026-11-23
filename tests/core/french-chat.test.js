import assert from "node:assert/strict";
import test from "node:test";
import {
  chooseFrenchPersona,
  FRENCH_PERSONAS,
  getFrenchReply
} from "../../assets/js/chat/french_chat.js";

test("French chat recognizes accented keywords and adapts praise to the game", () => {
  assert.match(
    getFrenchReply("Bien joué !", { playerCaptures: 2, computerCaptures: 0 }, () => 0),
    /prises te donnent l'avantage/
  );
  assert.match(
    getFrenchReply("Bravo", { result: "win" }, () => 0),
    /remporté la partie/
  );
});

test("French chat chooses a persona without exposing a player selection", () => {
  assert.equal(chooseFrenchPersona(() => 0), FRENCH_PERSONAS[0]);
  assert.equal(
    chooseFrenchPersona(() => 0.99),
    FRENCH_PERSONAS[FRENCH_PERSONAS.length - 1]
  );
  assert.match(getFrenchReply("mot inconnu", {}, () => 0), /Je t'écoute/);
});
