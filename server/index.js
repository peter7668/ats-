app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: "GOOGLE_API_KEY not set" } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // Get user message from frontend
    const userMessage =
      req.body?.message || "Hello";

    const result = await model.generateContent(userMessage);

    return res.json({
      reply: result.response.text(),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: err.message } });
  }
});
