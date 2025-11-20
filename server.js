// server.js
// Netbhet Realtime Token Server for Render (OpenAI Realtime GA)

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000; // Render sets PORT

app.use(cors());

// Health-check
app.get("/", (req, res) => {
  res.send("Netbhet Realtime Token Server is running ✅");
});

// Frontend calls this to get an ephemeral key
app.get("/session", async (req, res) => {
  try {
    const level = req.query.level || "Unknown";

    // All session configuration goes here
    const sessionConfig = {
      session: {
        type: "realtime",
        model: "gpt-realtime", // make sure this exists on your account
        instructions:
          "You are 'Netbhet English Speaking Coach', a friendly Indian tutor helping Marathi-speaking students improve English speaking. " +
          "Speak mostly in simple English but give corrections and explanations in Marathi. " +
          "Keep each response short (3–5 sentences). After every response, give 1–2 specific suggestions in Marathi like 'इथे tense चूक झाली' किंवा 'इथे article लागतो'. " +
          "Student level: " + level + ". Make the difficulty match this level.",
        modalities: ["audio", "text"],
        input_audio_format: "opus",
        output_audio_format: "opus",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 700
        }
      }
    };

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionConfig)
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("Error from OpenAI client_secrets:", data);
      return res.status(r.status).json(data);
    }

    // data.value or data.client_secret.value = ephemeral key (ek_...)
    res.json(data);
  } catch (err) {
    console.error("Error calling OpenAI client_secrets:", err);
    res.status(500).json({ error: "Failed to create ephemeral client secret" });
  }
});

app.listen(PORT, () => {
  console.log(`Netbhet token server listening on port ${PORT}`);
});
