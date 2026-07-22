import { Request, Response } from "express";
import * as aiService from "../services/ai.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { uploadToImageBB } from "../services/upload.service.js";
import { streamChat, generateChat } from "../services/gemini.service.js";
import { chatWithGroq, streamChatWithGroq } from "../services/groq.service.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function analyzeSymptoms(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    const { reportedSymptoms, duration, severity, additionalInfo } = req.body;

    if (userId) {
      const analysis = await aiService.analyzeSymptoms(
        userId,
        reportedSymptoms,
        duration,
        severity,
        additionalInfo
      );
      sendSuccess(res, analysis, "Symptom analysis complete", 201);
    } else {
      const prompt = aiService.buildSymptomPrompt(reportedSymptoms, duration, severity, additionalInfo);
      const result = await aiService.analyzeWithGroqFallback(prompt);
      sendSuccess(res, result, "Symptom analysis complete");
    }
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to analyze symptoms");
  }
}

const PUBLIC_CHAT_SYSTEM_PROMPT = `You are MediMind AI — a professional, empathetic, and medically knowledgeable assistant built into the MediMind healthcare platform. Your role is to provide reliable health information, help users understand symptoms, medications, and conditions, and guide them to the right platform features.

PERSONALITY & TONE:
- Warm, professional, and reassuring — like a knowledgeable nurse or health advisor
- Use clear, accessible language (avoid overly technical jargon unless the user asks)
- Be concise but thorough — aim for 150–300 words per response
- Use natural paragraph breaks and formatting for readability
- Show empathy when users describe health concerns

MEDICAL GUIDELINES:
- Provide evidence-based health information
- Always suggest consulting a doctor for serious, persistent, or worsening symptoms
- When mentioning medications, include generic names and note common side effects briefly
- Never provide definitive diagnoses — frame as possibilities and recommend professional evaluation
- For emergency symptoms (chest pain, difficulty breathing, severe bleeding, etc.), immediately advise calling emergency services
- Include the medical disclaimer at the end of every response

PLATFORM NAVIGATION — Guide users to the right feature when relevant. Format links as [Feature Name](/path):
- Home: [Home](/)
- Symptom Checker: [Symptom Checker](/symptom-checker) — guided symptom analysis
- Medicine Database: [Medicines](/medicines) — search drug info, side effects, interactions
- Health Conditions: [Conditions](/conditions) — browse conditions and treatments
- Find a Doctor: [Doctors](/doctors) — browse specialist directory
- Health Blog: [Health Blog](/blogs) — expert health articles
- AI Assistant (logged in): [AI Assistant](/ai-assistant) — full AI chat with history
- Dashboard (logged in): [Dashboard](/dashboard) — personal health overview
- Health Records (logged in): [Health Records](/health-records) — track vitals and records
- Report Analysis (logged in): [Report Analysis](/report-analysis) — upload medical reports for AI analysis
- Recommendations (logged in): [Recommendations](/recommendations) — personalized health tips
- Login: [Sign In](/login) | Register: [Create Account](/register)

RESPONSE FORMAT:
- Use short paragraphs and bullet points when listing symptoms, causes, or steps
- Bold key terms using **bold** markdown for emphasis
- When appropriate, suggest relevant platform features with markdown links
- Always end with the medical disclaimer
- Keep responses focused and actionable

CRITICAL RULES:
- You are NOT a replacement for professional medical advice, diagnosis, or treatment
- Never prescribe medication or recommend dosage changes
- For mental health crises, provide the crisis helpline: 988 Suicide & Crisis Lifeline
- Do not store or request personal health records through this chat
- If unsure about something, say so honestly and recommend consulting a specialist`;

const MEDICAL_DISCLAIMER =
  "\n\n---\n*⚠️ This response is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.*";

