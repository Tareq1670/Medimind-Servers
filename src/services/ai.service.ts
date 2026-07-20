import { ObjectId } from "mongodb";
import { symptomAnalysesCol, reportAnalysesCol, chatSessionsCol, healthRecordsCol, toObjectId } from "../db/collections.js";
import type { ISymptomAnalysis, IAiSymptomAnalysis, IReportAnalysis, IChatSession, PaginatedResult } from "../types/models.js";
import { generateWithPro, generateWithFlash, streamChat, analyzeImageWithVision } from "./gemini.service.js";
import { analyzeWithGroq } from "./groq.service.js";
import { paginate } from "../utils/pagination.js";

interface HistoryQuery {
  page: number;
  limit: number;
  type?: "symptom" | "report";
}

const MEDICAL_DISCLAIMER =
  "⚠️ This analysis is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions. In case of emergency, contact emergency services immediately.";

export function buildSymptomPrompt(
  symptoms: string[], duration?: string, severity?: string, additionalInfo?: string
): string {
  return `You are MediMind's medical AI assistant. Analyze the following symptoms and provide a structured medical assessment.

Symptoms: ${symptoms.join(", ")}
Duration: ${duration ?? "Not specified"}
Severity: ${severity ?? "Not specified"}
Additional context: ${additionalInfo ?? "None provided"}

Respond in this exact JSON format (no markdown, no code fences, no extra text):
{
  "urgencyLevel": "immediate|soon|routine|monitor",
  "urgencyExplanation": "string explaining the urgency",
  "possibleConditions": [
    { "name": "condition name", "probability": "high/medium/low", "description": "brief description", "commonIn": "who commonly gets this" }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "warningSignsToWatch": ["sign 1", "sign 2"],
  "shouldSeeDoctor": true/false,
  "doctorType": "type of doctor to consult if needed",
  "lifestyleAdvice": ["advice 1", "advice 2"],
  "disclaimer": "standard medical disclaimer"
}`;
}

function buildBlogPrompt(topic: string, audience?: string, tone?: string, length?: string, keyPoints?: string[], includeSections?: string[]): string {
  return `Generate a comprehensive health article about "${topic}" for ${audience ?? "general public"}.
Tone: ${tone ?? "informative"}
Length: approximately ${length ?? "1000"} words
Include sections on: ${includeSections?.join(", ") ?? "symptoms, treatments, prevention"}
Key points to cover: ${keyPoints?.join(", ") ?? "evidence-based information, practical tips"}

Article requirements:
- SEO-friendly heading structure (H1, H2, H3)
- Evidence-based information
- Practical tips readers can apply
- Include a conclusion with key takeaways
- Appropriate medical disclaimers
- Engaging introduction that hooks readers

Format the output as JSON (no markdown, no code fences):
{
  "title": "article title",
  "metaDescription": "meta description for SEO",
  "tags": ["tag1", "tag2", "tag3"],
  "readTime": number (minutes),
  "content": "full article content in markdown format",
  "keyTakeaways": ["takeaway 1", "takeaway 2"]
}`;
}

function buildRecommendationPrompt(symptoms?: string[], conditions?: string[], healthGoals?: string[]): string {
  return `Based on this user's context, provide personalized medicine and supplement recommendations.

User Context:
Recent Symptoms: ${symptoms?.join(", ") ?? "None reported"}
Known Conditions: ${conditions?.join(", ") ?? "None reported"}
Health Goals: ${healthGoals?.join(", ") ?? "General wellness"}

Provide:
1. Top 5 recommended medicines/supplements with reasons
2. Items to AVOID based on potential interactions
3. Lifestyle recommendations
4. Monitoring suggestions

Format as JSON (no markdown, no code fences):
{
  "recommendations": [
    { "name": "item name", "type": "medicine|supplement|lifestyle", "reason": "why recommended", "priority": "high|medium|low" }
  ],
  "itemsToAvoid": [{ "name": "item name", "reason": "why to avoid" }],
  "lifestyleTips": ["tip 1", "tip 2"],
  "monitoringSuggestions": ["suggestion 1", "suggestion 2"],
  "disclaimer": "standard medical disclaimer"
}`;
}

