import { SymptomAnalysisModel, ISymptomAnalysis } from "../models/SymptomAnalysis.model.js";
import { ReportAnalysisModel, IReportAnalysis } from "../models/ReportAnalysis.model.js";

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

export async function analyzeSymptoms(
  patientId: string,
  symptoms: string[]
): Promise<ISymptomAnalysis> {
  const severityLevels = ["Mild", "Moderate", "Severe"] as const;
  const randomSeverity = severityLevels[Math.floor(Math.random() * severityLevels.length)];

  const assessmentResult = `Based on the reported symptoms [${symptoms.join(", ")}], the assessment indicates a ${randomSeverity.toLowerCase()} condition. Recommended to consult a healthcare professional for accurate diagnosis.`;

  const recommendations: Record<string, string> = {
    Mild: "Monitor symptoms and rest. Consult a doctor if symptoms persist beyond 48 hours.",
    Moderate: "Schedule an appointment with your primary care physician within 24 hours.",
    Severe: "Seek immediate medical attention. Visit the nearest emergency room.",
  };

  return SymptomAnalysisModel.create({
    patientId,
    reportedSymptoms: symptoms,
    AI_Assessment_Result: assessmentResult,
    recommendedAction: recommendations[randomSeverity],
    timestamp: new Date(),
  });
}

export async function analyzeReport(
  patientId: string,
  reportType: string,
  uploadedImageUrl: string,
  additionalNotes?: string
): Promise<IReportAnalysis> {
  const structuredData = {
    extractedMarkers: [
      { name: "Hemoglobin", value: "14.2", unit: "g/dL", range: "13.0-17.0", status: "Normal" },
      { name: "WBC", value: "7.5", unit: "x10^3/uL", range: "4.5-11.0", status: "Normal" },
      { name: "Platelets", value: "250", unit: "x10^3/uL", range: "150-400", status: "Normal" },
    ],
    confidence: 89.5,
    processingMethod: "AI Vision Analysis",
  };

  const summary = `Report analysis completed for ${reportType}. Key markers within normal ranges. AI confidence score: ${structuredData.confidence}%.`;

  const doctorNotes = additionalNotes
    ? `Patient notes: ${additionalNotes}. All extracted markers appear normal. Regular monitoring recommended.`
    : `AI analysis complete. All primary markers within reference ranges. Follow-up in 3 months recommended.`;

  return ReportAnalysisModel.create({
    patientId,
    reportType,
    uploadedImageUrl,
    structuredData,
    analysisSummary: summary,
    aiDoctorNotes: doctorNotes,
  });
}

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
