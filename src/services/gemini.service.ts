import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { env } from "../config/env.js";

let genAI: GoogleGenerativeAI | null = null;
let flashModel: GenerativeModel | null = null;
let proModel: GenerativeModel | null = null;
let visionModel: GenerativeModel | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!env.geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return genAI;
}

function getProModel(): GenerativeModel {
  if (!proModel) {
    proModel = getClient().getGenerativeModel({ model: "gemini-1.5-pro" });
  }
  return proModel;
}

function getFlashModel(): GenerativeModel {
  if (!flashModel) {
    flashModel = getClient().getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return flashModel;
}

function getVisionModel(): GenerativeModel {
  if (!visionModel) {
    visionModel = getClient().getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return visionModel;
}

export async function generateWithPro(prompt: string): Promise<string> {
  const model = getProModel();
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export async function generateWithFlash(prompt: string): Promise<string> {
  const model = getFlashModel();
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export async function streamChat(
  messages: { role: "user" | "model"; content: string }[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const model = getFlashModel();

  const chat = model.startChat({
    systemInstruction: { role: "model", parts: [{ text: systemPrompt }] },
    history: messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessageStream(lastMessage.content);

  let fullText = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
}

export async function analyzeImageWithVision(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const model = getVisionModel();

  const imageResp = await fetch(imageUrl);
  const imageBuffer = await imageResp.arrayBuffer();
  const mimeType = imageResp.headers.get("content-type") ?? "image/jpeg";
  const base64Image = Buffer.from(imageBuffer).toString("base64");

  const result = await model.generateContent([
    { inlineData: { mimeType, data: base64Image } },
    prompt,
  ]);

  return result.response.text();
}
