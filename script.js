// script.js - PRINT-TO-PDF version (Chinese safe)
let allWords = [];
let selectedWords = [];
let resultsForDownload = [];

// Load words
async function loadWords() {
  const response = await fetch("word_bank.json");
  const data = await response.json();
  allWords = data.words;
}

// Pick up to 25 words
function pickRandom25(words) {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(25, shuffled.length));
}

// Start test
document.getElementById("startBtn").addEventListener("click", async () => {
  await loadWords();
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
  document.getElementById("results").innerHTML = "";
  document.getElementById("resultTitle").classList.add("hidden");
});

// Show correct answers
document.getElementById("submitBtn").addEventListener("click", async () => {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  document.getElementById("resultTitle").classList.remove("hidden");

  for (let i = 0; i < selectedWords.length; i++) {
    const word = selectedWords[i].word;
    const studentAns = document.getElementById(`answer-${i}`).value.trim();

    let correctChinese = "（翻譯失敗）";

    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=" +
        encodeURIComponent(word);
      const resp = await fetch(url);
      const data = await resp.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        correctChinese = data[0][0][0];
      }
    } catch (e) {}

    resultsForDownload.push({
      word,
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

// Download PDF via browser print (Chinese-safe)
document.getElementById("downloadBtn").addEventListener("click", () => {
  const win = window.open("", "_blank");

  let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Vocabulary Test Results</title>
      <style>
        body { font-family: serif; padding: 30px; }
        h1 { text-align: center; }
        p { margin: 12px 0; }
        hr { border: none; border-top: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <h1>Vocabulary Test Results</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <hr>
  `;

  resultsForDownload.forEach((r, i) => {
    html += `
      <p>
        <b>${i + 1}. ${r.word}</b><br>
        你的答案：${r.studentAns}<br>
        參考中文：${r.correctChinese}
      </p>
      <hr>
    `;
  });

  html += `
    </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
});
