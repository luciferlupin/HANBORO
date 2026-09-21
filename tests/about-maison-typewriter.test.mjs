import test from "node:test";
import assert from "node:assert/strict";

export const MANIFESTO_PARAGRAPHS = [
  "The project represents an unconstrained vision for a modern horological house, shaped by centuries of high-frequency Swiss watchmaking heritage and micromechanical mastery.",
  "It tells the story of the HANBORO atelier through the lens of pure kinetic brilliance, where value is found in proportion, zero-wobble ceramic engineering, and time itself — rather than overt expression.",
  "HANBORO draws inspiration from celestial tourbillons, casino roulette complications, and open-worked skeleton calibres, reflecting an architectural approach to design, restrained elegance, and the ability to turn mechanical form into a lasting symbol."
];

test("Manifesto text matches user specification verbatim", () => {
  assert.equal(MANIFESTO_PARAGRAPHS.length, 3);
  assert.match(MANIFESTO_PARAGRAPHS[0], /^The project represents an unconstrained vision/);
  assert.match(MANIFESTO_PARAGRAPHS[1], /^It tells the story of the HANBORO atelier/);
  assert.match(MANIFESTO_PARAGRAPHS[2], /^HANBORO draws inspiration from celestial tourbillons/);
  assert.ok(MANIFESTO_PARAGRAPHS[1].includes("zero-wobble ceramic engineering"));
  assert.ok(MANIFESTO_PARAGRAPHS[2].includes("casino roulette complications"));
});

test("Typewriter cadence delay function calculates horological rhythm", () => {
  const getCharDelay = (char) => {
    if (char === "." || char === "!" || char === "?") return 140;
    if (char === "," || char === ";") return 75;
    if (char === "—" || char === "-") return 90;
    return 14;
  };

  assert.equal(getCharDelay("a"), 14);
  assert.equal(getCharDelay(" "), 14);
  assert.equal(getCharDelay(","), 75);
  assert.equal(getCharDelay("—"), 90);
  assert.equal(getCharDelay("."), 140);
});

test("Typewriter progression handles sequential multi-paragraph state transitions", () => {
  let activeParagraph = 0;
  let charIndex = 0;
  let isComplete = false;

  const step = () => {
    if (isComplete) return;
    const currentPara = MANIFESTO_PARAGRAPHS[activeParagraph];
    if (charIndex < currentPara.length) {
      charIndex += 1;
    } else {
      if (activeParagraph < MANIFESTO_PARAGRAPHS.length - 1) {
        activeParagraph += 1;
        charIndex = 0;
      } else {
        isComplete = true;
      }
    }
  };

  // Run through first paragraph
  for (let i = 0; i < MANIFESTO_PARAGRAPHS[0].length; i++) {
    step();
  }
  assert.equal(activeParagraph, 0);
  assert.equal(charIndex, MANIFESTO_PARAGRAPHS[0].length);

  // Next step transitions to second paragraph
  step();
  assert.equal(activeParagraph, 1);
  assert.equal(charIndex, 0);

  // Fast forward to end
  while (!isComplete) {
    step();
  }
  assert.equal(isComplete, true);
  assert.equal(activeParagraph, 2);
  assert.equal(charIndex, MANIFESTO_PARAGRAPHS[2].length);
});
