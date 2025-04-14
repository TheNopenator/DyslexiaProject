import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config(); // ✅ Make sure this comes FIRST

console.log("OpenAI Key Loaded:", process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    res.json(completion.choices[0].message);
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: error.message || "Something went wrong!" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});