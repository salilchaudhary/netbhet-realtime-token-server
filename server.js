// server.js
// Tiny backend to mint ephemeral keys for OpenAI Realtime (for Netbhet)

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000; // Render will set PORT env var

// Allow your Weebly page to call this backend
app.use(cors());

// Simple health-check
app.get("/", (req, res) => {
res.send("Netbhet Realtime Token Server is running ✅");
});

// Frontend calls /session to get a short-lived key
app.get("/session", async (req, res) => {
try {
const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
method: "POST",
headers: {
"Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // REAL key (server-only)
"Content-Type": "application/json"
},
body: JSON.stringify({
session: {
type: "realtime",
model: "gpt-realtime" // or your exact realtime model name if different
}
})
});

const data = await r.json();

if (!r.ok) {
console.error("Error from OpenAI client_secrets:", data);
return res.status(r.status).json(data);
}

// data.value or data.client_secret.value will contain the ephemeral key (starts with ek_...)
res.json(data);
} catch (err) {
console.error("Error calling OpenAI client_secrets:", err);
res.status(500).json({ error: "Failed to create ephemeral client secret" });
}
});

app.listen(PORT, () => {
console.log(`Netbhet token server listening on port ${PORT}`);
});
