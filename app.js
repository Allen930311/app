//*************************************************
 *  記帳管家 BlackGold Edition — FINAL app.js
 *************************************************/

const API =
  "https://script.google.com/macros/s/AKfycbxbOJKAuODxSp4T-IX5y4B5MKU5MOv03QgkcZWnAn6x0FjrWUK5CH29X2Jg5Oges3mi/exec";

let currentCategory = "FOOD";
let amount = "";

// DOM
const amountDisplay = document.getElementById("amountDisplay");
const recordList = document.getElementById("recordList");
const alertArea = document.getElementById("alertArea");
const coachAdvice = document.getElementById("coachAdvice");
const progressBar = document.getElementById("progressBar");

// 圖表實例（避免重複生成）
let pieChart = null;
let lineChart = null;

/*************************************************
 *  Smart Ticker（分類按鈕）
 *************************************************/
const categories = ["FOOD", "CAFE", "TRPT", "SHOP", "PLAY", "LIFE", "SUBS"];
const smartTicker = document.getElementById("smartTicker");

categories.forEach((cat) => {
  const btn = document.createElement("button");
  btn.className = "ticker-btn";
  btn.innerText = cat;
  btn.onclick = () => (currentCategory = cat);
  smartTicker.appendChild(btn);
});

/*************************************************
 *  從 API 載入 Dashboard 資料
 *************************************************/
async function loadDashboard() {
  const res = await fetch(API);
  const data = await res.json();

  // 儀表板文字
  document.getElementById("monthSpent").innerText =
    `${data.monthSpent} / ${data.conf["monthly_budget"]}`;

  document.getElementById("savingEstimate").innerText =
    `預估可存：${data.estimateSaving}`;

  document.getElementById("dailyLimit").innerText =
    `今日可花：${data.dailyLimit}`;

  // 進度條
  const percent = (data.monthSpent / data.conf["monthly_budget"]) * 100 || 0;
  progressBar.style.width = `${Math.min(percent, 100)}%`;

  // 警告、教練、紀錄
  renderAlerts(data);
  renderCoach(data);
  renderRecords(data.records);

  // 圖表
  drawPieChart(data.chartByCategory);
  drawLineChart(data.chart7days);

  // 月結存錢環形圖
  drawSavingCircle(data.estimateSaving, data.conf["saving_target"]);
}

loadDashboard();

/*************************************************
 *  理財教練（本地 AI）
 *************************************************/
function renderCoach(data) {
  const list = [];

  // 食物費偏高？
  const food = data.chartByCategory["FOOD"] || 0;
  const foodLimit = (data.conf["monthly_budget"] * 0.25) / 4;
  if (food > foodLimit) list.push("⚠️ 食物費偏高，建議這週外食減少 15%。");

  // 娛樂費偏高？
  const play = data.chartByCategory["PLAY"] || 0;
  const playLimit = data.conf["monthly_budget"] * 0.1;
  if (play > playLimit) list.push("🎮 娛樂費逼近上限，建議先避免大額消費。");

  // 存錢進度
  if (data.estimateSaving < data.conf["saving_target"]) {
    list.push("📉 本月存款進度落後，建議降低非必要消費。");
  } else {
    list.push("🟢 本月儲蓄正常，維持目前習慣即可！");
  }

  coachAdvice.innerHTML = list.join("<br>");
}

/*************************************************
 *  警告卡片
 *************************************************/
function renderAlerts(data) {
  alertArea.innerHTML = "";

  if (data.estimateSaving < data.conf["saving_target"]) {
    alertArea.innerHTML += `
      <div class="card">
        ⚠️ 儲蓄金額不足（${data.estimateSaving} / ${data.conf["saving_target"]}）
      </div>`;
  }
}

/*************************************************
 *  記帳（POST）
 *************************************************/
async function saveRecord() {
  if (amount === "") return;

  await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "add",
      category: currentCategory,
      amount: amount,
      device: "mobile",
    }),
  });

  amount = "";
  amountDisplay.textContent = "0";

  loadDashboard();
}

document.getElementById("save").onclick = saveRecord;

/*************************************************
 *  數字鍵盤
 *************************************************/
