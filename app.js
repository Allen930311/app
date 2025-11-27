const API = "https://script.google.com/macros/s/AKfycbxbOJKAuODxSp4T-IX5y4B5MKU5MOv03QgkcZWnAn6x0FjrWUK5CH29X2Jg5Oges3mi/exec";

let currentCategory = "FOOD";
let amount = "";

// 取得輸入框 DOM
const amountDisplay = document.getElementById("amountDisplay");

// Smart Ticker（固定 7 個）
const categories = ["FOOD", "CAFE", "TRPT", "SHOP", "PLAY", "LIFE", "SUBS"];
const smartTicker = document.getElementById("smartTicker");

categories.forEach(cat => {
  let btn = document.createElement("button");
  btn.innerText = cat;
  btn.className = "ticker-btn";
  btn.onclick = () => { currentCategory = cat; };
  smartTicker.appendChild(btn);
});

// 讀取 Dashboard 資料
async function loadDashboard() {
  const res = await fetch(API);
  const data = await res.json();

  document.getElementById("monthSpent").innerText =
    `${data.monthSpent} / ${data.conf["monthly_budget"]}`;

  document.getElementById("savingEstimate").innerText =
    `預估可存：${data.estimateSaving}`;

  document.getElementById("dailyLimit").innerText =
    `今日可花：${data.dailyLimit}`;

  const alertArea = document.getElementById("alertArea");
  alertArea.innerHTML = "";

  if (data.estimateSaving < data.conf["saving_target"]) {
    alertArea.innerHTML += `
      <div class="gold-border rounded-xl p-3">
        ⚠ 存款低於目標（${data.estimateSaving} / ${data.conf["saving_target"]}）
      </div>`;
  }
}
loadDashboard();

// 🟦 數字鍵盤邏輯 + 顯示在輸入框
document.querySelectorAll(".num-btn").forEach(btn => {
  btn.onclick = () => {
    const val = btn.dataset.value;

    if (val === "back") {
      amount = amount.slice(0, -1);
    } else {
      amount += val;
    }

    // 更新畫面
    amountDisplay.textContent = amount || "0";
  };
});

// 記帳
async function saveRecord() {
  if (amount === "") return;

  await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      category: currentCategory,
      amount: amount,
      device: "mobile"
    })
  });

  // 清空
  amount = "";
  amountDisplay.textContent = "0";

  loadDashboard();
}

// 綁定 按下「記帳✓」按鈕
document.getElementById("save").onclick = saveRecord;
