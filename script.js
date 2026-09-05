```javascript
let linesData = {};

let currentLine = null;
let currentDirection = null;
let currentStop = 0;

const lineInput = document.getElementById("lineInput");

const lineInfo = document.getElementById("lineInfo");
const lineNumber = document.getElementById("lineNumber");
const directionName = document.getElementById("directionName");

const stopPanel = document.getElementById("stopPanel");
const stopCounter = document.getElementById("stopCounter");
const stopName = document.getElementById("stopName");
const message = document.getElementById("message");


// ========================================
// ZVUK AKTUÁLNÍ ZASTÁVKY
// ========================================

let currentAudio = null;

function playStopSound(stop) {

    // Pokud zastávka nemá zvuk
    if (!stop || !stop.sound) {
        console.log("Tato zastávka nemá nastavený zvuk.");
        return;
    }

    // Zastavení předchozího zvuku
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Vytvoření nového zvuku
    currentAudio = new Audio(stop.sound);

    currentAudio.volume = 1.0;

    currentAudio.play()
        .then(() => {
            console.log("Přehrávám zvuk:", stop.sound);
        })
        .catch(error => {
            console.error(
                "Zvuk se nepodařilo přehrát:",
                error
            );
        });
}


// ========================================
// POMOCNÁ FUNKCE PRO ZASTÁVKU
// ========================================

function getStopData(stop) {

    // Nový formát:
    // {
    //     "name": "Střelice, nádraží",
    //     "sound": "sounds/strelice-nadrazi.mp3"
    // }

    if (typeof stop === "object") {
        return stop;
    }

    // Podpora starého formátu:
    // "Střelice, nádraží"

    return {
        name: stop,
        sound: null
    };
}


// ========================================
// NAČTENÍ DATABÁZE
// ========================================

fetch("lines.json")
    .then(response => {

        if (!response.ok) {
            throw new Error("Nelze načíst lines.json");
        }

        return response.json();
    })
    .then(data => {

        linesData = data;

        console.log("Databáze linek načtena.");

        lineInput.focus();
    })
    .catch(error => {

        console.error(error);

        message.textContent =
            "Chyba: nepodařilo se načíst databázi linek.";
    });


// ========================================
// ENTER = POTVRDIT KÓD
// ========================================

lineInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        loadLine();
    }

});


// ========================================
// KLÁVESNICE
// ========================================

document.addEventListener("keydown", function(event) {

    // + = DALŠÍ ZASTÁVKA

    if (
        event.key === "+" ||
        event.code === "NumpadAdd"
    ) {

        event.preventDefault();

        nextStop();
    }

});


// ========================================
// NAČTENÍ LINKY
// ========================================

function loadLine() {

    const code = lineInput.value.trim();

    message.textContent = "";

    // ====================================
    // 99901 = SLUŽEBNÍ JÍZDA
    // ====================================

    if (code === "99901") {

        currentLine = null;
        currentDirection = null;
        currentStop = 0;

        // Zastavení případného zvuku
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        // Skryj informace o lince
        lineInfo.classList.add("hidden");

        // Zobraz panel zastávky
        stopPanel.classList.remove("hidden");

        // Žádné číslo zastávky
        stopCounter.textContent = "";

        // Text služební jízdy
        stopName.textContent =
            "Služební jízda";

        stopName.classList.remove(
            "no-boarding"
        );

        return;
    }


    // ====================================
    // KONTROLA FORMÁTU
    // ====================================

    if (!/^\d{5}$/.test(code)) {

        message.textContent =
            "Zadej kód ve formátu 02201.";

        return;
    }


    // ====================================
    // ROZDĚLENÍ KÓDU
    // ====================================

    // První 3 číslice = linka

    const lineCode =
        code.substring(0, 3);

    // Poslední 2 číslice = směr

    const directionCode =
        code.substring(3, 5);


    // ====================================
    // KONTROLA LINKY
    // ====================================

    if (!linesData[lineCode]) {

        message.textContent =
            "Tato linka není v databázi.";

        return;
    }


    // ====================================
    // KONTROLA SMĚRU
    // ====================================

    if (!linesData[lineCode][directionCode]) {

        message.textContent =
            "Tento směr není u linky veden.";

        return;
    }


    // ====================================
    // ZASTAVENÍ PŘEDCHOZÍHO ZVUKU
    // ====================================

    if (currentAudio) {

        currentAudio.pause();

        currentAudio.currentTime = 0;

        currentAudio = null;
    }


    // ====================================
    // NASTAVENÍ AKTUÁLNÍ LINKY
    // ====================================

    currentLine =
        lineCode;

    currentDirection =
        directionCode;

    currentStop = 0;


    const line =
        linesData[lineCode];

    const direction =
        line[directionCode];


    // ====================================
    // RESET NENASTUPUJTE
    // ====================================

    stopName.classList.remove(
        "no-boarding"
    );


    // ====================================
    // ZOBRAZENÍ LINKY
    // ====================================

    lineNumber.textContent =
        line.number;

    directionName.textContent =
        direction.name;


    // ====================================
    // ZOBRAZENÍ PANELŮ
    // ====================================

    lineInfo.classList.remove(
        "hidden"
    );

    stopPanel.classList.remove(
        "hidden"
    );


    // ====================================
    // ZOBRAZENÍ PRVNÍ ZASTÁVKY
    // ====================================

    showStop();
}


// ========================================
// ZOBRAZENÍ ZASTÁVKY
// ========================================

function showStop() {

    // Kontrola, jestli je vybraná linka

    if (
        currentLine === null ||
        currentDirection === null
    ) {

        return;
    }


    const direction =
        linesData[currentLine][currentDirection];


    const stops =
        direction.stops;


    if (
        !stops ||
        stops.length === 0
    ) {

        return;
    }


    // ====================================
    // ZÍSKÁNÍ DAT ZASTÁVKY
    // ====================================

    const stop =
        getStopData(stops[currentStop]);


    // ====================================
    // ODSTRANĚNÍ NENASTUPUJTE
    // ====================================

    stopName.classList.remove(
        "no-boarding"
    );


    // ====================================
    // ZOBRAZENÍ ZASTÁVKY
    // ====================================

    stopName.textContent =
        stop.name;


    // ====================================
    // ZOBRAZENÍ POČTU ZASTÁVEK
    // ====================================

    stopCounter.textContent =
        `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;
}


