let selectedMode = "reading";
let selectedCount = 30;

let session = { mode: null, deck: [], index: 0, revealed: false, wrong: [] };

const modeToggle = document.getElementById("mode-toggle");
const countToggle = document.getElementById("count-toggle");
const startBtn = document.getElementById("start-btn");

const progressEl = document.getElementById("progress");
const promptEl = document.getElementById("prompt");
const answerEl = document.getElementById("answer");
const revealRow = document.getElementById("reveal-row");
const gradeRow = document.getElementById("grade-row");
const revealBtn = document.getElementById("reveal-btn");
const correctBtn = document.getElementById("correct-btn");
const incorrectBtn = document.getElementById("incorrect-btn");

const resultsHeadline = document.getElementById("results-headline");
const resultsWrongList = document.getElementById("results-wrong-list");
const retryBtn = document.getElementById("retry-btn");
const backBtn = document.getElementById("back-btn");

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatReadingList(card) {
  const parts = [];
  if (card.on.length) parts.push(`音: ${card.on.join("・")}`);
  if (card.kun.length) parts.push(`訓: ${card.kun.join("・")}`);
  return `<div class="reading-list">${parts.join("<br>")}</div>`;
}

function highlightTargetInYomi(card) {
  const reiTokens = card.rei.split(" ");
  const yomiTokens = card.reiYomi.split(" ");
  const idx = reiTokens.findIndex((t) => t.includes(card.kanji));
  if (idx === -1) return card.reiYomi;
  return yomiTokens.map((t, i) => (i === idx ? `<span class="target-word">${t}</span>` : t)).join(" ");
}

function highlightTargetInRei(card) {
  return card.rei.replace(card.kanji, `<span class="target-word">${card.kanji}</span>`);
}

function showScreen(name) {
  document.body.dataset.screen = name;
}

function setupToggleGroup(container, onSelect) {
  container.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      onSelect(btn.dataset.value);
    });
  });
}

setupToggleGroup(modeToggle, (value) => {
  selectedMode = value;
});

setupToggleGroup(countToggle, (value) => {
  selectedCount = parseInt(value, 10);
});

function startSession() {
  const deck = shuffle([...KANJI_DATA]).slice(0, selectedCount);
  session = { mode: selectedMode, deck, index: 0, revealed: false, wrong: [] };
  showScreen("card");
  renderCard();
}

startBtn.addEventListener("click", startSession);

function renderCard() {
  const card = session.deck[session.index];
  progressEl.textContent = `${session.index + 1} / ${session.deck.length}`;

  if (session.mode === "reading") {
    promptEl.textContent = card.kanji;
    answerEl.innerHTML = session.revealed ? formatReadingList(card) : "";
  } else {
    promptEl.innerHTML = `<div class="reading-hint">${highlightTargetInYomi(card)}</div>`;
    answerEl.innerHTML = session.revealed
      ? `<div class="kanji-answer">${card.kanji}</div><div class="example-sentence">${highlightTargetInRei(card)}</div>`
      : "";
  }

  revealRow.style.display = session.revealed ? "none" : "flex";
  gradeRow.style.display = session.revealed ? "flex" : "none";
}

function revealAnswer() {
  if (session.revealed) return;
  session.revealed = true;
  renderCard();
}

revealBtn.addEventListener("click", revealAnswer);

function gradeCard(isCorrect) {
  if (!session.revealed) return;
  if (!isCorrect) session.wrong.push(session.deck[session.index]);
  session.index++;
  session.revealed = false;
  if (session.index >= session.deck.length) {
    showResults();
  } else {
    renderCard();
  }
}

correctBtn.addEventListener("click", () => gradeCard(true));
incorrectBtn.addEventListener("click", () => gradeCard(false));

function showResults() {
  const total = session.deck.length;
  const wrongCount = session.wrong.length;
  const correctCount = total - wrongCount;

  resultsHeadline.textContent =
    wrongCount === 0
      ? `${total}問中 ${correctCount}問正解！ 全問正解！`
      : `${total}問中 ${correctCount}問正解`;

  resultsWrongList.innerHTML = "";
  session.wrong.forEach((card) => {
    const chip = document.createElement("div");
    chip.className = "wrong-chip";
    chip.textContent = card.kanji;
    resultsWrongList.appendChild(chip);
  });

  retryBtn.style.display = wrongCount === 0 ? "none" : "inline-block";
  showScreen("results");
}

retryBtn.addEventListener("click", () => {
  const deck = shuffle([...session.wrong]);
  session = { mode: session.mode, deck, index: 0, revealed: false, wrong: [] };
  showScreen("card");
  renderCard();
});

backBtn.addEventListener("click", () => {
  showScreen("setup");
});

document.addEventListener("keydown", (e) => {
  if (document.body.dataset.screen !== "card") return;
  if (!session.revealed) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      revealAnswer();
    }
  } else {
    if (e.key === "1") gradeCard(true);
    else if (e.key === "0") gradeCard(false);
  }
});
