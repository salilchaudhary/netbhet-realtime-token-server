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
        const voiceType = req.query.voice || "female"; // 'male' or 'female'
        const style = req.query.style || "casual"; // 'strict', 'casual', 'funny'

        // 2. CONFIGURE VOICE & PERSONA
        // OpenAI Voices: 'ash' (Male/Deep), 'coral' (Female/Friendly)
        const selectedVoice = voiceType === 'male' ? 'ash' : 'coral';
        const assistantName = voiceType === 'male' ? 'Rahul' : 'Riya';

        // 3. DEFINE BEHAVIORS
        let styleInstructions = "";
        if (style === 'strict') {
            styleInstructions = "Be formal and strict. Correct EVERY grammar mistake immediately. Do not use slang. Act like a serious professor.";
        } else if (style === 'funny') {
            styleInstructions = "Be humorous and lighthearted. Crack a joke occasionally. Keep the mood very fun and energetic.";
        } else {
            // Casual (Default)
            styleInstructions = "Be friendly, casual, and supportive. Like a helpful friend. Focus on flow rather than perfection.";
        }

        // 4. CONSTRUCT THE MASTER PROMPT
        const systemInstructions = `
            You are ${assistantName}, an English language coach for a Marathi-speaking student named ${name}.
            The student's English level is: ${level}.
            
            YOUR TEACHING STYLE: ${styleInstructions}

            CRITICAL RULES:
            1. **GREETING:** You must start the conversation immediately with this EXACT structure:
               "Namaskar ${name}! Mi ${assistantName} aahe. Aapan English speaking practice suru karu ya ka? (Shall we start?)"
            
            2. **EXPLAIN HOW TO START:** After the greeting, briefly tell them in MARATHI: "Just speak normally into the mic, and I will reply."

            3. **LANGUAGE:** - Speak primarily in English to practice.
               - If they make a mistake, correct them gently in English, then explain the rule in MARATHI.
            
            4. **GHOST WORD PROTECTION:** If you hear silence or random noise, DO NOT say "Thank you" or "Bye". Just wait.
        `;

        const sessionConfig = {
            model: "gpt-4o-realtime-preview-2024-10-01", 
            voice: selectedVoice,
            instructions: systemInstructions,
            
            // Turn Detection (Fix for Ghost Words)
            turn_detection: {
                type: "server_vad",
                threshold: 0.6, // Higher = less sensitive to background noise
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
