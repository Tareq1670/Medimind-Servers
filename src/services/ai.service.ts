import { SymptomAnalysisModel, ISymptomAnalysis, IAiSymptomAnalysis } from "../models/SymptomAnalysis.model.js";
import { ReportAnalysisModel, IReportAnalysis } from "../models/ReportAnalysis.model.js";
import { ChatSessionModel, IChatSession } from "../models/ChatSession.model.js";
import { MedicineModel } from "../models/Medicine.model.js";
import { HealthConditionModel } from "../models/HealthCondition.model.js";
import { HealthRecordModel } from "../models/HealthRecord.model.js";
import { generateWithPro, generateWithFlash, streamChat, analyzeImageWithVision } from "./gemini.service.js";
import { analyzeWithGroq } from "./groq.service.js";

interface HistoryQuery {
  page: number;
  limit: number;
  type?: "symptom" | "report";
}

interface PaginatedResult {
  data: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const MEDICAL_DISCLAIMER =
  "⚠️ This analysis is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions. In case of emergency, contact emergency services immediately.";

function buildSymptomPrompt(
  symptoms: string[],
  duration?: string,
  severity?: string,
  additionalInfo?: string
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

function buildBlogPrompt(
  topic: string,
  audience?: string,
  tone?: string,
  length?: string,
  keyPoints?: string[],
  includeSections?: string[]
): string {
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

function buildRecommendationPrompt(
  userId: string,
  symptoms?: string[],
  conditions?: string[],
  healthGoals?: string[]
): string {
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

// ─── Symptom Analysis ───────────────────────────────────────────

export async function analyzeSymptoms(
  patientId: string,
  symptoms: string[],
  duration?: string,
  severity?: string,
  additionalInfo?: string
): Promise<ISymptomAnalysis> {
  const prompt = buildSymptomPrompt(symptoms, duration, severity, additionalInfo);

  let aiAnalysis: IAiSymptomAnalysis;
  let assessmentResult: string;

  try {
    const raw = await analyzeWithGroq(prompt);
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    aiAnalysis = JSON.parse(cleaned) as IAiSymptomAnalysis;
    assessmentResult = `Analysis complete. ${aiAnalysis.possibleConditions.length} possible condition(s) identified. Urgency: ${aiAnalysis.urgencyLevel}.`;
  } catch {
    const raw = await generateWithFlash(prompt);
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    aiAnalysis = JSON.parse(cleaned) as IAiSymptomAnalysis;
    assessmentResult = `Analysis complete. ${aiAnalysis.possibleConditions.length} possible condition(s) identified. Urgency: ${aiAnalysis.urgencyLevel}.`;
  }

  return SymptomAnalysisModel.create({
    patientId,
    reportedSymptoms: symptoms,
    duration,
    severity,
    additionalInfo,
    aiAnalysis: { ...aiAnalysis, disclaimer: MEDICAL_DISCLAIMER },
    AI_Assessment_Result: assessmentResult,
    recommendedAction: aiAnalysis.recommendations[0] ?? "Monitor symptoms and consult a doctor if they persist.",
    timestamp: new Date(),
  });
}

// ─── Report Analysis (Vision) ────────────────────────────────────

export async function analyzeReport(
  patientId: string,
  reportType: string,
  uploadedImageUrl: string,
  reportName?: string,
  additionalNotes?: string
): Promise<IReportAnalysis> {
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
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    aiOutput = JSON.parse(cleaned);
  } catch {
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

  return ReportAnalysisModel.create({
    patientId,
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
  });
}

// ─── Chat Message (Streaming) ────────────────────────────────────

export async function chatMessage(
  userId: string,
  message: string,
  sessionId?: string,
  onChunk?: (text: string) => void
): Promise<{ session: IChatSession; followUps: string[] }> {
  let session: IChatSession | null = null;

  if (sessionId) {
    session = await ChatSessionModel.findById(sessionId);
  }

  if (!session) {
    session = await ChatSessionModel.create({
      participants: [userId],
      messages: [],
      status: "Active",
      sessionTitle: message.slice(0, 60),
    });
  }

  const history = session.messages.slice(-20).map((m) => ({
    role: (m.senderId.toString() === userId ? "user" : "model") as "user" | "model",
    content: m.content,
  }));

  const now = new Date();
  session.messages.push({
    senderId: userId as any,
    content: message,
    timestamp: now,
  });

  const chatMessages = [...history, { role: "user" as const, content: message }];
  let fullResponse = "";

  try {
    fullResponse = await streamChat(chatMessages, SYSTEM_PROMPT, (chunk) => {
      onChunk?.(chunk);
    });
  } catch {
    fullResponse = `${MEDICAL_DISCLAIMER}\n\nI apologize, but I'm having trouble processing your request. Please try again or consult a healthcare professional for immediate concerns.`;
    onChunk?.(fullResponse);
  }

  const assistantNow = new Date();
  session.messages.push({
    senderId: userId as any,
    content: fullResponse,
    timestamp: assistantNow,
  });

  let followUps: string[] = [];
  try {
    const followPrompt = getFollowUpPrompt(
      history.map((m) => `${m.role}: ${m.content}`).join("\n"),
      fullResponse
    );
    const followRaw = await generateWithFlash(followPrompt);
    const cleaned = followRaw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    followUps = JSON.parse(cleaned) as string[];

    const lastMsgIdx = session.messages.length - 1;
    session.messages[lastMsgIdx].suggestedFollowUps = followUps;
  } catch {
    followUps = [
      "What are the common causes?",
      "When should I see a doctor?",
      "Are there any home remedies?",
    ];
  }

  await session.save();

  return { session, followUps };
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
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return {
      title: topic,
      metaDescription: `A comprehensive article about ${topic}`,
      tags: ["health", topic.toLowerCase().replace(/\s+/g, "-")],
      readTime: 5,
      content: raw,
      keyTakeaways: ["Consult a healthcare professional for personalized advice."],
    };
  }
}

// ─── Medicine Recommendations ────────────────────────────────────

export async function getRecommendations(
  userId: string,
  symptoms?: string[],
  conditions?: string[],
  healthGoals?: string[]
): Promise<Record<string, unknown>> {
  const prompt = buildRecommendationPrompt(userId, symptoms, conditions, healthGoals);

  const raw = await generateWithPro(prompt);
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return {
      recommendations: [],
      itemsToAvoid: [],
      lifestyleTips: ["Maintain a balanced diet", "Exercise regularly", "Stay hydrated"],
      monitoringSuggestions: ["Track your symptoms", "Monitor vital signs regularly"],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }
}

// ─── Health Insights ─────────────────────────────────────────────

export async function getHealthInsights(userId: string): Promise<Record<string, unknown>> {
  const records = await HealthRecordModel.find({ patientId: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

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
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return {
      trends: [],
      notableChanges: [`${records.length} health records analyzed`],
      recommendations: ["Continue monitoring your health metrics regularly."],
      areasNeedingAttention: [],
      positiveProgress: ["Health records being tracked consistently"],
      overallAssessment: `Analysis of ${records.length} health records completed.`,
      disclaimer: MEDICAL_DISCLAIMER,
    };
  }
}

// ─── Classify Tags ───────────────────────────────────────────────

export async function classifyTags(
  title: string,
  description: string
): Promise<Record<string, unknown>> {
  const prompt = buildClassifyTagsPrompt(title, description);

  const raw = await generateWithFlash(prompt);
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return {
      tags: title
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 5),
      category: "General",
    };
  }
}

// ─── History (unchanged logic, enhanced for new fields) ──────────

export async function getHistory(
  patientId: string,
  opts: HistoryQuery
): Promise<PaginatedResult> {
  const symptomFilter = { patientId };
  const reportFilter = { patientId };

  if (opts.type === "symptom") {
    const total = await SymptomAnalysisModel.countDocuments(symptomFilter);
    const totalPages = Math.ceil(total / opts.limit) || 1;
    const data = (await SymptomAnalysisModel.find(symptomFilter)
      .sort({ timestamp: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .lean()) as unknown as Record<string, unknown>[];
    return {
      data,
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

  if (opts.type === "report") {
    const total = await ReportAnalysisModel.countDocuments(reportFilter);
    const totalPages = Math.ceil(total / opts.limit) || 1;
    const data = (await ReportAnalysisModel.find(reportFilter)
      .sort({ createdAt: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .lean()) as unknown as Record<string, unknown>[];
    return {
      data,
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

  const [symptomTotal, reportTotal] = await Promise.all([
    SymptomAnalysisModel.countDocuments(symptomFilter),
    ReportAnalysisModel.countDocuments(reportFilter),
  ]);
  const total = symptomTotal + reportTotal;
  const totalPages = Math.ceil(total / opts.limit) || 1;

  const [symptoms, reports] = await Promise.all([
    SymptomAnalysisModel.find(symptomFilter)
      .sort({ timestamp: -1 })
      .limit(opts.limit)
      .lean(),
    ReportAnalysisModel.find(reportFilter)
      .sort({ createdAt: -1 })
      .limit(opts.limit)
      .lean(),
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