function writeSSE(res: Response, data: Record<string, unknown>, disconnected: boolean): boolean {
  if (disconnected || res.writableEnded) return false;
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

function endSSE(res: Response, disconnected: boolean): void {
  if (disconnected || res.writableEnded) return;
  try { res.end(); } catch { /* already ended */ }
}

async function generateFollowUps(
  fullResponse: string,
  provider: "groq" | "gemini"
): Promise<string[]> {
  const defaults = [
    "What are the common causes?",
    "When should I see a doctor?",
    "Are there any home remedies?",
  ];
  try {
    const followPrompt = `Based on this medical conversation, generate 3 relevant follow-up questions a patient might naturally ask next. Be specific to the topic discussed.\n\nLast response (truncated): ${fullResponse.slice(0, 600)}\n\nReply with ONLY a JSON array of 3 strings. No markdown, no code fences, no explanation.`;
    const followSystemPrompt = "You generate relevant follow-up questions for a medical chatbot. Return only a JSON array of 3 strings. No markdown, no code fences.";
    let followRaw: string;
    if (provider === "groq") {
      followRaw = await chatWithGroq([{ role: "user", content: followPrompt }], followSystemPrompt);
    } else {
      followRaw = await generateChat([{ role: "user", content: followPrompt }], followSystemPrompt);
    }
    const parsed = JSON.parse(followRaw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3).filter((s: unknown) => typeof s === "string");
  } catch { /* use defaults */ }
  return defaults;
}

export async function publicChatMessage(req: Request, res: Response): Promise<void> {
  const { message, history } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let disconnected = false;
  req.on("close", () => { disconnected = true; });

  const chatHistory = (history || []).slice(-10).map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" as const : "model" as const,
    content: m.content,
  }));
  const chatMessages = [...chatHistory, { role: "user" as const, content: message }];

  // ── Tier 1: Groq streaming (primary) ───────────────────────
  try {
    const fullResponse = await streamChatWithGroq(chatMessages, PUBLIC_CHAT_SYSTEM_PROMPT, (chunk) => {
      if (!disconnected) writeSSE(res, { type: "chunk", content: chunk }, disconnected);
    });

    if (disconnected) return;

    writeSSE(res, { type: "chunk", content: MEDICAL_DISCLAIMER }, disconnected);
    const followUps = await generateFollowUps(fullResponse, "groq");
    if (!disconnected) writeSSE(res, { type: "done", followUps }, disconnected);
    endSSE(res, disconnected);
    return;
  } catch (groqStreamErr) {
    console.error("[public-chat] Groq streaming failed:", groqStreamErr instanceof Error ? groqStreamErr.message : groqStreamErr);
  }

  if (disconnected) return;

  // ── Tier 2: Gemini streaming ───────────────────────────────
  try {
    const fullResponse = await streamChat(chatMessages, PUBLIC_CHAT_SYSTEM_PROMPT, (chunk) => {
      if (!disconnected) writeSSE(res, { type: "chunk", content: chunk }, disconnected);
    });

    if (disconnected) return;

    writeSSE(res, { type: "chunk", content: MEDICAL_DISCLAIMER }, disconnected);
    const followUps = await generateFollowUps(fullResponse, "gemini");
    if (!disconnected) writeSSE(res, { type: "done", followUps }, disconnected);
    endSSE(res, disconnected);
    return;
  } catch (geminiStreamErr) {
    console.error("[public-chat] Gemini streaming failed:", geminiStreamErr instanceof Error ? geminiStreamErr.message : geminiStreamErr);
  }

  if (disconnected) return;

  // ── Tier 3: Groq non-streaming ────────────────────────────
  try {
    const fallbackResponse = await chatWithGroq(chatMessages, PUBLIC_CHAT_SYSTEM_PROMPT);
    writeSSE(res, { type: "chunk", content: fallbackResponse }, disconnected);
    writeSSE(res, { type: "chunk", content: MEDICAL_DISCLAIMER }, disconnected);
    const followUps = await generateFollowUps(fallbackResponse, "groq");
    if (!disconnected) writeSSE(res, { type: "done", followUps }, disconnected);
    endSSE(res, disconnected);
    return;
  } catch (groqErr) {
    console.error("[public-chat] Groq fallback failed:", groqErr instanceof Error ? groqErr.message : groqErr);
  }

  if (disconnected) return;

  // ── Tier 4: Gemini non-streaming ──────────────────────────
  try {
    const fallbackResponse = await generateChat(chatMessages, PUBLIC_CHAT_SYSTEM_PROMPT);
    writeSSE(res, { type: "chunk", content: fallbackResponse }, disconnected);
    writeSSE(res, { type: "chunk", content: MEDICAL_DISCLAIMER }, disconnected);
    const followUps = await generateFollowUps(fallbackResponse, "gemini");
    if (!disconnected) writeSSE(res, { type: "done", followUps }, disconnected);
    endSSE(res, disconnected);
    return;
  } catch (geminiGenErr) {
    console.error("[public-chat] Gemini generate failed:", geminiGenErr instanceof Error ? geminiGenErr.message : geminiGenErr);
  }

  if (disconnected) return;

  // ── Tier 5: All AI services down ──────────────────────────
  const staticResponse = `I apologize, but I'm currently unable to connect to the AI service. This is temporary — please try again in a moment.

In the meantime, here are some things you can do on MediMind:

- **Symptom Checker** — Get a guided health assessment [Try it here](/symptom-checker)
- **Medicine Database** — Look up drug info and side effects [Browse Medicines](/medicines)
- **Find a Doctor** — Connect with specialists near you [View Doctors](/doctors)
- **Health Blog** — Read expert health articles [Read Blogs](/blogs)

If you need immediate assistance, please contact emergency services or visit your nearest hospital.${MEDICAL_DISCLAIMER}`;

  writeSSE(res, { type: "chunk", content: staticResponse }, disconnected);
  writeSSE(res, { type: "done", followUps: [] }, disconnected);
  endSSE(res, disconnected);
}

