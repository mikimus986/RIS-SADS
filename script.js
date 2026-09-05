let linesData = {};
let currentLine = null;
let currentDirection = null;
let currentStop = 0;

let currentAudio = null;
let audioContext = null;
let gainNode = null;

const lineInput = document.getElementById("lineInput");
const lineInfo = document.getElementById("lineInfo");
const lineNumber = document.getElementById("lineNumber");
const directionName = document.getElementById("directionName");
const stopPanel = document.getElementById("stopPanel");
const stopCounter = document.getElementById("stopCounter");
const stopName = document.getElementById("stopName");
const message = document.getElementById("message");


// ========================================
// NAČTENÍ LINES.JSON
// ========================================

fetch("lines.json")
    .then(response => {
        if (!response.ok) {
            throw new Error("Nepodařilo se načíst lines.json");
        }

        return response.json();
    })
    .then(data => {
        linesData = data;
        console.log("Linky načteny:", linesData);
    })
    .catch(error => {
        console.error("Chyba při načítání linek:", error);

        if (message) {
            message.textContent = "CHYBA NAČTENÍ DAT";
        }
    });


// ========================================
// AUDIO
// ========================================

function initAudio() {
    if (!audioContext) {
        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

        gainNode = audioContext.createGain();

        // 200 % hlasitost
        gainNode.gain.value = 5.0;

        gainNode.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}


// ========================================
// PŘEHRÁNÍ ZVUKU
// ========================================

function playSound(soundPath) {
    if (!soundPath) {
        return;
    }

    initAudio();

    // Zastavení předchozího zvuku
    if (currentAudio) {
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        } catch (error) {
            console.log("Nepodařilo se zastavit předchozí zvuk.");
        }
    }

    const audio = new Audio(soundPath);

    // Základní hlasitost
    audio.volume = 1.0;

    currentAudio = audio;

    const source = audioContext.createMediaElementSource(audio);

    // Zvuk jde přes zesilovač 200 %
    source.connect(gainNode);

    audio.play()
        .then(() => {
            console.log("Přehrávám:", soundPath);
        })
        .catch(error => {
            console.error("Zvuk se nepodařilo přehrát:", error);
        });
}


// ========================================
// ZVUK AKTUÁLNÍ ZASTÁVKY
// ========================================

function playStopSound(stop) {
    if (!stop) {
        return;
    }

    // Podpora starého formátu:
    // "Střelice, nádraží"
    if (typeof stop === "string") {
        return;
    }

    if (stop.sound) {
        playSound(stop.sound);
    }
}


// ========================================
// ENTER - NAČTENÍ LINKY
// ========================================

if (lineInput) {
    lineInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            loadLine();
        }
    });
}


// ========================================
// PLUS - DALŠÍ ZASTÁVKA
// ========================================

