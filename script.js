// script.js - self-correction version with "Download Results"
let allWords = [];
let selectedWords = [];
let resultsForDownload = []; // will hold objects {word, studentAns, correctChinese}

// Load words from JSON
async function loadWords() {
  const response = await fetch("word_bank.json");
  if (!response.ok) throw new Error("Failed to load word_bank.json");
  const data = await response.json();
  if (!Array.isArray(data.words)) throw new Error("word_bank.json must contain {\"words\": [ ... ]}");
  allWords = data.words;
}

// Randomly pick up to 25 words
function pickRandom25(words) {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(25, shuffled.length));
}

// Build test UI
document.getElementById("startBtn").addEventListener("click", async () => {
  try {
    document.getElementById("startBtn").disabled = true;
    await loadWords();
  } catch (err) {
    alert("Failed to load word_bank.json. Check repository and filenames.\nSee console for details.");
    console.error(err);
    document.getElementById("startBtn").disabled = false;
    return;
  }

  selectedWords = pickRandom25(allWords);
  resultsForDownload = [];

  const testArea = document.getElementById("testArea");
  testArea.innerHTML = "";

  selectedWords.forEach((obj, i) => {
    const row = document.createElement("div");
    row.className = "word-row";
    row.innerHTML = `
      <b>${i + 1}. ${obj.word}</b>
      <input type="text" id="answer-${i}" placeholder="輸入中文意思">
    `;
    testArea.appendChild(row);
  });

  testArea.classList.remove("hidden");
  document.getElementById("submitBtn").classList.remove("hidden");
  document.getElementById("downloadBtn").classList.add("hidden");
  document.getElementById("resultTitle").classList.add("hidden");
  document.getElementById("results").innerHTML = "";
  document.getElementById("startBtn").disabled = false;
});

// On submit: fetch Google Translate meanings
document.getElementById("submitBtn").addEventListener("click", async () => {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  document.getElementById("resultTitle").classList.remove("hidden");

  for (let i = 0; i < selectedWords.length; i++) {
    const word = selectedWords[i].word;
    const studentAns = document.getElementById(`answer-${i}`).value.trim();

    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=" +
      encodeURIComponent(word);

    let correctChinese = "（翻譯失敗）";
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Translate fetch failed");
      const data = await resp.json();
      if (Array.isArray(data) && data[0] && data[0][0] && data[0][0][0]) {
        correctChinese = data[0][0][0];
      } else {
        correctChinese = "（無結果）";
      }
    } catch (e) {
      console.error("Translation error for", word, e);
    }

    resultsForDownload.push({
      word: word,
      studentAns: studentAns || "（空白）",
      correctChinese
    });

    const row = document.createElement("div");
    row.innerHTML = `
      <p>
        <b>${word}</b><br>
        ➜ 你的答案：<span style="color:blue">${studentAns || "（空白）"}</span><br>
        ➜ 參考中文：<span style="color:green">${correctChinese}</span>
      </p>
      <hr>
    `;
    resultsDiv.appendChild(row);
  }

  document.getElementById("downloadBtn").classList.remove("hidden");
});

// Download results as plaintext
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!resultsForDownload.length) {
    alert("No results to download. Please run a test and press Show Correct Answers first.");
    return;
  }

  let text = `Vocabulary Test Results\nGenerated: ${new Date().toLocaleString()}\n\n`;
  resultsForDownload.forEach((r, idx) => {
    text += `${idx + 1}. ${r.word}\nYour answer: ${r.studentAns}\nReference (Google): ${r.correctChinese}\n\n`;
  });

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vocab_results.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
