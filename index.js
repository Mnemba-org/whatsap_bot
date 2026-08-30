const http = require("http");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");

require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

let latestQR = null;
let whatsappConnected = false;

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
    "- Answer in the same language used by the customer when possible."
].join("\n");


async function askGemini(userMessage) {

    const prompt = [
        ONA_TOWERS_KNOWLEDGE,
        "",
        "CUSTOMER MESSAGE:",
        userMessage,
        "",
        "Answer the customer directly."
    ].join("\n");

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
    });

    return response.text;
}


// ============================================================
// HTTP SERVER
// ============================================================

const PORT = process.env.PORT || 10000;

const server = http.createServer(async (req, res) => {

    // Home page
    if (req.url === "/") {

        res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8"
        });

        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>ONA TOWERS WhatsApp Bot</title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 40px;
                        background: #f5f5f5;
                    }

                    .box {
                        background: white;
                        max-width: 500px;
                        margin: auto;
                        padding: 30px;
                        border-radius: 15px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    }

                    a {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 25px;
                        background: #25D366;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                    }
                </style>
            </head>

            <body>

                <div class="box">

                    <h1>ONA TOWERS</h1>

                    <h2>WhatsApp AI Bot</h2>

                    <p>
                        Status:
                        <strong>
                            ${whatsappConnected ? "Connected" : "Waiting for WhatsApp"}
                        </strong>
                    </p>

                    ${
                        whatsappConnected
                            ? "<p>WhatsApp is already connected.</p>"
                            : '<a href="/qr">Open WhatsApp QR Code</a>'
                    }

                </div>

            </body>
            </html>
        `);

        return;
    }


    // QR page
    if (req.url === "/qr") {

        if (whatsappConnected) {

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8"
            });

            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>WhatsApp Connected</title>
                </head>

                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding: 50px;
                ">

                    <h1>WhatsApp Connected ✅</h1>

                    <p>ONA TOWERS chatbot is already connected.</p>

                </body>
                </html>
            `);

            return;
        }


        if (!latestQR) {

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8"
            });

            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <meta http-equiv="refresh" content="3">
                </head>

                <body style="
                    font-family: Arial;
                    text-align: center;
                    padding: 50px;
                ">

                    <h2>Waiting for WhatsApp QR code...</h2>

                    <p>This page will refresh automatically.</p>

                </body>
                </html>
            `);

            return;
        }


        try {

            const qrDataURL = await QRCode.toDataURL(latestQR, {
                width: 500,
                margin: 4
            });

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8"
            });

            res.end(`
                <!DOCTYPE html>

                <html>

                <head>

                    <meta name="viewport"
                          content="width=device-width, initial-scale=1">

                    <title>Scan WhatsApp QR</title>

                    <style>

                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            background: #f5f5f5;
                            padding: 20px;
                        }

                        .container {
                            background: white;
                            max-width: 600px;
                            margin: auto;
                            padding: 25px;
                            border-radius: 15px;
                            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        }

                        img {
                            width: 100%;
                            max-width: 500px;
                            height: auto;
                        }

                        .instructions {
                            text-align: left;
                            max-width: 450px;
                            margin: 20px auto;
                        }

                    </style>

                </head>

                <body>

                    <div class="container">

                        <h1>ONA TOWERS</h1>

                        <h2>Scan WhatsApp QR Code</h2>

                        <img src="${qrDataURL}" alt="WhatsApp QR Code">

                        <div class="instructions">

                            <h3>How to connect:</h3>

                            <ol>

                                <li>
                                    Open WhatsApp on your phone.
                                </li>

                                <li>
                                    Go to Settings.
                                </li>

                                <li>
                                    Select Linked Devices.
                                </li>

                                <li>
                                    Select Link a Device.
                                </li>

                                <li>
                                    Scan the QR code above.
                                </li>

                            </ol>

                        </div>

                        <p>
                            The page will automatically refresh
                            when the connection status changes.
                        </p>

                    </div>

                </body>

                </html>
            `);

        } catch (error) {

            console.error("QR generation error:", error);

            res.writeHead(500, {
                "Content-Type": "text/plain"
            });

            res.end("Unable to generate QR code.");

        }

        return;
    }


    // Health check
    if (req.url === "/health") {

        res.writeHead(200, {
            "Content-Type": "text/plain"
        });

        res.end("ONA TOWERS WhatsApp bot is running");

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


        if (qr) {

            latestQR = qr;

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

        }


        if (connection === "open") {

            whatsappConnected = true;

            latestQR = null;

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


        if (connection === "close") {

            whatsappConnected = false;

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
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

    });


    sock.ev.on(
        "messages.upsert",
        async ({ messages }) => {

            const message = messages[0];


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


            console.log(
                "\nCustomer:",
                text
            );


            try {

                await sock.sendPresenceUpdate(
                    "composing",
                    message.key.remoteJid
                );


                const reply =
                    await askGemini(text);


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
                    "Gemini error:",
                    error
                );


                await sock.sendMessage(
                    message.key.remoteJid,
                    {
                        text:
                            "Sorry, I'm having a temporary problem. Please try again shortly."
                    }
                );

            }

        }
    );

}


startBot();
