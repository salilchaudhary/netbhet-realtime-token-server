import express from "express";
import cors from "cors";

// NOTE: Node.js 18+ has built-in 'fetch'.
// If using Node < 18, uncomment the next line and run 'npm install node-fetch'
// import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS for Weebly access
app.use(cors());

// Health Check
app.get("/", (req, res) => {
    res.send("Netbhet Realtime Token Server is running");
});

// Session Endpoint
app.get("/session", async (req, res) => {
    try {
        // 1. Get level from query param
        const level = req.query.level || "Intermediate";

        // 2. Configure Session
        // UPDATED: Instructions now request Marathi feedback
        const sessionConfig = {
            model: "gpt-4o-realtime-preview-2024-10-01",
            voice: "alloy",
            instructions: `You are a helpful English language coach for a Marathi-speaking student.
            The student's English level is ${level}.

            Rules:
            1. Conduct the conversation primarily in English to help them practice.
            2. Speak clearly and slowly.
            3. If the student makes a mistake, correct them gently and explain the correction in MARATHI.
            4. Keep your responses concise and encouraging.`
        };

        // 3. Get Token from OpenAI
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(sessionConfig),
        });

        const data = await response.json();

        // 4. Error Handling
        if (!response.ok) {
            console.error("OpenAI Token Error:", data);
            return res.status(response.status).json(data);
        }

        // 5. Success
        res.json(data);

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => console.log(`Token server running on port ${PORT}`));
