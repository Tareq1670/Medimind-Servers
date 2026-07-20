import { env } from "../config/env.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function analyzeWithGroq(prompt: string): Promise<string> {
  if (!env.groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}
