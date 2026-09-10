// ========================================
// MONOPOLY BANK (Nickname Replace & Global Feed)
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

const urlParams = new URLSearchParams(window.location.search);
let currentPlayer = urlParams.get("player") ? urlParams.get("player").toUpperCase() : "P01";

if (!PLAYERS[currentPlayer]) {
    currentPlayer = "P01";
}

let isJoined = false;

// โหลดข้อมูลกลางแบบ Real-time
db.ref("bankData").on("value", function(snapshot) {
    const data = snapshot.val();
    if (!data) {
        initializeDefaultData();
    } else {
        bankData = data;
        
        if (bankData[currentPlayer] && bankData[currentPlayer].active) {
            isJoined = true;
        } else {
            isJoined = false;
        }
        
        renderScreen();
    }
});

function initializeDefaultData() {
    let initialData = {
        globalHistory: []
    };
    Object.keys(PLAYERS).forEach(function(playerId) {
        initialData[playerId] = {
            name: PLAYERS[playerId],
            nickname: "",
            money: DEFAULT_MONEY,
            active: false
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

    if (!isJoined) {
        lobbyScreen.style.display = "block";
        gameScreen.style.display = "none";
        renderLobby();
    } else {
        lobbyScreen.style.display = "none";
        gameScreen.style.display = "block";
        updateGameScreen();
    }
}

function renderLobby() {
    const welcomeText = document.getElementById("lobbyWelcomeText");
    const joinButton = document.getElementById("joinButton");

    if (welcomeText && PLAYERS[currentPlayer]) {
        welcomeText.innerText = `ยินดีต้อนรับคุณเข้าสู่ห้องเกม\nคุณคือ ${PLAYERS[currentPlayer]} (${currentPlayer})`;
        if (joinButton) joinButton.style.display = "block";
    }

    const listContainer = document.getElementById("lobbyPlayersList");
    if (listContainer) {
        listContainer.innerHTML = "";
        Object.keys(PLAYERS).forEach(function(id) {
            if (bankData[id]) {
                const isActive = bankData[id].active;
                // ถ้ามีชื่อเล่น ให้โชว์ชื่อเล่นในวงเล็บหลัง PLAYER 01
                const displayName = bankData[id].nickname ? `${PLAYERS[id]} (${bankData[id].nickname})` : PLAYERS[id];
                const row = document.createElement("div");
                row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px 12px; border-radius: 8px; font-size: 14px; border: 1px solid " + (isActive ? "#a5d6a7" : "#eee") + ";";
                
                row.innerHTML = `
                    <span style="font-weight: bold; color: #333;">${displayName}</span>
                    <span style="font-weight: bold; color: ${isActive ? '#2e7d32' : '#888'};">
                        ${isActive ? '✅ เข้าร่วมแล้ว' : '⏳ รอเข้าร่วม'}
                    </span>
                `;
                listContainer.appendChild(row);
            }
        });
    }

    const lobbyResetSec = document.getElementById("lobbyResetSection");
    if (lobbyResetSec) {
        if (currentPlayer === "P01") {
            lobbyResetSec.style.display = "block";
        } else {
            lobbyResetSec.style.display = "none";
        }
    }
}

function updateGameScreen() {
    if (!bankData[currentPlayer]) return;
    const pData = bankData[currentPlayer];

    // 🎯 แทนที่ชื่อด้วยชื่อเล่นในช่องการ์ดสีเขียว (ถ้ามีชื่อเล่น ให้ใช้ชื่อเล่นหลักเลย ถ้าไม่มีใช้ชื่อเดิม)
    const displayName = pData.nickname ? pData.nickname : PLAYERS[currentPlayer];
    document.getElementById("playerName").innerText = displayName;
    document.getElementById("playerId").innerText = `${currentPlayer} (${PLAYERS[currentPlayer]})`;
    document.getElementById("balance").innerText = "฿" + (pData.money || 0).toLocaleString();

    const overviewContainer = document.getElementById("allPlayersOverview");
    const transferTargetSelect = document.getElementById("transferTarget");
    
    if (overviewContainer) overviewContainer.innerHTML = "";
    if (transferTargetSelect) transferTargetSelect.innerHTML = "";

    Object.keys(PLAYERS).forEach(function(id) {
        if (bankData[id] && bankData[id].active) {
            const isMe = (id === currentPlayer);
            const targetDisplayName = bankData[id].nickname ? bankData[id].nickname : PLAYERS[id];
            
            // Overview Box
            const row = document.createElement("div");
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px 12px; border-radius: 8px; font-size: 14px; border: 1px solid " + (isMe ? "#ffa726" : "#eee") + ";";
            row.innerHTML = `
                <span style="font-weight: bold; color: ${isMe ? '#e65100' : '#333'};">
                    ${targetDisplayName} ${isMe ? '(คุณ)' : ''} <span style="font-size: 11px; color: #888; font-weight: normal;">[${PLAYERS[id]}]</span>
                </span>
                <span style="font-weight: bold; color: #2e7d32;">
                    ฿${(bankData[id].money || 0).toLocaleString()}
                </span>
            `;
            overviewContainer.appendChild(row);

            // Dropdown โอนเงิน (แสดงชื่อเล่นของผู้รับ)
            if (!isMe && transferTargetSelect) {
                const opt = document.createElement("option");
                opt.value = id;
                opt.text = `${targetDisplayName} [${PLAYERS[id]}]`;
                transferTargetSelect.appendChild(opt);
            }
        }
    });

    // ประวัติส่วนกลาง
    const globalHistoryContainer = document.getElementById("globalHistory");
    if (globalHistoryContainer) {
        globalHistoryContainer.innerHTML = "";
        const gHistory = bankData.globalHistory || [];
        
        if (gHistory.length === 0) {
            globalHistoryContainer.innerHTML = '<div class="empty-history">ยังไม่มีรายการเคลื่อนไหว</div>';
        } else {
            const reversedGlobal = [...gHistory].reverse();
            reversedGlobal.forEach(function(item) {
                const div = document.createElement("div");
                div.className = "history-item";
                const typeClass = item.amount > 0 ? "history-add" : "history-subtract";
                const sign = item.amount > 0 ? "+" : "";
                div.innerHTML = `
                    <div>
                        <div class="history-type">${item.text}</div>
                        <div class="history-time">${item.time}</div>
                    </div>
                    <div class="history-right">
                        <div class="${typeClass}">${sign}฿${(item.amount || 0).toLocaleString()}</div>
                    </div>
                `;
                globalHistoryContainer.appendChild(div);
            });
        }
    }

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

    bankData[currentPlayer].money = currentMoney;

    const now = new Date();
    const timeString = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH", {hour: '2-digit', minute:'2-digit'});

    if (!Array.isArray(bankData.globalHistory)) {
        bankData.globalHistory = [];
    }

    const pName = bankData[currentPlayer].nickname ? bankData[currentPlayer].nickname : PLAYERS[currentPlayer];
    bankData.globalHistory.push({
        text: `${pName}: ${typeText}`,
        amount: amount,
        time: timeString
    });

    if (currentMoney < 0) {
        alert(`💥 เงินติดลบ ฿${Math.abs(currentMoney).toLocaleString()}!\nคุณล้มละลายและถูกเชิญออกจากห้องเกมแล้ว!`);
        bankData[currentPlayer].active = false;
        bankData[currentPlayer].money = 0;
    }

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
    const nickInput = document.getElementById("nicknameInput");
    const nickname = nickInput ? nickInput.value.trim() : "";

    if (bankData[currentPlayer]) {
        bankData[currentPlayer].active = true;
        bankData[currentPlayer].nickname = nickname;
        if (typeof bankData[currentPlayer].money !== "number" || bankData[currentPlayer].money < 0) {
            bankData[currentPlayer].money = DEFAULT_MONEY;
        }
        saveData();
    }
};

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

    if (!Array.isArray(bankData.globalHistory)) {
        bankData.globalHistory = [];
    }

    bankData[currentPlayer].money -= amount;
    bankData[targetPlayer].money = (bankData[targetPlayer].money || 0) + amount;

    const senderName = bankData[currentPlayer].nickname ? bankData[currentPlayer].nickname : PLAYERS[currentPlayer];
    const targetName = bankData[targetPlayer].nickname ? bankData[targetPlayer].nickname : PLAYERS[targetPlayer];

    bankData.globalHistory.push({
        text: `${senderName} ➡️ ${targetName}`,
        amount: -amount,
        time: timeString
    });

    saveData();
    input.value = "";
    alert("โอนเงินสำเร็จ!");
};

function handleReset() {
    if (confirm("[สำหรับ Player 01] คุณต้องการรีเซ็ตห้องและเงินของผู้เล่นทั้งหมดใหม่ใช่หรือไม่?")) {
        initializeDefaultData();
    }
}

document.getElementById("resetButton").onclick = handleReset;
document.getElementById("lobbyResetButton").onclick = handleReset;
