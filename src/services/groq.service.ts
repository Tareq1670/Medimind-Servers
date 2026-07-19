import axios from "axios";
import { env } from "../config/env.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function analyzeWithGroq(prompt: string): Promise<string> {
  if (!env.groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are a medical AI assistant. You respond with structured JSON only. No markdown, no code fences, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    },
    {
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
}
