require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────
// Groq Setup
// ─────────────────────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));

app.use(express.json({ limit: "10mb" }));

// ─────────────────────────────────────────────
// Groq AI API Route
// ─────────────────────────────────────────────
app.post("/api/groq", async (req, res) => {
  try {
    const { system, user, maxTokens = 800 } = req.body;

    if (!user) {
      return res.status(400).json({ error: "User message is required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: system || "You are an ATS resume assistant that analyzes resumes and gives structured output.",
        },
        {
          role: "user",
          content: user.slice(0, 4000), // token control
        },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    const text = completion.choices[0]?.message?.content || "";

    res.json({ text });

  } catch (err) {
    console.error("Groq API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    model: "llama-3.1-8b-instant",
    groqKey: process.env.GROQ_API_KEY ? "✓ configured" : "✗ MISSING",
  });
});

// ─────────────────────────────────────────────
// Serve React Build
// ─────────────────────────────────────────────
const buildPath = path.resolve(__dirname, "../build");

app.use(express.static(buildPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n🚀 ATS Resume Builder Pro");
  console.log("────────────────────────────");
  console.log(`Port        : ${PORT}`);
  console.log(`Model       : Groq (LLaMA 3)`);
  console.log(`Build Path  : ${buildPath}`);
  console.log(`Groq API    : ${process.env.GROQ_API_KEY ? "✓ Loaded" : "✗ Missing"}`);
  console.log("────────────────────────────\n");
});
