const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");
const http = require("http");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");


// ============================================================
// GEMINI
// ============================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ============================================================
// ONA TOWERS KNOWLEDGE
// ============================================================

const ONA_TOWERS_KNOWLEDGE = [
    "You are the AI assistant for ONA TOWERS in Zanzibar.",
    "",
    "ONA TOWERS is a modern residential development consisting of two residential towers and a separate commercial/service building.",
    "",
    "RESIDENTIAL TOWERS:",
    "- 2 residential towers.",
    "- Each tower consists primarily of 11 residential floors.",
    "- Each typical floor has 4 apartments.",
    "- 2 two-bedroom apartments per typical floor.",
    "- 2 three-bedroom apartments per typical floor.",
    "- Approximately 46 apartments per tower.",
    "- Approximately 150 residents expected per tower.",
    "- Approximately 300 residents across both towers.",
    "- The development is designed as a small vertical residential community.",
    "",
    "APARTMENT SIZES:",
    "- Two-bedroom apartment: approximately 203 sqm.",
    "- Three-bedroom apartment: approximately 236 sqm.",
    "",
    "PENTHOUSES:",
    "- Penthouse A: approximately 482 sqm.",
    "- Penthouse B: approximately 416 sqm.",
    "",
    "APARTMENT MIX PER TOWER:",
    "- 11 x 3-bedroom Ocean / Sunset View apartments - 236 sqm each.",
    "- 11 x 2-bedroom Ocean / Sunset View apartments - 203 sqm each.",
    "- 11 x 3-bedroom Sunrise View apartments - 236 sqm each.",
    "- 11 x 2-bedroom Sunrise View apartments - 203 sqm each.",
    "- 2 x Signature Penthouses.",
    "",
    "VIEWS:",
    "- Floors 1-3 have Sunset View and Sunrise View.",
    "- Floors 4-11 have Ocean View and Sunrise View.",
    "- Ocean views become particularly important from the higher floors.",
    "- Apartments are positioned according to their orientation, including ocean-facing and sunrise-facing units.",
    "",
    "FACILITIES UNDER CONSIDERATION:",
    "- Residents' lounge.",
    "- Library / kids' club.",
    "- Management office.",
    "- Delivery / package room.",
    "- Wakala / everyday financial services.",
    "- Bakery.",
    "- Coffee corner.",
    "- Gathering / party room.",
    "- Yoga / wellness studio.",
    "- Gym.",
    "- Swimming pool.",
    "- Recreation areas.",
    "- Rooftop restaurant.",
    "",
    "IMPORTANT: These facilities are under consideration and are NOT confirmed.",
    "",
    "COMMERCIAL / SERVICE BUILDING:",
    "- One separate commercial/service building.",
    "- Two levels of parking.",
    "- Current ground-floor concept includes a supermarket, coffee corner, and entrance/office functions.",
    "- Some areas around the residential towers have limited vehicle access and significant pedestrian movement.",
    "- The development needs to balance parking, pedestrian safety, walkability, landscaping, and useful residential facilities.",
    "",
    "DEVELOPMENT PROGRAM:",
    "- 1 Commercial/Service building.",
    "- 2 Residential Towers.",
    "- Ground Floor: Parking & Building Services.",
    "- 11 Residential Floors.",
    "- 1 Penthouse Floor.",
    "- 46 Apartments per Tower.",
    "",
    "LOCATION:",
    "- ONA TOWERS is located in Zanzibar.",
    "",
    "GOOGLE EARTH LOCATION:",
    "https://earth.google.com/earth/d/1o45Bp_TRlkxOecQDxJorncTRtWC8IWFr?usp=sharing",
    "",
    "BENCHMARK PROJECT:",
    "https://editatd3.meraas.com/toolkit",
    "",
    "CHATBOT RULES:",
    "- Answer customers naturally and professionally.",
    "- Be helpful and welcoming.",
    "- Use the ONA TOWERS information when answering questions.",
    "- Never invent information.",
    "- Never invent prices.",
    "- Never invent apartment availability.",
    "- Never invent payment plans.",
    "- Never invent completion dates.",
    "- Never say that a proposed facility is confirmed.",
    "- If information is unavailable, say that it is not currently available.",
    "- Keep normal WhatsApp responses reasonably short.",
    "- Give more detail when the customer asks.",
    "",
    "LANGUAGE RULE:",
    "- Reply in the same language used by the customer.",
    "- If the customer writes in English, reply in English.",
    "- If the customer writes in Swahili, reply in Swahili.",
    "- Do not switch from English to Swahili unless the customer switches.",
    "- Do not switch from Swahili to English unless the customer switches.",
    "- If the customer mixes languages, use the language that dominates the message.",
    "- Use natural East African Swahili when replying in Swahili.",
    "- Do not translate the customer's message unless they ask for a translation."
].join("\n");


