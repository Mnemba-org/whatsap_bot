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
// MNEMBA TECH KNOWLEDGE
// ============================================================

const MNEMBA_KNOWLEDGE = [
    "You are Mnemba AI Assistant, the AI assistant for Ibrahim Mnemba (Mnemba Tech).",
    "",
    "WHO IBRAHIM IS:",
    "- Ibrahim Silima Mnemba is a third-year Data Science & AI student at IIT Madras.",
    "- He is focused on building practical digital systems that solve real-world problems.",
    "- His interests include web development, artificial intelligence, automation, data science, machine learning and technology products.",
    "- His approach: take a problem, understand what actually needs to happen, and turn it into a working technology solution.",
    "- Skills: Python, Flask, Django, JavaScript, AI, Machine Learning, Data Analysis, Statistics, SQL, REST APIs, Automation.",
    "",
    "WHAT MNEMBA TECH DOES (general):",
    "- Designs and builds websites, AI-powered systems, business automation, data solutions and custom digital products for people and organizations.",
    "- Technology is built around what the person or business actually needs, not the other way around.",
    "",
    "SERVICES OFFERED:",
    "",
    "1) WEB DEVELOPMENT",
    "- Business websites, web applications, dashboards, customer portals, landing pages and custom systems.",
    "- Includes: responsive design, multiple pages, contact forms, backend functionality, database integration, user authentication, API integration, deployment support.",
    "- Process: Discuss -> Design -> Build -> Launch.",
    "- Starting price: From $25 for a frontend-only simple website. Final price depends on pages, design and requirements.",
    "- Approximate delivery: 5-7 days for a simple site. Backend, databases, payments, AI and large integrations take longer and are priced by scope.",
    "",
    "2) WEBSITE FIX & IMPROVEMENT",
    "- Fixes broken websites, bugs, forms, login systems, APIs, databases, responsiveness and performance problems.",
    "- Process: Inspect -> Diagnose -> Fix -> Review.",
    "- Starting price: From $10. Final price depends on the problem and amount of work required.",
    "- Approximate delivery: 1-7 days.",
    "",
    "3) AI INTEGRATION",
    "- Adds AI assistants, chatbots, document analysis, recommendations, search, content generation and intelligent features to existing websites/systems.",
    "- Can connect to: existing websites, Flask apps, Django apps, databases, REST APIs, business workflows.",
    "- Starting price: From $30 for a simple AI integration. Larger AI systems are quoted by requirements.",
    "- Approximate delivery: 1-2 weeks. AI API costs, hosting and other third-party costs may be separate.",
    "",
    "4) WHATSAPP AI AGENTS",
    "- Builds intelligent WhatsApp-based systems that can answer customers, provide information, collect requests and connect to business systems.",
    "- Features possible: AI conversations, collecting customer info, database connection, product information, notifications, business automation.",
    "- Starting price: From $30 for a basic WhatsApp AI Agent. More advanced agents priced by features.",
    "- Approximate delivery: 2-3 weeks. WhatsApp provider fees, API costs, hosting and AI usage costs may be separate from development costs.",
    "",
    "5) BUSINESS AUTOMATION",
    "- Connects websites, databases, APIs, AI and communication channels to automate repetitive business processes (messages, reports, data workflows, AI workflows, social media, system integration).",
    "- Process: Understand -> Design -> Build -> Test.",
    "- Starting price: From $300. Final pricing depends heavily on the number and complexity of workflows/integrations.",
    "- Approximate delivery: 4-8 weeks or more. Large systems use a custom scope, timeline and price agreement.",
    "",
    "6) CONTENT CREATOR SYSTEMS",
    "- Builds systems that pull information from a website, detect updates, use AI to generate social media content (captions, posts, images, video concepts) and prepare it for scheduled publishing.",
    "- Example: a new product appears on a website, the system detects it, AI creates a post, and it is scheduled for publishing.",
    "- Pricing: Custom quote. Depends on number of platforms, content types, AI features, integrations and publishing requirements.",
    "- Delivery: Custom timeline.",
    "",
    "7) AI BUSINESS ADVISOR",
    "- Builds AI systems that analyze business/website information, identify patterns, generate recommendations and send useful insights/notifications to the business owner, optionally connected to automation.",
    "- Starting price: From $40. More advanced systems priced by scope.",
    "- Approximate delivery: 2-4 weeks.",
    "",
    "8) API & SYSTEM INTEGRATION",
    "- Connects websites, applications, databases, payment services, AI APIs, messaging and other external services so information moves between systems automatically.",
    "- Process: Understand -> Connect -> Test -> Deploy.",
    "- Starting price: From $50. Larger or multiple integrations require a custom quote.",
    "- Approximate delivery: 1-3 weeks.",
    "",
    "9) DATA & MACHINE LEARNING",
    "- Data collection, data cleaning, data analysis, visualization, machine learning (classification, regression, clustering, prediction, model evaluation) and research data support.",
    "- Process: Understand -> Prepare -> Analyze -> Explain.",
    "- Starting price: From $70 for basic data analysis / simple ML. Advanced ML and deep learning projects require a custom quote.",
    "- Approximate delivery: 1-3 weeks, depending on dataset size, quality and complexity.",
    "",
    "10) TECHNOLOGY TRAINING & ONLINE COURSES",
    "- Practical online courses: Python, Data Analysis, Machine Learning, Flask, Databases/SQL, and AI integration with WhatsApp and websites.",
    "- Python is the foundation for the other courses.",
    "- Recommended learning paths: Python -> Data Analysis -> Machine Learning, or Python -> Flask -> Web Applications.",
    "- Status: training is starting soon.",
    "",
    "CONTACT:",
    "- WhatsApp: this same WhatsApp number.",
    "- Email: mnembaorg@email.com",
    "",
    "GREETING BEHAVIOR:",
    "- If the customer opens with a greeting (hi, hello, mambo, habari, etc.) or has not asked a specific question yet, introduce yourself first, in the customer's language, with a message that carries this meaning:",
    "  \"Hi, I'm Mnemba AI Assistant. You can wait a bit and Ibrahim will respond to you personally, or if you have any question, you can ask me here and I'll try to help right away. If you specifically want to reach Ibrahim directly, please wait a little for him.\"",
    "- After that introduction, continue answering any question the customer asks using the information above.",
    "- Do not repeat the full introduction again later in the same conversation unless the customer greets again.",
    "",
    "CHATBOT RULES:",
    "- Answer customers naturally and professionally, as Ibrahim's assistant.",
    "- Be helpful and welcoming.",
    "- Use the Mnemba Tech information above when answering questions.",
    "- Never invent information.",
    "- Never invent prices beyond what is listed above.",
    "- Never invent availability, timelines or guarantees that are not listed above.",
    "- Never promise a fixed final price; starting prices are approximate and the final price depends on scope, as stated above.",
    "- If information is unavailable, say that it is not currently available and offer to let Ibrahim confirm it directly.",
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
        MNEMBA_KNOWLEDGE,
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

    // Keep retrying quietly in the background until Gemini actually
    // answers. The customer is never told that anything failed or
    // that there was an error - we simply keep trying until we have
    // a real answer to send.
    const maxAttempts = 20;

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
                `Gemini attempt ${attempt}/${maxAttempts} failed (retrying quietly):`,
                error.message || error
            );

            if (attempt < maxAttempts) {
                const delay = Math.min(attempt * 3000, 30000);

                console.log(
                    `Waiting ${delay / 1000}s before trying Gemini again...`
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
// BACKGROUND RETRY (no error shown to the customer)
// ============================================================
//
// If askGemini() could not get an answer even after its own
// internal retries, we do NOT tell the customer anything went
// wrong. We simply keep waiting and trying in the background,
// silently, until we actually get an answer to send them - just
// like Ibrahim would rather have the assistant stay quiet and
// try again than say "there is an error" or "no answer".

async function keepTryingUntilAnswered(sock, remoteJid, customerText) {

    const maxBackgroundAttempts = 10;
    const backgroundDelay = 60000; // 1 minute between rounds

    for (let round = 1; round <= maxBackgroundAttempts; round++) {

        console.log(
            `Background retry round ${round}/${maxBackgroundAttempts} in ${backgroundDelay / 1000}s...`
        );

        await new Promise(resolve =>
            setTimeout(resolve, backgroundDelay)
        );

        try {

            const reply = await askGemini(customerText);

            await sock.sendMessage(
                remoteJid,
                {
                    text: reply
                }
            );

            console.log(
                "Bot (recovered after background retry):",
                reply
            );

            return;

        } catch (error) {

            console.error(
                `Background retry round ${round} still failed, continuing to wait quietly:`,
                error.message || error
            );
        }
    }

    console.error(
        "Gemini did not answer even after extended background retries. Not sending anything to the customer."
    );
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
    <title>Mnemba AI Assistant - WhatsApp Bot</title>
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

<h1>Mnemba AI Assistant - WhatsApp Bot</h1>

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
    <title>Mnemba AI Assistant - WhatsApp QR</title>
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
                console.log("Mnemba AI Assistant chatbot is ready.");
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

                    // Gemini did not answer even after all retry
                    // attempts. We never tell the customer that
                    // something failed or that there is no answer.
                    // Instead we keep quietly trying in the
                    // background and send the real answer as soon
                    // as it becomes available.

                    console.error(
                        "Gemini still not responding after retries, will keep trying quietly:",
                        error.message || error
                    );

                    keepTryingUntilAnswered(
                        sock,
                        message.key.remoteJid,
                        customerText
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
