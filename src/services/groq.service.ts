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
      model: "llama-3.3-70b-versatile",
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
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

export async function chatWithGroq(
  messages: Array<{ role: "user" | "model"; content: string }>,
  systemPrompt: string
): Promise<string> {
  if (!env.groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const groqMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

export async function streamChatWithGroq(
  messages: Array<{ role: "user" | "model"; content: string }>,
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  if (!env.groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const groqMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    })),
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;

      try {
        const data = JSON.parse(trimmed.slice(6)) as {
          choices: Array<{ delta?: { content?: string } }>;
        };
        const content = data.choices[0]?.delta?.content;
        if (content) {
          fullText += content;
          onChunk(content);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  return fullText;
}
