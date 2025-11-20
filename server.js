I apologize for the display issues. I am pasting the **Backend Code (`server.js`)** here as plain text.

To address your new requirements, I have added a **"Safety & Moderation"** section to the AI's instructions.

### **What is new in this code?**

1.  **Safety Filters:** I added strict rules to block profanity, politics, religion, and adult topics. If the user tries to discuss them, the AI will politely steer the conversation back to English practice.
2.  **Aggressive Noise Cancellation:** I kept the `threshold: 0.75` setting to stop the "ghost words" (the AI responding to silence).
3.  **Persona Switching:** It still supports the Male/Female and Strict/Funny options we built earlier.

### **Full Backend Code (`server.js`)**

**Action:** Copy the code below, replace your current `server.js`, and **Redeploy on Render**.

```javascript
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
        // 1. CAPTURE INPUTS
        const level = req.query.level || "Intermediate";
        const name = req.query.name || "Student";
        const voiceType = req.query.voice || "female"; 
        const style = req.query.style || "casual"; 

        // 2. CONFIGURE VOICE & PERSONA
        const selectedVoice = voiceType === 'male' ? 'ash' : 'coral';
        const assistantName = voiceType === 'male' ? 'Rahul' : 'Riya';

        // 3. DEFINE BEHAVIORS
        let styleInstructions = "";
        if (style === 'strict') {
            styleInstructions = "Be formal and strict. Correct EVERY grammar mistake immediately. Act like a serious professor.";
        } else if (style === 'funny') {
            styleInstructions = "Be humorous and lighthearted. Crack a joke occasionally. Keep the mood very fun.";
        } else {
            styleInstructions = "Be friendly, casual, and supportive. Like a helpful friend.";
        }

        // 4. MASTER PROMPT (With Safety & Noise Filters)
        const systemInstructions = `
            You are ${assistantName}, an English language coach for a Marathi-speaking student named ${name}.
            The student's English level is: ${level}.
            
            YOUR TEACHING STYLE: ${styleInstructions}

            CRITICAL RULES:
            1. **GREETING:** Start immediately with: "Namaskar ${name}! Mi ${assistantName} aahe. Aapan English speaking practice suru karu ya ka?"
            2. **EXPLAIN:** Briefly tell them in MARATHI to just speak normally.
            3. **LANGUAGE:** Speak primarily in English. Explain mistakes in MARATHI.
            
            4. **SAFETY & MODERATION (STRICT):** - Keep the conversation strictly family-friendly and clean.
               - PROHIBITED TOPICS: Politics, Religion, Violence, Sexual Content, Drugs, or Profanity.
               - If the student uses bad words or brings up prohibited topics, calmly say: "Let's keep our conversation clean and focus on English practice," and change the topic.
            
            5. **NOISE HANDLING:** - If the audio is unclear, muffled, or sounds like breathing/static, DO NOT RESPOND with "Thank you", "Bye", or "Okay".
               - Just stay silent.
        `;

        const sessionConfig = {
            model: "gpt-4o-realtime-preview-2024-10-01", 
            voice: selectedVoice,
            instructions: systemInstructions,
            
            // ============================================================
            // AGGRESSIVE NOISE FILTERING (VAD SETTINGS)
            // ============================================================
            turn_detection: {
                type: "server_vad",
                
                // 1. SENSITIVITY (0.0 to 1.0)
                // Default is 0.5. We set 0.75 to block background noise.
                threshold: 0.75, 
                
                // 2. PREFIX PADDING
                // Reduces the "buffer" audio before you speak, cutting out breathing sounds.
                prefix_padding_ms: 300, 
                
                // 3. SILENCE DURATION
                // Wait 1 second of silence before responding.
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
```
