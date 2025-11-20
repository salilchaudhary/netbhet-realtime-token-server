import express from "express";
import cors from "cors";

// NOTE: Node.js 18+ has built-in 'fetch'. 
// If using Node < 18, uncomment the next line and run 'npm install node-fetch'
// import fetch from "node-fetch"; 

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get("/", (req, res) => {
    res.send("Netbhet Realtime Token Server is running");
});

app.get("/session", async (req, res) => {
    try {
        // 1. CAPTURE INPUTS FROM FRONTEND
        const level = req.query.level || "Intermediate";
        const name = req.query.name || "Student";
        // voiceType now accepts exact voice names (e.g., 'alloy', 'echo')
        const voiceType = req.query.voice || "coral"; 
        const style = req.query.style || "casual"; 

        // 2. VALIDATE VOICE
        // These are the 8 voices currently supported by OpenAI Realtime API
        const validVoices = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];
        const selectedVoice = validVoices.includes(voiceType) ? voiceType : "coral";

        // Auto-assign name based on voice tone roughly (Male/Female sounding)
        // Male-sounding: alloy, ash, echo, verse
        // Female-sounding: ballad, coral, sage, shimmer
        const maleVoices = ["alloy", "ash", "echo", "verse"];
        const assistantName = maleVoices.includes(selectedVoice) ? "Rahul" : "Riya";

        // 3. DEFINE BEHAVIORS
        let styleInstructions = "";
        if (style === 'strict') {
            styleInstructions = "Be formal and strict. Correct EVERY grammar mistake immediately. Act like a serious professor.";
        } else if (style === 'funny') {
            styleInstructions = "Be humorous and lighthearted. Crack a joke occasionally. Keep the mood very fun.";
        } else {
            styleInstructions = "Be friendly, casual, and supportive. Like a helpful friend.";
        }

        // 4. MASTER PROMPT
        const systemInstructions = `
            You are ${assistantName}, an English language coach for a Marathi-speaking student named ${name}.
            The student's English level is: ${level}.
            
            YOUR TEACHING STYLE: ${styleInstructions}

            CRITICAL RULES:
            1. **GREETING:** Start immediately with: "Namaskar ${name}! Mi ${assistantName} aahe. Aapan English speaking practice suru karu ya ka?"
            2. **EXPLAIN:** Briefly tell them in MARATHI to just speak normally.
            3. **LANGUAGE:** Speak primarily in English. Explain mistakes in MARATHI.
            
            4. **SAFETY & MODERATION:** - Keep conversation clean. NO politics, religion, or profanity.
               - If user is inappropriate, change the topic politely.
            
            5. **NOISE HANDLING:** - If audio is unclear, stay silent. DO NOT hallucinate "Thank you".
        `;

        const sessionConfig = {
            model: "gpt-4o-realtime-preview-2024-10-01", 
            voice: selectedVoice,
            instructions: systemInstructions,
            
            // AGGRESSIVE NOISE FILTERING
            turn_detection: {
                type: "server_vad",
                threshold: 0.75, 
                prefix_padding_ms: 300, 
                silence_duration_ms: 1000, 
                create_response: true
            },

            input_audio_transcription: {
                model: "whisper-1"
            }
        };

        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(sessionConfig),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenAI Token Error:", data);
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => console.log(`Token server running on port ${PORT}`));
