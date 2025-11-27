/*************************************************
 *  記帳管家 BlackGold Edition — app.js (完整版)
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

// 圖表 instance（避免重複生成）
let pieChart = null;
let lineChart = null;

/*************************************************
 *  Smart Ticker（分類按鈕）
 *************************************************/
const categories = ["FOOD", "CAFE", "TRPT", "SHOP", "PLAY", "LIFE", "SUBS"];
const smartTicker = document.getElementById("smartTicker");

categories.forEach((cat) => {
  let btn = document.createElement("button");
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

  // ★ Accounts 儀表板
  document.getElementById("monthSpent").innerText =
    `${data.monthSpent} / ${data.conf["monthly_budget"]}`;

  document.getElementById("savingEstimate").innerText =
    `預估可存：${data.estimateSaving}`;

  document.getElementById("dailyLimit").innerText =
    `今日可花：${data.dailyLimit}`;

  // ★ 金色進度條
  const percent =
    (data.monthSpent / data.conf["monthly_budget"]) * 100 || 0;
  progressBar.style.width = `${Math.min(percent, 100)}%`;

  // ★ 警告 & Coach
  renderAlerts(data);
  renderCoach(data);

  // ★ 讀取紀錄
  renderRecords(data.records);

  // ★ 圖表
  drawPieChart(data.chartByCategory);
  drawLineChart(data.chart7days);
}

loadDashboard();

/*************************************************
 *  理財教練（AI 本地端分析）
 *************************************************/
function renderCoach(data) {
  const list = [];

  // 食物費超標？
  const food = data.chartByCategory["FOOD"] || 0;
  const avgFood = 0.25 * data.conf["monthly_budget"] / 4; // 每週 25%
  if (food > avgFood) {
    list.push("⚠️ 食物費偏高，建議這週外食減少 15%。");
  }

  // 娛樂費偏高？
  const play = data.chartByCategory["PLAY"] || 0;
  const limitPlay = data.conf["monthly_budget"] * 0.1;
  if (play > limitPlay) {
    list.push("🎮 娛樂費逼近上限，建議先避免大額消費。");
  }

  // 儲蓄建議
  if (data.estimateSaving < data.conf["saving_target"]) {
    list.push("📉 本月存款進度落後，建議先降低非必要消費。");
  } else {
    list.push("🟢 本月儲蓄進度正常，維持目前習慣即可！");
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
 *  鍵盤事件
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
 *  刪除紀錄（DELETE）
 *************************************************/
async function deleteRecord(id) {
  await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id: id,
    }),
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