document.addEventListener("keydown", event => {
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
    if (!lineInput) {
        return;
    }

    const code = lineInput.value.trim();

    // ====================================
    // SLUŽEBNÍ JÍZDA
    // ====================================

    if (code === "99901") {
        currentLine = {
            number: "999",
            "01": {
                name: "Služební jízda",
                stops: []
            }
        };

        currentDirection = "01";
        currentStop = 0;

        if (lineNumber) {
            lineNumber.textContent = "999";
        }

        if (directionName) {
            directionName.textContent = "Služební jízda";
        }

        if (lineInfo) {
            lineInfo.style.display = "block";
        }

        if (stopPanel) {
            stopPanel.style.display = "none";
        }

        if (message) {
            message.textContent = "SLUŽEBNÍ JÍZDA";
        }

        return;
    }


    // ====================================
    // KONTROLA KÓDU
    // ====================================

    if (!/^\d{5}$/.test(code)) {
        if (message) {
            message.textContent = "NEPLATNÝ KÓD";
        }

        if (lineInfo) {
            lineInfo.style.display = "none";
        }

        if (stopPanel) {
            stopPanel.style.display = "none";
        }

        return;
    }


    // První 3 čísla = linka
    // Poslední 2 čísla = směr

    const lineCode = code.substring(0, 3);
    const directionCode = code.substring(3, 5);

    const line = linesData[lineCode];

    if (!line) {
        if (message) {
            message.textContent = "LINKA NEEXISTUJE";
        }

        if (lineInfo) {
            lineInfo.style.display = "none";
        }

        if (stopPanel) {
            stopPanel.style.display = "none";
        }

        return;
    }

    const direction = line[directionCode];

    if (!direction) {
        if (message) {
            message.textContent = "SMĚR NEEXISTUJE";
        }

        if (lineInfo) {
            lineInfo.style.display = "none";
        }

        if (stopPanel) {
            stopPanel.style.display = "none";
        }

        return;
    }


    // ====================================
    // NASTAVENÍ AKTUÁLNÍ LINKY
    // ====================================

    currentLine = line;
    currentDirection = directionCode;
    currentStop = 0;


    // ====================================
    // ZOBRAZENÍ INFORMACÍ
    // ====================================

    if (lineNumber) {
        lineNumber.textContent = line.number || lineCode;
    }

    if (directionName) {
        directionName.textContent = direction.name;
    }

    if (lineInfo) {
        lineInfo.style.display = "block";
    }

    if (stopPanel) {
        stopPanel.style.display = "block";
    }

    if (message) {
        message.textContent = "";
    }


    // První zastávka se pouze zobrazí.
    // Její zvuk se při ENTERU nepřehraje.
    showStop();
}


// ========================================
// ZOBRAZENÍ ZASTÁVKY
// ========================================

function showStop() {
    if (!currentLine || !currentDirection) {
        return;
    }

    const direction = currentLine[currentDirection];

    if (!direction || !direction.stops) {
        return;
    }

    const stops = direction.stops;

    if (currentStop < 0 || currentStop >= stops.length) {
        return;
    }

    const stop = stops[currentStop];

    let name;

    // Podpora objektu:
    // {
    //   "name": "Střelice, nádraží",
    //   "sound": "sounds/nádr.m4a"
    // }
    if (typeof stop === "object") {
        name = stop.name;
    } else {
        name = stop;
    }


    if (stopName) {
        stopName.textContent = name;
    }

    if (stopCounter) {
        stopCounter.textContent =
            `ZASTÁVKA ${currentStop + 1} / ${stops.length}`;
    }

    if (message) {
        message.textContent = "";
    }
}


// ========================================
// DALŠÍ ZASTÁVKA
// ========================================

function nextStop() {
    if (!currentLine || !currentDirection) {
        return;
    }

    const direction = currentLine[currentDirection];

    if (!direction || !direction.stops) {
        return;
    }

    const stops = direction.stops;


    // ====================================
    // UŽ JE ZOBRAZENO NENASTUPUJTE
    // ====================================

    if (
        message &&
        message.textContent === "NENASTUPUJTE"
    ) {
        return;
    }


    // ====================================
    // KONEČNÁ ZASTÁVKA
    // ====================================

    if (currentStop >= stops.length - 1) {

        if (message) {
            message.textContent = "NENASTUPUJTE";
        }

        if (stopName) {
            stopName.textContent = "NENASTUPUJTE";
        }

        if (stopCounter) {
            stopCounter.textContent = "KONEČNÁ ZASTÁVKA";
        }


        // Zastav předchozí zvuk
        if (currentAudio) {
            try {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            } catch (error) {
                console.log("Nepodařilo se zastavit zvuk.");
            }
        }


        // ====================================
        // PŘEHRÁNÍ ZVUKU KONEČNÉ
        // ====================================

        playSound("sounds/kon.m4a");

        return;
    }


    // ====================================
    // PŘECHOD NA DALŠÍ ZASTÁVKU
    // ====================================

    currentStop++;

    showStop();


    // ====================================
    // PŘEHRÁNÍ ZVUKU NOVÉ ZASTÁVKY
    // ====================================

    const stop = stops[currentStop];

    playStopSound(stop);
}


// ========================================
// START
// ========================================

console.log("SADS systém připraven.");
