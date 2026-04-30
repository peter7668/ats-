require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Groq API Proxy (Agent-based models) ────────────────────────────────
app.post("/api/groq", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GROQ_API_KEY not set in environment variables" });
    }

    let { system, user, maxTokens = 2000, agent } = req.body;

    // 🧠 MODEL MAPPING
    let model = "llama-3.1-8b-instant"; // default (light)

    if (agent === "content" || agent === "optimizer") {
      model = "llama-3.3-70b-versatile"; // heavy
    }

    if (agent === "parser" || agent === "jd" || agent === "scorer") {
      model = "llama-3.1-8b-instant"; // light
    }

    // ⚡ Optimize token usage
    if (agent === "scorer") {
      maxTokens = 500;
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: system || "You are an expert ATS resume writer.",
            },
            {
              role: "user",
              content: user,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Groq API error",
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    res.json({ text });

  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    groqKey: process.env.GROQ_API_KEY ? "✓ configured" : "✗ MISSING",
  });
});

// ── Serve React build ─────────────────────────────────────────────────
const buildPath = path.join(__dirname, "../build");
app.use(express.static(buildPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 ATS Resume Builder Pro (Groq + Agents)`);
  console.log(`   Port     : ${PORT}`);
  console.log(`   Groq     : ${process.env.GROQ_API_KEY ? "✓ loaded" : "✗ MISSING"}`);
});
