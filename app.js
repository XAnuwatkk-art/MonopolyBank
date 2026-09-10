// ========================================
// MONOPOLY BANK (Lobby & Real-time System)
// ========================================

const DEFAULT_MONEY = 15000;

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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const PLAYERS = {
    P01: "PLAYER 01",
    P02: "PLAYER 02",
    P03: "PLAYER 03",
    P04: "PLAYER 04"
};

let bankData = {};
let currentPlayer = null;
let isJoined = false;

// โหลดข้อมูลกลางแบบ Real-time
db.ref("bankData").on("value", function(snapshot) {
    const data = snapshot.val();
    if (!data) {
        initializeDefaultData();
    } else {
        bankData = data;
        renderScreen();
    }
});

function initializeDefaultData() {
    let initialData = {};
    Object.keys(PLAYERS).forEach(function(playerId) {
        initialData[playerId] = {
            name: PLAYERS[playerId],
            money: DEFAULT_MONEY,
            history: [],
            active: false // เริ่มต้นยังไม่มีใครกดเข้าร่วมห้อง
        };
    });
    db.ref("bankData").set(initialData);
}

function saveData() {
    db.ref("bankData").set(bankData);
}

function renderScreen() {
    const lobbyScreen = document.getElementById("lobbyScreen");
    const gameScreen = document.getElementById("gameScreen");

    if (!isJoined || !currentPlayer || !bankData[currentPlayer] || !bankData[currentPlayer].active) {
        // แสดงหน้า Lobby
        lobbyScreen.style.display = "block";
        gameScreen.style.display = "none";
        renderLobby();
    } else {
        // แสดงหน้าเกมหลัก
        lobbyScreen.style.display = "none";
        gameScreen.style.display = "block";
        updateGameScreen();
    }
}

function renderLobby() {
    const listContainer = document.getElementById("lobbyPlayersList");
    if (listContainer) {
        listContainer.innerHTML = "";
        Object.keys(PLAYERS).forEach(function(id) {
            if (bankData[id]) {
                const isActive = bankData[id].active;
                const row = document.createElement("div");
                row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px 12px; border-radius: 8px; font-size: 14px; border: 1px solid " + (isActive ? "#a5d6a7" : "#eee") + ";";
                
                row.innerHTML = `
                    <span style="font-weight: bold; color: #333;">${bankData[id].name}</span>
                    <span style="font-weight: bold; color: ${isActive ? '#2e7d32' : '#888'};">
                        ${isActive ? '✅ เข้าร่วมแล้ว' : '⏳ รอเข้าร่วม'}
                    </span>
                `;
                listContainer.appendChild(row);
            }
        });
    }

    // ปุ่มรีเซ็ตห้องใน Lobby (ให้แสดงเฉพาะ P01 หรือเปิดให้ทุกคนรีเซ็ตห้องได้)
    const lobbyResetSec = document.getElementById("lobbyResetSection");
    if (lobbyResetSec) {
        lobbyResetSec.style.display = "block";
    }
}