document.querySelectorAll(".num-btn").forEach((btn) => {
  btn.onclick = () => {
    const v = btn.dataset.value;

    if (v === "back") {
      amount = amount.slice(0, -1);
    } else {
      amount += v;
    }

    amountDisplay.textContent = amount || "0";
  };
});

/*************************************************
 *  歷史紀錄呈現
 *************************************************/
function renderRecords(records) {
  recordList.innerHTML = "";

  records.forEach((r) => {
    const item = document.createElement("div");
    item.className = "record-item";

    item.innerHTML = `
      <div>
        <div class="record-cat">${r.category}</div>
        <div class="record-date">${r.date}</div>
      </div>
      <div class="record-amount">$${r.amount}</div>
      <div class="delete-btn" onclick="deleteRecord(${r.id})">🗑️</div>
    `;

    recordList.appendChild(item);
  });
}

/*************************************************
 *  刪除紀錄
 *************************************************/
async function deleteRecord(id) {
  await fetch(API, {
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  });

  loadDashboard();
}

/*************************************************
 *  圓餅圖（大）
 *************************************************/
function drawPieChart(data) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#FFDE68",
            "#E2C572",
            "#8A6F32",
            "#CBAF58",
            "#b19538",
            "#f2d77d",
            "#e1c66a",
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: { color: "#FFDE68" },
        },
      },
    },
  });
}

/*************************************************
 *  折線圖（小）
 *************************************************/
function drawLineChart(data) {
  const labels = data.map((d) => d.date);
  const values = data.map((d) => d.amount);

  if (lineChart) lineChart.destroy();

  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: "#FFDE68",
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: {
      scales: {
        x: { ticks: { color: "#FFDE68" } },
        y: { ticks: { color: "#FFDE68" } },
      },
      plugins: { legend: { display: false } },
    },
  });
}

/*************************************************
 *  🔥 月結存錢環形動畫
 *************************************************/
function drawSavingCircle(saved, target) {
  const canvas = document.getElementById("savingCircle");
  const ctx = canvas.getContext("2d");
  const radius = 70;
  const center = 90;

  const percent = Math.min(saved / target, 1);
  let progress = 0;

  function animate() {
    ctx.clearRect(0, 0, 180, 180);

    // 背景圓
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 222, 104, 0.2)";
    ctx.lineWidth = 12;
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 金色進度圓
    ctx.beginPath();
    ctx.strokeStyle = "#FFDE68";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();

    // 中心文字
    ctx.fillStyle = "#FFDE68";
    ctx.font = "16px Inter";
    ctx.textAlign = "center";
    ctx.fillText(`已存 ${saved}`, center, center - 5);
    ctx.font = "13px Inter";
    ctx.fillText(`目標 ${target}`, center, center + 18);

    if (progress < percent) {
      progress += 0.01;
      requestAnimationFrame(animate);
    }
  }

  animate();
}

/*************************************************
 *  🎤 語音記帳（中文）
 *************************************************/
const voiceBtn = document.getElementById("voiceBtn");

function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("你的瀏覽器不支援語音輸入");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "zh-TW";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    console.log("語音辨識：", text);

    // 解析數字
    const num = text.replace(/[^\d]/g, "");
    if (num) {
      amount = num;
      amountDisplay.textContent = amount;
    }

    // 關鍵字 → 類別自動判斷
    if (text.includes("餐") || text.includes("吃")) currentCategory = "FOOD";
    if (text.includes("咖啡")) currentCategory = "CAFE";
    if (text.includes("交通") || text.includes("車")) currentCategory = "TRPT";
    if (text.includes("買") || text.includes("衣")) currentCategory = "SHOP";
    if (text.includes("玩") || text.includes("遊戲") || text.includes("娛樂"))
      currentCategory = "PLAY";
    if (text.includes("生活") || text.includes("用品")) currentCategory = "LIFE";
    if (text.includes("訂閱") || text.includes("會員")) currentCategory = "SUBS";
  };

  recognition.onerror = (e) => alert("語音辨識錯誤：" + e.error);
}

if (voiceBtn) voiceBtn.onclick = startVoiceInput;