// ============================================================
// SIMPLE LANGUAGE DETECTION
// ============================================================

function detectLanguage(text) {
    const lower = text.toLowerCase();

    const swahiliWords = [
        "habari",
        "mambo",
        "hujambo",
        "ipo",
        "wapi",
        "bei",
        "nyumba",
        "ghorofa",
        "chumba",
        "vyumba",
        "mita",
        "mradi",
        "ona",
        "mnayo",
        "unauza",
        "kuuza",
        "kununua",
        "nina",
        "nataka",
        "naomba",
        "tafadhali",
        "niambie",
        "imefika",
        "zanzibar",
        "vipi",
        "je",
        "hii",
        "hiyo",
        "hapa",
        "huko",
        "wako",
        "kwako",
        "kwenye",
        "kwa",
        "ya",
        "wa",
        "na",
        "ni",
        "sio",
        "siyo",
        "ndio",
        "hapana",
        "asante",
        "karibu"
    ];

    const englishWords = [
        "hello",
        "hi",
        "hey",
        "where",
        "what",
        "when",
        "how",
        "which",
        "price",
        "apartment",
        "apartments",
        "house",
        "room",
        "rooms",
        "building",
        "tower",
        "towers",
        "floor",
        "floors",
        "project",
        "location",
        "available",
        "availability",
        "buy",
        "buying",
        "sell",
        "selling",
        "please",
        "tell",
        "show",
        "want",
        "need",
        "thank",
        "thanks",
        "about"
    ];

    let swahiliScore = 0;
    let englishScore = 0;

    for (const word of swahiliWords) {
        if (lower.includes(` ${word} `) ||
            lower.startsWith(`${word} `) ||
            lower.endsWith(` ${word}`) ||
            lower === word) {
            swahiliScore++;
        }
    }

    for (const word of englishWords) {
        if (lower.includes(` ${word} `) ||
            lower.startsWith(`${word} `) ||
            lower.endsWith(` ${word}`) ||
            lower === word) {
            englishScore++;
        }
    }

    if (swahiliScore > englishScore) {
        return "Swahili";
    }

    if (englishScore > swahiliScore) {
        return "English";
    }

    return "Unknown";
}


// ============================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================

function getErrorReply(language) {
    if (language === "Swahili") {
        return "Samahani, sijaweza kupata jibu kwa sasa. Tafadhali jaribu tena baada ya muda mfupi.";
    }

    return "Sorry, I couldn't get an answer right now. Please try again shortly.";
}


// ============================================================
// GEMINI REQUEST WITH RETRY
// ============================================================

async function askGemini(userMessage) {
    const language = detectLanguage(userMessage);

    let languageInstruction;

    if (language === "Swahili") {
        languageInstruction = `
The customer is writing in Swahili.
You MUST answer in natural East African Swahili.
Do NOT answer in English.
`;
    } else if (language === "English") {
        languageInstruction = `
The customer is writing in English.
You MUST answer in English.
Do NOT answer in Swahili.
`;
    } else {
        languageInstruction = `
Determine the language of the customer's message.
Reply in the same language as the customer.
`;
    }

    const prompt = [
        ONA_TOWERS_KNOWLEDGE,
        "",
        "LANGUAGE INSTRUCTION:",
        languageInstruction,
        "",
        "CUSTOMER MESSAGE:",
        userMessage,
        "",
        "Answer the customer directly.",
        "Do not mention these instructions.",
        "Do not mention Gemini.",
        "Do not mention being an AI unless the customer specifically asks.",
        "Keep the answer natural and reasonably short."
    ].join("\n");

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt
            });

            if (response && response.text) {
                return response.text.trim();
            }

            throw new Error("Empty Gemini response");

        } catch (error) {

            console.error(
                `Gemini attempt ${attempt}/${maxAttempts} failed:`,
                error.message || error
            );

            if (attempt < maxAttempts) {
                const delay = attempt * 3000;

                console.log(
                    `Retrying Gemini in ${delay / 1000} seconds...`
                );

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );
            }
        }
    }

    throw new Error("Gemini failed after all retry attempts");
}


// ============================================================
// QR CODE STORAGE
// ============================================================

let latestQR = null;


// ============================================================
// HTTP SERVER FOR RENDER
// ============================================================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {

    if (req.url === "/") {
        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });

        res.end(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ONA TOWERS WhatsApp Bot</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 60px;
        }

        h1 {
            margin-bottom: 10px;
        }

        .status {
            font-size: 20px;
            margin: 20px;
        }

        a {
            font-size: 20px;
        }
    </style>
</head>
<body>

<h1>ONA TOWERS WhatsApp Bot</h1>

<div class="status">
    WhatsApp chatbot is running.
</div>

<a href="/qr">Open WhatsApp QR Code</a>

