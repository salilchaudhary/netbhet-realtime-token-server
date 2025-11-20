import express from "express";
import cors from "cors";
// Note: Node.js 18+ has built-in fetch. If using older Node, npm install node-fetch
// import fetch from "node-fetch"; 

const app = express();
const PORT = process.env.PORT || 10000;

// Allow Weebly and your S3 domain to access this server
app.use(cors());

app.get("/", (req, res) => {
    res.send("Netbhet Realtime Token Server is running");
});

app.get("/session", async (req, res) => {
    try {
        const level = req.query.level || "Intermediate";
        
        // CONFIGURATION FOR THE SESSION
        const sessionConfig = {
            model: "gpt-4o-realtime-preview-2024-10-01", // CRITICAL FIX: Updated Model Name
            voice: "alloy",
            instructions: `You are an English language coach. The student's level is ${level}. Speak clearly. If they make a mistake, gently correct them. Keep responses concise.`
        };

        const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(sessionConfig),
        });

        const data = await r.json();

        if (!r.ok) {
            console.error("OpenAI API Error:", data);
            return res.status(r.status).json(data);
        }

        // Return the Ephemeral Key to the frontend
        res.json(data);

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Failed to create ephemeral key" });
    }
});

app.listen(PORT, () => console.log(`Token server running on port ${PORT}`));
