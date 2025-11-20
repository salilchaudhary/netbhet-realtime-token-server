// server.js
// Netbhet Realtime Token Server for Render (OpenAI Realtime GA)

import express from "express";
import cors from "cors";

const app = express();
// Render will provide PORT via env variable
const PORT = process.env.PORT || 10000;

// Allow requests from your Weebly site (for now allow all; later you can restrict by origin)
app.use(cors());

// Health-check route
app.get("/", (req, res) => {
  res.send("Netbhet Realtime Token Server is running ✅");
});

// Frontend calls this to get an ephemeral realtime key
app.get("/session", async (req, res) => {
  try {
    // You can pass student's level from frontend as ?level=Beginner / Intermediate etc.
    const level = req.query.level || "Unknown";

    // Minimal, valid session config for client_secrets
    const sessionConfig = {
      session: {
        type: "realtime",
        model: "gpt-4o-realtime-preview-2024-10-01", // 👈 make sure this model exists on your OpenAI account
        instructions:
          "You are 'Netbhet English Speaking Coach', a friendly Indian tutor helping Marathi-speaking students improve English speaking. " +
          "Speak mostly in simple English but give corrections and explanations in Marathi. " +
          "Keep each response short (3–5 sentences). After every response, give 1–2 specific suggestions in Marathi like 'इथे tense चूक झाली' किंवा 'इथे article लागतो'. " +
          "Student level: " + level + ". Make the difficulty match this level."
        // IMPORTANT:
        // Do NOT include modalities / input_audio_format / output_audio_format / turn_detection here.
        // Those extra fields caused the 'Unknown parameter: session.modalities' error.
      }
    };

    // Call OpenAI Realtime client_secrets to get an ephemeral key (ek_...)
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // REAL key from Render env
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionConfig)
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