// ========================================
// DALŠÍ ZASTÁVKA
// ========================================

function nextStop() {

    // ====================================
    // SLUŽEBNÍ JÍZDA
    // ====================================

    if (
        currentLine === null &&
        currentDirection === null
    ) {

        return;
    }


    // ====================================
    // KONTROLA LINKY
    // ====================================

    if (
        !currentLine ||
        !currentDirection
    ) {

        return;
    }


    const stops =
        linesData[currentLine][currentDirection].stops;


    if (
        !stops ||
        stops.length === 0
    ) {

        return;
    }


    // ====================================
    // NENASTUPUJTE
    // ====================================

    if (
        stopName.classList.contains(
            "no-boarding"
        )
    ) {

        return;
    }


    // ====================================
    // KONEČNÁ
    // ====================================

    if (
        currentStop === stops.length - 1
    ) {

        stopName.textContent =
            "NENASTUPUJTE";

        stopName.classList.add(
            "no-boarding"
        );

        stopCounter.textContent =
            "KONEČNÁ ZASTÁVKA";

        // Zastavení zvuku poslední zastávky
        if (currentAudio) {

            currentAudio.pause();

            currentAudio.currentTime = 0;

            currentAudio = null;
        }

        return;
    }


    // ====================================
    // DALŠÍ ZASTÁVKA
    // ====================================

    currentStop++;


    // Zobrazíme novou zastávku
    showStop();


    // ====================================
    // PŘEHRÁNÍ ZVUKU NOVÉ ZASTÁVKY
    // ====================================

    const stop =
        getStopData(stops[currentStop]);


    playStopSound(stop);
}
```