function buildHealthInsightsPrompt(records: Record<string, unknown>[]): string {
  return `Analyze these health records and provide personalized insights and trend analysis.

Records data: ${JSON.stringify(records, null, 2)}

Provide:
1. Key trends observed
2. Notable changes or patterns
3. Personalized recommendations
4. Areas that need attention
5. Positive progress notes

Format as JSON (no markdown, no code fences):
{
  "trends": [{ "metric": "weight/bp/etc", "direction": "increasing|decreasing|stable", "insight": "what this means" }],
  "notableChanges": ["change 1", "change 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "areasNeedingAttention": ["area 1", "area 2"],
  "positiveProgress": ["progress 1", "progress 2"],
  "overallAssessment": "brief overall health assessment",
  "disclaimer": "standard medical disclaimer"
}`;
}

function buildClassifyTagsPrompt(title: string, description: string): string {
  return `Given the following content, generate relevant tags for categorization.

Title: "${title}"
Description: "${description}"

Generate 5-8 relevant tags that describe this content. Consider medical categories, conditions, treatments, and audience.

Format as JSON (no markdown, no code fences):
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "primary category"
}`;
}

const SYSTEM_PROMPT = `You are MediMind AI, a professional medical assistant integrated into the MediMind healthcare platform. You have knowledge of medicines, symptoms, health conditions, and medical guidance.

Guidelines:
- Provide accurate, helpful medical information
- Always recommend consulting a doctor for serious concerns
- Reference specific medicines/conditions when relevant
- Be empathetic and supportive
- Add appropriate medical disclaimers
- Never diagnose definitively, provide possibilities
- Suggest platform features when relevant

Always end each response with the medical disclaimer.`;

function getFollowUpPrompt(conversationHistory: string, lastResponse: string): string {
  return `Based on this medical conversation, generate 3 relevant follow-up questions the user might want to ask next.

Conversation: ${conversationHistory.slice(-1000)}
Last AI Response: ${lastResponse.slice(-500)}

Format as JSON array of strings (no markdown, no code fences):
["question 1", "question 2", "question 3"]`;
}

function parseJson<T>(raw: string, fallback: T, context?: string): T {
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn(`[parseJson] Failed to parse AI response${context ? ` (${context})` : ""}:`, (raw ?? "").slice(0, 200));
    return fallback;
  }
}

// ─── Symptom Analysis ───────────────────────────────────────────