function updateGameScreen() {
    if (!bankData[currentPlayer]) return;
    const pData = bankData[currentPlayer];

    document.getElementById("playerName").innerText = pData.name;
    document.getElementById("playerId").innerText = currentPlayer;
    document.getElementById("balance").innerText = "฿" + (pData.money || 0).toLocaleString();

    // แสดงเฉพาะผู้เล่นที่กด active (เข้าร่วมเล่น) แล้วเท่านั้นใน Overview
    const overviewContainer = document.getElementById("allPlayersOverview");
    const transferTargetSelect = document.getElementById("transferTarget");
    
    if (overviewContainer) overviewContainer.innerHTML = "";
    if (transferTargetSelect) transferTargetSelect.innerHTML = "";

    Object.keys(PLAYERS).forEach(function(id) {
        if (bankData[id] && bankData[id].active) {
            const isMe = (id === currentPlayer);
            
            // Overview Box
            const row = document.createElement("div");
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px 12px; border-radius: 8px; font-size: 14px; border: 1px solid " + (isMe ? "#ffa726" : "#eee") + ";";
            row.innerHTML = `
                <span style="font-weight: bold; color: ${isMe ? '#e65100' : '#333'};">
                    ${bankData[id].name} ${isMe ? '(คุณ)' : ''}
                </span>
                <span style="font-weight: bold; color: #2e7d32;">
                    ฿${(bankData[id].money || 0).toLocaleString()}
                </span>
            `;
            overviewContainer.appendChild(row);

            // Dropdown โอนเงิน (ไม่รวมตัวเอง)
            if (!isMe && transferTargetSelect) {
                const opt = document.createElement("option");
                opt.value = id;
                opt.text = bankData[id].name;
                transferTargetSelect.appendChild(opt);
            }
        }
    });

    // ประวัติรายการ
    const historyContainer = document.getElementById("history");
    if (historyContainer) {
        historyContainer.innerHTML = "";
        if (!pData.history || pData.history.length === 0) {
            historyContainer.innerHTML = '<div class="empty-history">ยังไม่มีรายการ</div>';
        } else {
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
                        <div class="${typeClass}">${sign}฿${(item.amount || 0).toLocaleString()}</div>
                        <div class="history-balance">คงเหลือ ฿${(item.balance || 0).toLocaleString()}</div>
                    </div>
                `;
                historyContainer.appendChild(div);
            });
        }
    }

    // ปุ่ม RESET ในหน้าเกม (เฉพาะ P01 เท่านั้นถึงจะเห็นและกดได้)
    const gameResetSec = document.getElementById("gameResetSection");
    if (gameResetSec) {
        if (currentPlayer === "P01") {
            gameResetSec.style.display = "block";
        } else {
            gameResetSec.style.display = "none";
        }
    }
}

function modifyMoney(amount, typeText) {
    if (!bankData[currentPlayer]) return;
    let currentMoney = parseInt(bankData[currentPlayer].money) || DEFAULT_MONEY;
    currentMoney += amount;
    if (currentMoney < 0) currentMoney = 0;

    bankData[currentPlayer].money = currentMoney;
    if (!Array.isArray(bankData[currentPlayer].history)) bankData[currentPlayer].history = [];

    const now = new Date();
    const timeString = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH", {hour: '2-digit', minute:'2-digit'});

    bankData[currentPlayer].history.push({
        type: typeText,
        amount: amount,
        time: timeString,
        balance: currentMoney
    });

    saveData();
}

function promptModifyMoney(amount, typeText) {
    const sign = amount > 0 ? "+" : "";
    if (confirm(`คุณต้องการ ${typeText} จำนวน ${sign}฿${amount.toLocaleString()} ใช่หรือไม่?`)) {
        modifyMoney(amount, typeText);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

document.getElementById("joinButton").onclick = function() {
    const selectedId = document.getElementById("selectPlayerId").value;
    currentPlayer = selectedId;
    isJoined = true;

    // เปิดใช้งานตัวละครนี้ในระบบ
    if (bankData[currentPlayer]) {
        bankData[currentPlayer].active = true;
        // ถ้าเงินเคยถูกรีเซ็ตหรือเป็นค่าว่าง ให้ตั้งเป็น 15000
        if (typeof bankData[currentPlayer].money !== "number") {
            bankData[currentPlayer].money = DEFAULT_MONEY;
        }
        saveData();
    }
    renderScreen();
};

document.getElementById("backToLobbyBtn").onclick = function() {
    isJoined = false;
    renderScreen();
};

// ปุ่มบวกลบด่วน
document.getElementById("add100").onclick = () => promptModifyMoney(100, "เพิ่มเงิน (ด่วน)");
document.getElementById("add500").onclick = () => promptModifyMoney(500, "เพิ่มเงิน (ด่วน)");
document.getElementById("add1000").onclick = () => promptModifyMoney(1000, "เพิ่มเงิน (ด่วน)");

document.getElementById("subtract100").onclick = () => promptModifyMoney(-100, "หักเงิน (ด่วน)");
document.getElementById("subtract500").onclick = () => promptModifyMoney(-500, "หักเงิน (ด่วน)");
document.getElementById("subtract1000").onclick = () => promptModifyMoney(-1000, "หักเงิน (ด่วน)");

document.getElementById("addCustom").onclick = function() {
    const input = document.getElementById("customAmount");
    const val = parseInt(input.value);
    if (!isNaN(val) && val > 0) {
        if (confirm(`คุณต้องการเพิ่มเงินจำนวน ฿${val.toLocaleString()} ใช่หรือไม่?`)) {
            modifyMoney(val, "เพิ่มเงิน (กำหนดเอง)");
            input.value = "";
        }
    } else {
        alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
    }
};

document.getElementById("subtractCustom").onclick = function() {
    const input = document.getElementById("customAmount");
    const val = parseInt(input.value);
    if (!isNaN(val) && val > 0) {
        if (confirm(`คุณต้องการหักเงินจำนวน ฿${val.toLocaleString()} ใช่หรือไม่?`)) {
            modifyMoney(-val, "หักเงิน (กำหนดเอง)");
            input.value = "";
        }
    } else {
        alert("กรุณากรอกจำนวนเงินให้ถูกต้อง");
    }
};

document.getElementById("transferButton").onclick = function() {
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
    if ((bankData[currentPlayer].money || 0) < amount) {
        alert("ยอดเงินในบัญชีของคุณไม่พอโอนครับ!");
        return;
    }

    const now = new Date();
    const timeString = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH", {hour: '2-digit', minute:'2-digit'});

    if (!bankData[currentPlayer].history) bankData[currentPlayer].history = [];
    if (!bankData[targetPlayer].history) bankData[targetPlayer].history = [];

    bankData[currentPlayer].money -= amount;
    bankData[currentPlayer].history.push({
        type: `โอนให้ ${PLAYERS[targetPlayer]}`,
        amount: -amount,
        time: timeString,
        balance: bankData[currentPlayer].money
    });

    bankData[targetPlayer].money = (bankData[targetPlayer].money || 0) + amount;
    bankData[targetPlayer].history.push({
        type: `รับโอนจาก ${PLAYERS[currentPlayer]}`,
        amount: amount,
        time: timeString,
        balance: bankData[targetPlayer].money
    });

    saveData();
    input.value = "";
    alert("โอนเงินสำเร็จ!");
};

// ฟังก์ชันรีเซ็ตห้อง (สำหรับ Player 01)
function handleReset() {
    if (confirm("[สำหรับ Player 01] คุณต้องการรีเซ็ตห้องและเงินของผู้เล่นทั้งหมดใหม่ใช่หรือไม่?")) {
        initializeDefaultData();
        isJoined = false;
        renderScreen();
    }
}

document.getElementById("resetButton").onclick = handleReset;
document.getElementById("lobbyResetButton").onclick = handleReset;
