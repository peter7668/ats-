require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));

app.use(express.json({ limit: "10mb" }));

// ─────────────────────────────────────────────
// Grok (xAI) API Proxy
// ─────────────────────────────────────────────
app.post("/api/grok", async (req, res) => {
  try {
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GROK_API_KEY not set in environment variables",
      });
    }

    const { system, user, maxTokens = 2000 } = req.body;

    if (!user) {
      return res.status(400).json({ error: "User message is required" });
    }

    const messages = [];

    if (system) {
      messages.push({ role: "system", content: system });
    }

    messages.push({ role: "user", content: user });

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Grok API error",
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    res.json({ text });

  } catch (err) {
    console.error("Grok proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    model: "grok-beta",
    grokKey: process.env.GROK_API_KEY ? "✓ configured" : "✗ MISSING",
  });
});

// ─────────────────────────────────────────────
// Serve React Frontend (FIXED PATH)
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
  console.log(`Build Path  : ${buildPath}`);
  console.log(`Grok API    : ${process.env.GROK_API_KEY ? "✓ Loaded" : "✗ Missing"}`);
  console.log("────────────────────────────\n");
});
