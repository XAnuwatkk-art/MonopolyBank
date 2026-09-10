// ========================================
// MONOPOLY BANK (Firebase Real-time Version)
// ========================================

const DEFAULT_MONEY = 15000;

// ตั้งค่า Firebase พร้อมระบุ Database URL ของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyDZbVA5OPmLg7UpmrndqNJ7V7WIS7nmGyA",
    authDomain: "monopoly-bank-67c20.firebaseapp.com",
    databaseURL: "https://monopoly-bank-67c20-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "monopoly-bank-67c20",
    storageBucket: "monopoly-bank-67c20.firebasestorage.app",
    messagingSenderId: "73719951987",
    appId: "1:73719951987:web:348b715297478cb244b006",
    measurementId: "G-YPDREM2M9H"
};

// เริ่มต้นใช้งาน Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const PLAYERS = {
    P01: "PLAYER 01",
    P02: "PLAYER 02",
    P03: "PLAYER 03",
    P04: "PLAYER 04"
};

// ตรวจสอบ Player จาก URL เช่น ?player=P01
const urlParams = new URLSearchParams(window.location.search);
let currentPlayer = urlParams.get("player");
if (!PLAYERS[currentPlayer]) {
    currentPlayer = "P01";
}

let bankData = {};

// ดึงข้อมูลและอัปเดตแบบ Real-time จาก Firebase
db.ref("bankData").on("value", function(snapshot) {
    const data = snapshot.val();

    if (!data) {
        initializeDefaultData();
    } else {
        bankData = data;
        updateScreen();
    }
});

function initializeDefaultData() {
    let initialData = {};
    Object.keys(PLAYERS).forEach(function(playerId) {
        initialData[playerId] = {
            name: PLAYERS[playerId],
            money: DEFAULT_MONEY,
            history: []
        };
    });
    db.ref("bankData").set(initialData);
}

function saveData() {
    db.ref("bankData").set(bankData);
}

// อัปเดตหน้าจอทั้งหมด (ยอดของเรา, ภาพรวมทุกคน, และประวัติ)
function updateScreen() {
    if (!bankData[currentPlayer]) return;

    const pData = bankData[currentPlayer];

    // 1. แสดงชื่อและยอดเงินของเรา
    document.getElementById("playerName").innerText = pData.name;
    document.getElementById("playerId").innerText = currentPlayer;
    document.getElementById("balance").innerText = "฿" + pData.money.toLocaleString();

    // 2. แสดงยอดเงินรวมของผู้เล่นทุกคน (Overview)
    const overviewContainer = document.getElementById("allPlayersOverview");
    if (overviewContainer) {
        overviewContainer.innerHTML = "";
        Object.keys(PLAYERS).forEach(function(id) {
            if (bankData[id]) {
                const isMe = (id === currentPlayer);
                const row = document.createElement("div");
                row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px 12px; border-radius: 8px; font-size: 14px; border: 1px solid " + (isMe ? "#ffa726" : "#eee") + ";";
                
                row.innerHTML = `
                    <span style="font-weight: bold; color: ${isMe ? '#e65100' : '#333'};">
                        ${bankData[id].name} ${isMe ? '(คุณ)' : ''}
                    </span>
                    <span style="font-weight: bold; color: #2e7d32;">
                        ฿${bankData[id].money.toLocaleString()}
                    </span>
                `;
                overviewContainer.appendChild(row);
            }
        });
    }

    // 3. แสดงประวัติรายการ
    const historyContainer = document.getElementById("history");
    historyContainer.innerHTML = "";

    if (!pData.history || pData.history.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">ยังไม่มีรายการ</div>';
        return;
    }

    const reversedHistory = [...pData.history].reverse();
    reversedHistory.forEach(function(item) {
        const div = document.createElement("div");
        div.className = "history-item";

        const typeClass = item.amount > 0 ? "history-add" : "history-subtract";
        const sign = item.amount > 0 ? "+" : "";

        div.innerHTML = `
            <div>
                <div class="history-type">${item.type}</div>
                <div class="history-time">${item.time}</div>
            </div>
            <div class="history-right">
                <div class="${typeClass}">${sign}฿${item.amount.toLocaleString()}</div>
                <div class="history-balance">คงเหลือ ฿${item.balance.toLocaleString()}</div>
            </div>
        `;
        historyContainer.appendChild(div);
    });
}