export async function analyzeReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    let uploadedImageUrl: string | undefined;

    if (req.file) {
      uploadedImageUrl = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    if (!uploadedImageUrl) {
      sendError(res, "Report image is required", 400);
      return;
    }

    const { reportType, reportName, additionalNotes } = req.body;

    const analysis = await aiService.analyzeReport(
      userId,
      reportType,
      uploadedImageUrl,
      reportName,
      additionalNotes
    );
    sendSuccess(res, analysis, "Report analysis complete", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to analyze report");
  }
}

export async function chatMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { message, sessionId } = req.body;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let clientDisconnected = false;
    req.on("close", () => {
      clientDisconnected = true;
      res.end();
    });

    const { session, followUps } = await aiService.chatMessage(
      userId,
      message,
      sessionId,
      (chunk) => {
        if (!clientDisconnected) {
          res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
        }
      }
    );

    if (clientDisconnected) return;

    const sid = session._id?.toString() ?? sessionId ?? "";
    res.write(`data: ${JSON.stringify({ type: "done", sessionId: sid, followUps })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : "Failed to process chat" })}\n\n`);
      res.end();
    }
  }
}

export async function generateBlog(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { topic, audience, tone, length, keyPoints, includeSections } = req.body;

    const blog = await aiService.generateBlog(topic, audience, tone, length, keyPoints, includeSections);
    sendSuccess(res, blog, "Blog generated successfully", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate blog");
  }
}

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { symptoms, conditions, healthGoals } = req.body;

    const recommendations = await aiService.getRecommendations(userId, symptoms, conditions, healthGoals);
    sendSuccess(res, recommendations, "Recommendations generated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate recommendations");
  }
}

export async function getHealthInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const insights = await aiService.getHealthInsights(userId);
    sendSuccess(res, insights, "Health insights generated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate health insights");
  }
}

export async function classifyTags(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const { title, description } = req.body;

    const tags = await aiService.classifyTags(title, description);
    sendSuccess(res, tags, "Tags generated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to generate tags");
  }
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const result = await aiService.getHistory(userId, req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch AI history");
  }
}
