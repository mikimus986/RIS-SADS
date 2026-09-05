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

function stopCurrentAudio() {

    if (currentAudio) {

        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;

    }

}


function playStopSound(stop) {

    // Pokud zastávka nemá data
    if (!stop) {

        console.log("Zastávka nemá data.");
        return;

    }


    // Pokud zastávka nemá nastavený zvuk
    if (!stop.sound) {

        console.log(
            "Zastávka nemá nastavený zvuk:",
            stop.name
        );

        return;

    }


    // Zastavení předchozího zvuku
    stopCurrentAudio();


    // Přesná cesta k souboru z lines.json
    const soundPath = stop.sound;


    console.log(
        "Přehrávám zvuk zastávky:",
        stop.name
    );

    console.log(
        "Soubor:",
        soundPath
    );


    // Vytvoření audia
    currentAudio = new Audio(soundPath);

    currentAudio.volume = 1.0;


    // Přehrání
    currentAudio.play()
        .then(() => {

            console.log(
                "Zvuk byl spuštěn:"
            );

            console.log(soundPath);

        })
        .catch(error => {

            console.error(
                "Zvuk se nepodařilo přehrát:",
                error
            );

            message.textContent =
                "Nepodařilo se přehrát zvuk zastávky.";

        });


    // Po skončení zvuku uvolníme audio
    currentAudio.addEventListener(
        "ended",
        function() {

            currentAudio = null;

        }
    );

}


// ========================================
// POMOCNÁ FUNKCE PRO ZASTÁVKU
// ========================================

function getStopData(stop) {

    // ====================================
    // NOVÝ FORMÁT
    // ====================================

    /*
        {
            "name": "Střelice, nádraží",
            "sound": "sounds/nádr.m4a"
        }
    */

    if (
        typeof stop === "object" &&
        stop !== null
    ) {

        return stop;

    }


    // ====================================
    // STARÝ FORMÁT
    // ====================================

    /*
        "Střelice, nádraží"
    */

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

            throw new Error(
                "Nelze načíst lines.json"
            );

        }

        return response.json();

    })

    .then(data => {

        linesData = data;

        console.log(
            "Databáze linek načtena."
        );

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

lineInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            loadLine();

        }

    }
);


// ========================================
// KLÁVESNICE
// ========================================

document.addEventListener(
    "keydown",
    function(event) {

        // =================================
        // + = DALŠÍ ZASTÁVKA
        // =================================

        if (
            event.key === "+" ||
            event.code === "NumpadAdd"
        ) {

            event.preventDefault();

            nextStop();

        }

    }
);


// ========================================
// NAČTENÍ LINKY
// ========================================

function loadLine() {

    const code =
        lineInput.value.trim();


    message.textContent = "";


    // ====================================
    // 99901 = SLUŽEBNÍ JÍZDA
    // ====================================

    if (code === "99901") {

        currentLine = null;
        currentDirection = null;
        currentStop = 0;


        // Zastavení zvuku
        stopCurrentAudio();


        // Skrytí informací o lince
        lineInfo.classList.add(
            "hidden"
        );


        // Zobrazení panelu zastávky
        stopPanel.classList.remove(
            "hidden"
        );


        // Bez čísla zastávky
        stopCounter.textContent = "";


        // Služební jízda
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

    if (
        !linesData[lineCode][directionCode]
    ) {

        message.textContent =
            "Tento směr není u linky veden.";

        return;

    }


    // ====================================
    // ZASTAVENÍ PŘEDCHOZÍHO ZVUKU
    // ====================================

    stopCurrentAudio();


    // ====================================
    // NASTAVENÍ LINKY
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
    // PRVNÍ ZASTÁVKA
    // ====================================

    showStop();

}


// ========================================
// ZOBRAZENÍ ZASTÁVKY
// ========================================

function showStop() {

    // ====================================
    // KONTROLA LINKY
    // ====================================

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


    // ====================================
    // KONTROLA ZASTÁVEK
    // ====================================

    if (
        !stops ||
        stops.length === 0
    ) {

        return;

    }


    // ====================================
    // DATA AKTUÁLNÍ ZASTÁVKY
    // ====================================

    const stop =
        getStopData(
            stops[currentStop]
        );


    // ====================================
    // RESET NENASTUPUJTE
    // ====================================

    stopName.classList.remove(
        "no-boarding"
    );


    // ====================================
    // NÁZEV ZASTÁVKY
    // ====================================

    stopName.textContent =
        stop.name;


    // ====================================
    // POČET ZASTÁVEK
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


    const direction =
        linesData[currentLine][currentDirection];


    const stops =
        direction.stops;


    // ====================================
    // KONTROLA ZASTÁVEK
    // ====================================

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


        // Zastavení zvuku
        stopCurrentAudio();


        return;

    }


    // ====================================
    // DALŠÍ ZASTÁVKA
    // ====================================

    currentStop++;


    // Zobrazit novou zastávku
    showStop();


    // ====================================
    // PŘEHRÁT ZVUK NOVÉ ZASTÁVKY
    // ====================================

    const stop =
        getStopData(
            stops[currentStop]
        );


    playStopSound(stop);

}