function modifyMoney(amount, typeText) {
    if (!bankData[currentPlayer]) return;

    bankData[currentPlayer].money += amount;
    if (bankData[currentPlayer].money < 0) {
        bankData[currentPlayer].money = 0;
    }

    const now = new Date();
    const timeString = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH", {hour: '2-digit', minute:'2-digit'});

    bankData[currentPlayer].history.push({
        type: typeText,
        amount: amount,
        time: timeString,
        balance: bankData[currentPlayer].money
    });

    saveData();
}

// ========================================
// EVENT LISTENERS
// ========================================

document.getElementById("add100").addEventListener("click", () => modifyMoney(100, "เพิ่มเงิน (ด่วน)"));
document.getElementById("add500").addEventListener("click", () => modifyMoney(500, "เพิ่มเงิน (ด่วน)"));
document.getElementById("add1000").addEventListener("click", () => modifyMoney(1000, "เพิ่มเงิน (ด่วน)"));

document.getElementById("subtract100").addEventListener("click", () => modifyMoney(-100, "หักเงิน (ด่วน)"));
document.getElementById("subtract500").addEventListener("click", () => modifyMoney(-500, "หักเงิน (ด่วน)"));
document.getElementById("subtract1000").addEventListener("click", () => modifyMoney(-1000, "หักเงิน (ด่วน)"));

document.getElementById("addCustom").addEventListener("click", function() {
    const input = document.getElementById("customAmount");
    const val = parseInt(input.value);
    if (!isNaN(val) && val > 0) {
        modifyMoney(val, "เพิ่มเงิน (กำหนดเอง)");
        input.value = "";
    } else {
        alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
    }
});

document.getElementById("subtractCustom").addEventListener("click", function() {
    const input = document.getElementById("customAmount");
    const val = parseInt(input.value);
    if (!isNaN(val) && val > 0) {
        modifyMoney(-val, "หักเงิน (กำหนดเอง)");
        input.value = "";
    } else {
        alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
    }
});

// ปุ่มโอนเงินให้ผู้เล่นอื่น
document.getElementById("transferButton").addEventListener("click", function() {
    const targetPlayer = document.getElementById("transferTarget").value;
    const input = document.getElementById("transferAmount");
    const amount = parseInt(input.value);

    if (targetPlayer === currentPlayer) {
        alert("ไม่สามารถโอนเงินให้ตัวเองได้ครับ");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("กรุณากรอกจำนวนเงินที่ต้องการโอนให้ถูกต้อง");
        return;
    }

    if (bankData[currentPlayer].money < amount) {
        alert("ยอดเงินในบัญชีของคุณไม่พอโอนครับ!");
        return;
    }

    const now = new Date();
    const timeString = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH", {hour: '2-digit', minute:'2-digit'});

    // หักเงินผู้ส่ง
    bankData[currentPlayer].money -= amount;
    bankData[currentPlayer].history.push({
        type: `โอนให้ ${PLAYERS[targetPlayer]} (${targetPlayer})`,
        amount: -amount,
        time: timeString,
        balance: bankData[currentPlayer].money
    });

    // เพิ่มเงินผู้รับ
    bankData[targetPlayer].money += amount;
    bankData[targetPlayer].history.push({
        type: `รับโอนจาก ${PLAYERS[currentPlayer]} (${currentPlayer})`,
        amount: amount,
        time: timeString,
        balance: bankData[targetPlayer].money
    });

    saveData();

    input.value = "";
    alert("โอนเงินสำเร็จ!");
});

document.getElementById("resetButton").addEventListener("click", function() {
    if (confirm("คุณต้องการรีเซ็ตเงินของผู้เล่นทุกคนกลับเป็น ฿15,000 ใช่หรือไม่?")) {
        initializeDefaultData();
    }
});