export async function analyzeWithGroqFallback(prompt: string): Promise<IAiSymptomAnalysis> {
  const fallback: IAiSymptomAnalysis = {
    urgencyLevel: "routine",
    urgencyExplanation: "AI analysis encountered an issue; please consult a healthcare professional.",
    possibleConditions: [],
    recommendations: ["Monitor symptoms and consult a doctor if they persist."],
    warningSignsToWatch: [],
    shouldSeeDoctor: false,
    disclaimer: MEDICAL_DISCLAIMER,
  };

  try {
    const raw = await analyzeWithGroq(prompt);
    return parseJson(raw, fallback, "groq-symptom");
  } catch (groqErr) {
    console.error("[symptom-analysis] Groq failed:", groqErr instanceof Error ? groqErr.message : groqErr);
    try {
      const raw = await generateWithFlash(prompt);
      return parseJson(raw, fallback, "gemini-flash-symptom");
    } catch (geminiErr) {
      console.error("[symptom-analysis] Gemini Flash also failed:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
      return fallback;
    }
  }
}

export async function analyzeSymptoms(
  patientId: string,
  symptoms: string[],
  duration?: string,
  severity?: string,
  additionalInfo?: string
): Promise<ISymptomAnalysis> {
  const prompt = buildSymptomPrompt(symptoms, duration, severity, additionalInfo);
  const parseFallback: IAiSymptomAnalysis = {
    urgencyLevel: "routine",
    urgencyExplanation: "AI analysis encountered an issue; please consult a healthcare professional.",
    possibleConditions: [],
    recommendations: ["Monitor symptoms and consult a doctor if they persist."],
    warningSignsToWatch: [],
    shouldSeeDoctor: false,
    disclaimer: MEDICAL_DISCLAIMER,
  };

  let aiAnalysis: IAiSymptomAnalysis;

  try {
    const raw = await analyzeWithGroq(prompt);
    aiAnalysis = parseJson(raw, parseFallback, "groq-symptom-auth");
  } catch (groqErr) {
    console.error("[symptom-analysis-auth] Groq failed:", groqErr instanceof Error ? groqErr.message : groqErr);
    try {
      const raw = await generateWithFlash(prompt);
      aiAnalysis = parseJson(raw, parseFallback, "gemini-flash-symptom-auth");
    } catch (geminiErr) {
      console.error("[symptom-analysis-auth] Gemini Flash also failed:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
      aiAnalysis = parseFallback;
    }
  }

  const doc: ISymptomAnalysis = {
    patientId: toObjectId(patientId),
    reportedSymptoms: symptoms,
    duration,
    severity,
    additionalInfo,
    aiAnalysis: { ...aiAnalysis, disclaimer: MEDICAL_DISCLAIMER },
    AI_Assessment_Result: `Analysis complete. ${aiAnalysis.possibleConditions.length} possible condition(s) identified. Urgency: ${aiAnalysis.urgencyLevel}.`,
    recommendedAction: aiAnalysis.recommendations[0] ?? "Monitor symptoms and consult a doctor if they persist.",
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await symptomAnalysesCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

// ─── Report Analysis (Vision) ────────────────────────────────────

export interface ReportAnalysisResult {
  _id: ObjectId | string;
  reportType: string;
  reportName?: string;
  parameters: Array<Record<string, unknown>>;
  overallAssessment: string;
  followUpActions: string[];
  urgencyLevel: string;
  disclaimer: string;
  aiAnalysis: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    riskIndicators: string[];
    normalValues: Record<string, unknown>;
    abnormalValues: Record<string, unknown>;
  };
  uploadedImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function analyzeReport(
  patientId: string,
  reportType: string,
  uploadedImageUrl: string,
  reportName?: string,
  additionalNotes?: string
): Promise<ReportAnalysisResult> {
  const visionPrompt = `Analyze this medical report/document. Extract all medical values, parameters, and information. Provide a comprehensive analysis including:

1. Report type identification
2. All parameter names with their values and units
3. Reference ranges (normal values)
4. Status for each parameter (Normal/Low/High/Critical)
5. Plain-English explanation of abnormal values
6. Overall health assessment
7. Recommended follow-up actions
8. Urgency level (routine/urgent/emergency)

Format as JSON (no markdown, no code fences):
{
  "reportType": "identified report type",
  "parameters": [{ "name": "param", "value": "val", "unit": "unit", "range": "ref range", "status": "Normal|Low|High|Critical", "explanation": "plain english" }],
  "overallAssessment": "summary",
  "followUpActions": ["action 1", "action 2"],
  "urgencyLevel": "routine|urgent|emergency",
  "disclaimer": "medical disclaimer"
}`;

  let aiOutput: Record<string, unknown>;

  try {
    const raw = await analyzeImageWithVision(uploadedImageUrl, visionPrompt);
    aiOutput = parseJson(raw, {} as Record<string, unknown>, "vision-report");
    if (Object.keys(aiOutput).length === 0) {
      throw new Error("AI returned empty/unparseable response");
    }
  } catch (err) {
    console.error("[report-analysis] Vision analysis failed:", err instanceof Error ? err.message : err);
    aiOutput = {
      reportType,
      parameters: [],
      overallAssessment: "AI analysis was unable to fully process this report. Please consult a healthcare professional.",
      followUpActions: ["Review with your doctor"],
      urgencyLevel: "routine",
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const keyFindings: string[] = [];
  const riskIndicators: string[] = [];
  const normalValues: Record<string, unknown> = {};
  const abnormalValues: Record<string, unknown> = {};

  const params = aiOutput.parameters as Array<Record<string, string>> | undefined;
  if (params) {
    for (const p of params) {
      if (p.status === "Normal") {
        normalValues[p.name] = p;
      } else {
        abnormalValues[p.name] = p;
        riskIndicators.push(`${p.name} is ${p.status}: ${p.value} ${p.unit ?? ""} (range: ${p.range ?? "N/A"})`);
        keyFindings.push(`${p.name}: ${p.explanation ?? `${p.value} ${p.unit ?? ""} — ${p.status}`}`);
      }
    }
  }

  const now = new Date();
  const doc: IReportAnalysis = {
    patientId: toObjectId(patientId),
    reportName,
    reportType,
    uploadedImageUrl,
    structuredData: aiOutput,
    analysisSummary: (aiOutput.overallAssessment as string) ?? "Analysis complete.",
    aiDoctorNotes: additionalNotes
      ? `Patient notes: ${additionalNotes}. ${aiOutput.overallAssessment as string}`
      : (aiOutput.overallAssessment as string),
    aiAnalysis: {
      summary: (aiOutput.overallAssessment as string) ?? "Analysis complete.",
      keyFindings: keyFindings.length > 0 ? keyFindings : ["All parameters appear within normal ranges."],
      recommendations: (aiOutput.followUpActions as string[]) ?? ["Consult your healthcare provider."],
      riskIndicators,
      normalValues,
      abnormalValues,
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = await reportAnalysesCol().insertOne(doc);
  const saved = { ...doc, _id: result.insertedId };

  return {
    _id: saved._id,
    reportType: saved.reportType,
    reportName: saved.reportName,
    parameters: (aiOutput.parameters as Array<Record<string, unknown>>) ?? [],
    overallAssessment: (aiOutput.overallAssessment as string) ?? "Analysis complete.",
    followUpActions: (aiOutput.followUpActions as string[]) ?? ["Consult your healthcare provider."],
    urgencyLevel: (aiOutput.urgencyLevel as "routine" | "urgent" | "emergency") ?? "routine",
    disclaimer: (aiOutput.disclaimer as string) ?? MEDICAL_DISCLAIMER,
    aiAnalysis: saved.aiAnalysis ?? {
      summary: "Analysis complete.",
      keyFindings: [],
      recommendations: [],
      riskIndicators: [],
      normalValues: {},
      abnormalValues: {},
    },
    uploadedImageUrl: saved.uploadedImageUrl,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  };
}

// ─── Chat Message (Streaming) ────────────────────────────────────

export async function chatMessage(
  userId: string,
  message: string,
  sessionId?: string,
  onChunk?: (text: string) => void
): Promise<{ session: IChatSession; followUps: string[] }> {
  const userOid = toObjectId(userId);
  let session: IChatSession | null = null;

  if (sessionId) {
    session = await chatSessionsCol().findOne({ _id: toObjectId(sessionId) });
  }

  if (!session) {
    const now = new Date();
    const newDoc: IChatSession = {
      participants: [userOid],
      messages: [],
      status: "Active",
      sessionTitle: message.slice(0, 60),
      createdAt: now,
      updatedAt: now,
    };
    const result = await chatSessionsCol().insertOne(newDoc);
    session = { ...newDoc, _id: result.insertedId };
  }

  const history = (session.messages || []).slice(-20).map((m) => ({
    role: (m.senderId.toString() === userId ? "user" : "model") as "user" | "model",
    content: m.content,
  }));

  const chatMessages = [...history, { role: "user" as const, content: message }];
  let fullResponse = "";

  try {
    fullResponse = await streamChat(chatMessages, SYSTEM_PROMPT, (chunk) => {
      onChunk?.(chunk);
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[chat] Streaming failed:", errMsg);
    fullResponse = `${MEDICAL_DISCLAIMER}\n\nI'm sorry, I'm having trouble connecting to the AI service right now. This could be due to a temporary issue. Please try again in a moment.`;
    onChunk?.(fullResponse);
  }

  let followUps: string[] = [];
  try {
    const followPrompt = getFollowUpPrompt(
      history.map((m) => `${m.role}: ${m.content}`).join("\n"),
      fullResponse
    );
    const followRaw = await generateWithFlash(followPrompt);
    followUps = parseJson<string[]>(followRaw, [
      "What are the common causes?",
      "When should I see a doctor?",
      "Are there any home remedies?",
    ], "chat-followups");
  } catch (err) {
    console.error("[chat] Follow-up generation failed:", err instanceof Error ? err.message : err);
    followUps = [
      "What are the common causes?",
      "When should I see a doctor?",
      "Are there any home remedies?",
    ];
  }

  const now = new Date();
  const userMessage = { senderId: userOid, content: message, timestamp: now };
  const assistantMessage = { senderId: "ai-assistant", content: fullResponse, timestamp: now, suggestedFollowUps: followUps };

  await chatSessionsCol().updateOne(
    { _id: session._id },
    {
      $push: { messages: { $each: [userMessage, assistantMessage] } },
      $set: { updatedAt: now },
    }
  );

  const updatedSession = await chatSessionsCol().findOne({ _id: session._id });
  return { session: updatedSession ?? session, followUps };
}

// ─── Blog Generation ─────────────────────────────────────────────

export async function generateBlog(
  topic: string,
  audience?: string,
  tone?: string,
  length?: string,
  keyPoints?: string[],
  includeSections?: string[]
): Promise<Record<string, unknown>> {
  const prompt = buildBlogPrompt(topic, audience, tone, length, keyPoints, includeSections);
  const raw = await generateWithPro(prompt);
  return parseJson(raw, {
    title: topic,
    metaDescription: `A comprehensive article about ${topic}`,
    tags: ["health", topic.toLowerCase().replace(/\s+/g, "-")],
    readTime: 5,
    content: raw,
    keyTakeaways: ["Consult a healthcare professional for personalized advice."],
  }, "blog-generation");
}

// ─── Medicine Recommendations ────────────────────────────────────

export async function getRecommendations(
  _userId: string,
  symptoms?: string[],
  conditions?: string[],
  healthGoals?: string[]
): Promise<Record<string, unknown>> {
  const prompt = buildRecommendationPrompt(symptoms, conditions, healthGoals);
  const raw = await generateWithPro(prompt);
  return parseJson(raw, {
    recommendations: [],
    itemsToAvoid: [],
    lifestyleTips: ["Maintain a balanced diet", "Exercise regularly", "Stay hydrated"],
    monitoringSuggestions: ["Track your symptoms", "Monitor vital signs regularly"],
    disclaimer: MEDICAL_DISCLAIMER,
  }, "recommendations");
}

// ─── Health Insights ─────────────────────────────────────────────

export async function getHealthInsights(userId: string): Promise<Record<string, unknown>> {
  const records = await healthRecordsCol().find({ patientId: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  if (!records || records.length === 0) {
    return {
      trends: [],
      notableChanges: [],
      recommendations: ["Start logging your health data to receive personalized insights."],
      areasNeedingAttention: [],
      positiveProgress: [],
      overallAssessment: "Not enough data to provide insights. Log your health metrics to get started.",
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const prompt = buildHealthInsightsPrompt(records as unknown as Record<string, unknown>[]);
  const raw = await generateWithPro(prompt);
  return parseJson(raw, {
    trends: [],
    notableChanges: [`${records.length} health records analyzed`],
    recommendations: ["Continue monitoring your health metrics regularly."],
    areasNeedingAttention: [],
    positiveProgress: ["Health records being tracked consistently"],
    overallAssessment: `Analysis of ${records.length} health records completed.`,
    disclaimer: MEDICAL_DISCLAIMER,
  }, "health-insights");
}

// ─── Classify Tags ───────────────────────────────────────────────

export async function classifyTags(title: string, description: string): Promise<Record<string, unknown>> {
  const prompt = buildClassifyTagsPrompt(title, description);
  const raw = await generateWithFlash(prompt);
  return parseJson(raw, {
    tags: title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5),
    category: "General",
  }, "classify-tags");
}

// ─── History ─────────────────────────────────────────────────────

export async function getHistory(patientId: string, opts: HistoryQuery): Promise<PaginatedResult<Record<string, unknown>>> {
  const patientOid = toObjectId(patientId);
  const symptomFilter = { patientId: patientOid };
  const reportFilter = { patientId: patientOid };

  if (opts.type === "symptom") {
    const col = symptomAnalysesCol();
    const total = await col.countDocuments(symptomFilter);
    const { pagination } = await paginate(total, opts);
    const data = await col.find(symptomFilter)
      .sort({ timestamp: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .toArray() as unknown as Record<string, unknown>[];
    return { data, pagination };
  }

  if (opts.type === "report") {
    const col = reportAnalysesCol();
    const total = await col.countDocuments(reportFilter);
    const { pagination } = await paginate(total, opts);
    const data = await col.find(reportFilter)
      .sort({ createdAt: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .toArray() as unknown as Record<string, unknown>[];
    return { data, pagination };
  }

  // Merged query — fetch all items, merge and paginate in memory
  const [symptomTotal, reportTotal] = await Promise.all([
    symptomAnalysesCol().countDocuments(symptomFilter),
    reportAnalysesCol().countDocuments(reportFilter),
  ]);
  const total = symptomTotal + reportTotal;
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const MAX_FETCH = 1000;
  const [symptoms, reports] = await Promise.all([
    symptomAnalysesCol().find(symptomFilter)
      .sort({ timestamp: -1 })
      .limit(MAX_FETCH)
      .toArray(),
    reportAnalysesCol().find(reportFilter)
      .sort({ createdAt: -1 })
      .limit(MAX_FETCH)
      .toArray(),
  ]);

  const merged = [
    ...symptoms.map((s) => ({ ...s, _type: "symptom" })),
    ...reports.map((r) => ({ ...r, _type: "report" })),
  ].sort((a, b) => {
    const aDate = (a as any).timestamp || (a as any).createdAt;
    const bDate = (b as any).timestamp || (b as any).createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const paginatedData = merged.slice((opts.page - 1) * opts.limit, opts.page * opts.limit);

  return {
    data: paginatedData,
    pagination: {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages,
      hasNextPage: opts.page < totalPages,
      hasPrevPage: opts.page > 1,
    },
  };
}
