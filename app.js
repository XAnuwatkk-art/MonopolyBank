// ========================================
// MONOPOLY BANK
// app.js
// ========================================

const DEFAULT_MONEY = 15000;

const STORAGE_KEY = "monopoly_bank_v3";


/* ========================================
   PLAYERS
======================================== */

const PLAYERS = {

    P01: "PLAYER 01",
    P02: "PLAYER 02",
    P03: "PLAYER 03",
    P04: "PLAYER 04"

};


/* ========================================
   GET PLAYER
======================================== */

const urlParams =
    new URLSearchParams(window.location.search);

let currentPlayer =
    urlParams.get("player");


if (!PLAYERS[currentPlayer]) {

    currentPlayer = "P01";

}


/* ========================================
   LOAD DATA
======================================== */

function loadData() {

    const saved =
        localStorage.getItem(STORAGE_KEY);


    if (!saved) {

        return {};

    }


    try {

        return JSON.parse(saved);

    } catch (error) {

        console.log("ไม่สามารถอ่านข้อมูลเดิมได้");

        return {};

    }

}


/* ========================================
   SAVE DATA
======================================== */

function saveData() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(bankData)

    );

}


/* ========================================
   BANK DATA
======================================== */

let bankData = loadData();


/* สร้างผู้เล่น */
Object.keys(PLAYERS).forEach(function(playerId) {

    if (!bankData[playerId]) {

        bankData[playerId] = {

            name: PLAYERS[playerId],

            money: DEFAULT_MONEY,

            history: []

        };

    }


    if (!Array.isArray(bankData[playerId].history)) {

        bankData[playerId].history = [];

    }


    if (
        typeof bankData[playerId].money !== "number"
    ) {

        bankData[playerId].money =
            DEFAULT_MONEY;

    }

});


saveData();


/* ========================================
   ELEMENTS
======================================== */

const playerName =
    document.getElementById("playerName");

const playerId =
    document.getElementById("playerId");

const balance =
    document.getElementById("balance");

const history =
    document.getElementById("history");

const customAmount =
    document.getElementById("customAmount");

const resetButton =
    document.getElementById("resetButton");


/* ========================================
   FORMAT MONEY
======================================== */

function formatMoney(amount) {

    return "฿" +
        Number(amount).toLocaleString("en-US");

}


/* ========================================
   UPDATE SCREEN
======================================== */

function updateScreen() {

    const player =
        bankData[currentPlayer];


    playerName.textContent =
        player.name;


    playerId.textContent =
        currentPlayer;


    balance.textContent =
        formatMoney(player.money);


    renderHistory();

}


/* ========================================
   FORMAT TIME
======================================== */

function formatTime(time) {

    const date =
        new Date(time);


    return date.toLocaleString("th-TH", {

        day: "2-digit",

        month: "2-digit",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit"

    });

}


/* ========================================
   RENDER HISTORY
======================================== */

function renderHistory() {

    const player =
        bankData[currentPlayer];


    if (player.history.length === 0) {

        history.innerHTML = `
            <div class="empty-history">
                ยังไม่มีรายการ
            </div>
        `;

        return;

    }


    history.innerHTML = "";


    player.history.forEach(function(item) {

        const row =
            document.createElement("div");

        row.className =
            "history-item";


        const left =
            document.createElement("div");


        const type =
            document.createElement("div");

        type.className =
            "history-type " +
            (
                item.type === "add"
                    ? "history-add"
                    : "history-subtract"
            );

        type.textContent =
            item.label;


        const time =
            document.createElement("div");

        time.className =
            "history-time";

        time.textContent =
            formatTime(item.time);


        left.appendChild(type);

        left.appendChild(time);


        const right =
            document.createElement("div");

        right.className =
            "history-right";


        const amount =
            document.createElement("div");

        amount.className =
            item.type === "add"
                ? "history-add"
                : "history-subtract";


        amount.textContent =
            (
                item.type === "add"
                    ? "+"
                    : "-"
            ) +
            formatMoney(item.amount);


        const remaining =
            document.createElement("div");

        remaining.className =
            "history-balance";

        remaining.textContent =
            "คงเหลือ " +
            formatMoney(item.balance);


        right.appendChild(amount);

        right.appendChild(remaining);


        row.appendChild(left);

        row.appendChild(right);


        history.appendChild(row);

    });

}


/* ========================================
   CHANGE MONEY
======================================== */

function changeMoney(amount, type) {

    amount = Number(amount);


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert("กรุณาใส่จำนวนเงินให้ถูกต้อง");

        return false;

    }


    const player =
        bankData[currentPlayer];


    /* ADD */
    if (type === "add") {

        player.money += amount;

        player.history.unshift({

            type: "add",

            label: "เพิ่มเงิน",

            amount: amount,

            balance: player.money,

            time: new Date().toISOString()

        });

    }


    /* SUBTRACT */
    else if (type === "subtract") {

        if (amount > player.money) {

            alert("เงินไม่พอสำหรับรายการนี้");

            return false;

        }


        player.money -= amount;

        player.history.unshift({

            type: "subtract",

            label: "หักเงิน",

            amount: amount,

            balance: player.money,

            time: new Date().toISOString()

        });

    }


    /* เก็บประวัติสูงสุด 50 รายการ */
    player.history =
        player.history.slice(0, 50);


    saveData();

    updateScreen();


    return true;

}


/* ========================================
   QUICK BUTTONS
======================================== */

document
    .getElementById("add100")
    .addEventListener("click", function() {

        changeMoney(100, "add");

    });


document
    .getElementById("add500")
    .addEventListener("click", function() {

        changeMoney(500, "add");

    });


document
    .getElementById("add1000")
    .addEventListener("click", function() {

        changeMoney(1000, "add");

    });


document
    .getElementById("subtract100")
    .addEventListener("click", function() {

        changeMoney(100, "subtract");

    });


document
    .getElementById("subtract500")
    .addEventListener("click", function() {

        changeMoney(500, "subtract");

    });


document
    .getElementById("subtract1000")
    .addEventListener("click", function() {

        changeMoney(1000, "subtract");

    });


/* ========================================
   CUSTOM ADD
======================================== */

document
    .getElementById("addCustom")
    .addEventListener("click", function() {

        const amount =
            Number(customAmount.value);


        const success =
            changeMoney(amount, "add");


        if (success) {

            customAmount.value = "";

        }

    });


/* ========================================
   CUSTOM SUBTRACT
======================================== */

document
    .getElementById("subtractCustom")
    .addEventListener("click", function() {

        const amount =
            Number(customAmount.value);


        const success =
            changeMoney(amount, "subtract");


        if (success) {

            customAmount.value = "";

        }

    });


/* ========================================
   🔥 RESET (ปรับปรุงให้ทำงานได้ชัวร์บนมือถือ)
======================================== */

if (resetButton) {

    resetButton.addEventListener("click", function() {

        const player = bankData[currentPlayer];

        // ใช้ confirm แบบปลอดภัย หรือถ้าหน้าจอมือถือบล็อก ให้รีเซ็ตทันที
        const confirmed = window.confirm(
            "ต้องการรีเซ็ต " + player.name + " หรือไม่?"
        );

        if (confirmed) {
            player.money = DEFAULT_MONEY;
            player.history = [];

            saveData();
            updateScreen();

            alert("รีเซ็ตสำเร็จ!");
        }

    });

}


/* ========================================
   START
======================================== */

updateScreen();
