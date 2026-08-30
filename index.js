```javascript
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");
const http = require("http");

require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");


/* ============================================================
   GEMINI
============================================================ */

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


/* ============================================================
   ONA TOWERS KNOWLEDGE
============================================================ */

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
    "LANGUAGE RULES:",
    "- Detect the language used by the customer.",
    "- If the customer writes in English, reply entirely in English.",
    "- If the customer writes in Swahili, reply entirely in Swahili.",
    "- If the customer mixes English and Swahili, use the dominant language of the customer's message.",
    "- Do not switch to another language unnecessarily.",
    "- Keep the same language throughout the reply unless the customer asks for another language."
].join("\n");


/* ============================================================
   GEMINI REQUEST WITH RETRIES
============================================================ */

async function askGemini(userMessage) {

    const prompt = [
        ONA_TOWERS_KNOWLEDGE,
        "",
        "CUSTOMER MESSAGE:",
        userMessage,
        "",
        "Answer the customer directly."
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


            throw new Error(
                "Gemini returned an empty response."
            );


        } catch (error) {

            console.error(
                `Gemini attempt ${attempt}/${maxAttempts} failed:`,
                error?.message || error
            );


            if (attempt < maxAttempts) {

                const waitTime = attempt * 3000;


                console.log(
                    `Retrying Gemini in ${waitTime / 1000} seconds...`
                );


                await new Promise(resolve =>
                    setTimeout(resolve, waitTime)
                );
            }
        }
    }


    return null;
}


/* ============================================================
   FALLBACK RESPONSE
============================================================ */

function getFallbackReply(userMessage) {

    const text = userMessage.toLowerCase();


    const swahiliWords = [
        "habari",
        "mambo",
        "ipo",
        "wapi",
        "bei",
        "gharama",
        "nyumba",
        "vyumba",
        "ghorofa",
        "mradi",
        "ona tower",
        "ona towers",
        "zanzibar",
        "unapatikana",
        "inapatikana",
        "ni kiasi",
        "shilingi",
        "chumba",
        "vyumba"
    ];


    const isSwahili = swahiliWords.some(word =>
        text.includes(word)
    );


    if (isSwahili) {

        return "Karibu ONA TOWERS Zanzibar. Tafadhali niambie ungependa kujua nini kuhusu mradi wetu, kama vile vyumba, ukubwa wa apartments, views au penthouses.";

    }


    return "Welcome to ONA TOWERS, Zanzibar. Please tell me what you would like to know about the development, such as apartments, sizes, views, or penthouses.";
}


/* ============================================================
   QR CODE FOR BROWSER
============================================================ */

let latestQR = null;
let qrImageData = null;


async function updateQR(qr) {

    latestQR = qr;


    try {

        qrImageData = await QRCode.toDataURL(qr, {
            width: 500,
            margin: 2
        });


        console.log(
            "Browser QR code updated."
        );

    } catch (error) {

        console.error(
            "Could not generate browser QR:",
            error?.message || error
        );
    }
}


/* ============================================================
   HTTP SERVER FOR RENDER
============================================================ */

const PORT = process.env.PORT || 10000;


const server = http.createServer(
    async (req, res) => {


        /* ----------------------------------------------------
           QR PAGE
        ---------------------------------------------------- */

        if (req.url === "/qr") {

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8"
            });


            if (qrImageData) {

                res.end(`
<!DOCTYPE html>
<html>
<head>

<meta name="viewport"
      content="width=device-width, initial-scale=1">

<title>ONA TOWERS WhatsApp QR</title>

<style>

body {
    font-family: Arial, sans-serif;
    text-align: center;
    background: #f5f5f5;
    margin: 0;
    padding: 30px;
}

