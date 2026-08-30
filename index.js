const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


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

            throw new Error("Gemini returned an empty response.");

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

            } else {

                console.error(
                    "Gemini failed after all retry attempts."
                );
            }
        }
    }


    return null;
}



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
        "apartimenti",
        "ghorofa",
        "mradi",
        "ona tower",
        "ona towers",
        "zanzibar",
        "unapatikana",
        "inapatikana",
        "ni kiasi",
        "shilingi"
    ];

    const isSwahili = swahiliWords.some(word =>
        text.includes(word)
    );


    if (isSwahili) {

        return "Karibu ONA TOWERS Zanzibar. Tafadhali niambie ungependa kujua nini kuhusu mradi wetu, kama vile vyumba, ukubwa wa apartments, views au penthouses.";

    }


    return "Welcome to ONA TOWERS, Zanzibar. Please tell me what you would like to know about the development, such as apartments, sizes, views, or penthouses.";
}



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

            console.log(
                "\nNew WhatsApp QR generated."
            );

            console.log(
                "Open /qr in your browser to scan it."
            );

            qrcode.generate(qr, {
                small: true
            });
        }


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


        if (connection === "close") {

            const statusCode =
                lastDisconnect?.error?.output?.statusCode;


            const shouldReconnect =
                statusCode !== DisconnectReason.loggedOut;


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


            if (!message || !message.message)
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

                } else {

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



startBot();
