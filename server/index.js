require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
 
const app = express();
const PORT = process.env.PORT || 4000;
 
app.use(cors());
app.use(express.json({ limit: "10mb" }));
 
// ── Gemini API Proxy ──────────────────────────────────────────────────────
app.post("/api/gemini", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set in environment variables" });
    }
 
    const { system, user, maxTokens = 2000 } = req.body;
 
    const prompt = system ? `${system}\n\n${user}` : user;
 
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        }),
      }
    );
 
    const data = await response.json();
 
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Gemini API error" });
    }
 
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ text });
  } catch (err) {
    console.error("Gemini proxy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
 
// ── Health check ──────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    geminiKey: process.env.GEMINI_API_KEY ? "✓ configured" : "✗ MISSING",
  });
});
 
// ── Serve React build ─────────────────────────────────────────────────────
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});
 
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 ATS Resume Builder Pro (Gemini)`);
  console.log(`   Port     : ${PORT}`);
  console.log(`   Gemini   : ${process.env.GEMINI_API_KEY ? "✓ loaded" : "✗ MISSING"}`);
});
 