.container {
    max-width: 700px;
    margin: auto;
    background: white;
    padding: 25px;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

img {
    width: 500px;
    max-width: 90vw;
    height: auto;
}

h1 {
    margin-bottom: 10px;
}

p {
    color: #555;
}

</style>

</head>

<body>

<div class="container">

<h1>ONA TOWERS WhatsApp</h1>

<p>Scan this QR code with the WhatsApp phone.</p>

<img src="${qrImageData}" />

<p>Keep this page open while scanning.</p>

</div>

</body>
</html>
                `);

            } else {

                res.end(`
<!DOCTYPE html>
<html>

<head>

<meta name="viewport"
      content="width=device-width, initial-scale=1">

<meta http-equiv="refresh" content="5">

<title>ONA TOWERS QR</title>

</head>

<body style="
    font-family: Arial;
    text-align: center;
    padding: 50px;
">

<h1>ONA TOWERS WhatsApp</h1>

<p>Waiting for a new WhatsApp QR code...</p>

<p>This page will refresh automatically.</p>

</body>

</html>
                `);
            }


            return;
        }


        /* ----------------------------------------------------
           HEALTH CHECK
        ---------------------------------------------------- */

        res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8"
        });


        res.end(
            "ONA TOWERS WhatsApp AI chatbot is running."
        );
    }
);


server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `HTTP server running on port ${PORT}`
        );

    }
);


/* ============================================================
   WHATSAPP BOT
============================================================ */

async function startBot() {

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(
        "auth_info"
    );


    const sock = makeWASocket({

        auth: state,

        logger: P({
            level: "silent"
        }),

        printQRInTerminal: false
    });


    sock.ev.on(
        "creds.update",
        saveCreds
    );


    sock.ev.on(
        "connection.update",
        async (update) => {

            const {
                connection,
                lastDisconnect,
                qr
            } = update;


            /* ------------------------------------------------
               NEW QR
            ------------------------------------------------ */

            if (qr) {

                console.log(
                    "\nNew WhatsApp QR generated."
                );


                console.log(
                    "Open /qr in your browser to scan it."
                );


                qrcodeTerminal.generate(
                    qr,
                    {
                        small: true
                    }
                );


                await updateQR(qr);
            }


            /* ------------------------------------------------
               CONNECTED
            ------------------------------------------------ */

            if (connection === "open") {

                console.log(
                    "\n================================="
                );


                console.log(
                    "WhatsApp connected successfully!"
                );


                console.log(
                    "ONA TOWERS AI chatbot is ready."
                );


                console.log(
                    "=================================\n"
                );
            }


            /* ------------------------------------------------
               DISCONNECTED
            ------------------------------------------------ */

            if (connection === "close") {

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;


                const shouldReconnect =
                    statusCode !==
                    DisconnectReason.loggedOut;


                console.log(
                    "WhatsApp connection closed."
                );


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
                }
            }
        }
    );


    /* ========================================================
       RECEIVE MESSAGES
    ======================================================== */

    sock.ev.on(
        "messages.upsert",
        async ({ messages }) => {


            const message = messages[0];


            if (!message)
                return;


            if (!message.message)
                return;


            if (message.key.fromMe)
                return;


            const text =
                message.message.conversation ||
                message.message.extendedTextMessage?.text ||
                "";


            if (!text.trim())
                return;


            const chatId =
                message.key.remoteJid;


            console.log(
                "\nCustomer:",
                text
            );


            try {


                await sock.sendPresenceUpdate(
                    "composing",
                    chatId
                );


                const reply =
                    await askGemini(text);


                /* --------------------------------------------
                   NORMAL GEMINI RESPONSE
                -------------------------------------------- */

                if (reply) {

                    await sock.sendMessage(
                        chatId,
                        {
                            text: reply
                        }
                    );


                    console.log(
                        "Bot:",
                        reply
                    );


                }


                /* --------------------------------------------
                   GEMINI FAILED AFTER RETRIES
                -------------------------------------------- */

                else {

                    const fallback =
                        getFallbackReply(text);


                    await sock.sendMessage(
                        chatId,
                        {
                            text: fallback
                        }
                    );


                    console.log(
                        "Fallback:",
                        fallback
                    );
                }


            } catch (error) {


                console.error(
                    "Message handling error:",
                    error?.message || error
                );


                try {


                    const fallback =
                        getFallbackReply(text);


                    await sock.sendMessage(
                        chatId,
                        {
                            text: fallback
                        }
                    );


                } catch (sendError) {

                    console.error(
                        "Could not send fallback message:",
                        sendError?.message || sendError
                    );
                }
            }
        }
    );
}


/* ============================================================
   START BOT
============================================================ */

startBot();
```