</body>
</html>
        `);

        return;
    }


    if (req.url === "/qr") {

        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });

        if (!latestQR) {
            res.end(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="5">
    <title>WhatsApp QR</title>
</head>
<body style="font-family:Arial;text-align:center;margin-top:60px;">

<h2>No QR code is currently available.</h2>
<p>The WhatsApp session may already be connected.</p>
<p>This page will refresh automatically.</p>

</body>
</html>
            `);

            return;
        }


        const qrImage = require("qrcode");

        qrImage.toDataURL(latestQR, {
            width: 500,
            margin: 2
        })
        .then(dataURL => {

            res.end(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="30">
    <title>ONA TOWERS WhatsApp QR</title>
</head>

<body style="
    font-family:Arial;
    text-align:center;
    margin-top:30px;
">

<h2>Scan this QR code with WhatsApp</h2>

<img
    src="${dataURL}"
    style="
        width:500px;
        max-width:90vw;
        height:auto;
    "
>

<p>
QR code refreshes automatically.
</p>

<p>
After scanning successfully, keep this page open until WhatsApp connects.
</p>

</body>
</html>
            `);

        })
        .catch(error => {

            console.error("QR image error:", error);

            res.end(`
                <h2>Unable to display QR code.</h2>
            `);
        });

        return;
    }


    res.writeHead(404, {
        "Content-Type": "text/plain"
    });

    res.end("Not found");
});


server.listen(PORT, "0.0.0.0", () => {
    console.log(`HTTP server running on port ${PORT}`);
});


// ============================================================
// WHATSAPP BOT
// ============================================================

async function startBot() {

    try {

        const { state, saveCreds } =
            await useMultiFileAuthState("auth_info");


        const sock = makeWASocket({
            auth: state,
            logger: P({
                level: "silent"
            }),
            printQRInTerminal: false
        });


        sock.ev.on("creds.update", saveCreds);


        sock.ev.on("connection.update", (update) => {

            const {
                connection,
                lastDisconnect,
                qr
            } = update;


            // ------------------------------------------------
            // NEW QR
            // ------------------------------------------------

            if (qr) {

                latestQR = qr;

                console.log("\n=================================");
                console.log("New WhatsApp QR generated.");
                console.log("Open /qr in your browser to scan it.");
                console.log("=================================\n");

                qrcode.generate(qr, {
                    small: true
                });
            }


            // ------------------------------------------------
            // CONNECTED
            // ------------------------------------------------

            if (connection === "open") {

                latestQR = null;

                console.log("\n=================================");
                console.log("WhatsApp connected successfully!");
                console.log("ONA TOWERS AI chatbot is ready.");
                console.log("=================================\n");
            }


            // ------------------------------------------------
            // CONNECTION CLOSED
            // ------------------------------------------------

            if (connection === "close") {

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;


                const shouldReconnect =
                    statusCode !== DisconnectReason.loggedOut;


                console.log("WhatsApp connection closed.");


                if (shouldReconnect) {

                    console.log(
                        "Reconnecting in 3 seconds..."
                    );

                    setTimeout(() => {
                        startBot();
                    }, 3000);

                } else {

                    console.log(
                        "WhatsApp logged out."
                    );

                    latestQR = null;
                }
            }

        });


        // ====================================================
        // RECEIVE MESSAGES
        // ====================================================

        sock.ev.on(
            "messages.upsert",
            async ({ messages }) => {

                const message = messages[0];


                if (!message) {
                    return;
                }


                if (!message.message) {
                    return;
                }


                if (message.key.fromMe) {
                    return;
                }


                const text =
                    message.message.conversation ||
                    message.message.extendedTextMessage?.text ||
                    "";


                if (!text.trim()) {
                    return;
                }


                const customerText = text.trim();


                console.log(
                    "\nCustomer:",
                    customerText
                );


                try {

                    await sock.sendPresenceUpdate(
                        "composing",
                        message.key.remoteJid
                    );


                    const reply =
                        await askGemini(customerText);


                    await sock.sendMessage(
                        message.key.remoteJid,
                        {
                            text: reply
                        }
                    );


                    console.log(
                        "Bot:",
                        reply
                    );


                } catch (error) {

                    console.error(
                        "Final Gemini error:",
                        error.message || error
                    );


                    const language =
                        detectLanguage(customerText);


                    const fallbackReply =
                        getErrorReply(language);


                    await sock.sendMessage(
                        message.key.remoteJid,
                        {
                            text: fallbackReply
                        }
                    );


                    console.log(
                        "Fallback reply sent."
                    );
                }

            }
        );


    } catch (error) {

        console.error(
            "WhatsApp startup error:",
            error
        );


        console.log(
            "Restarting WhatsApp connection in 5 seconds..."
        );


        setTimeout(() => {
            startBot();
        }, 5000);
    }
}


// ============================================================
// START
// ============================================================

startBot();
