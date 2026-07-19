import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReportFinding {
  name: string;
  value: string;
  unit?: string;
  range?: string;
  status: "Normal" | "Low" | "High" | "Critical";
  explanation?: string;
}

export interface IReportAiAnalysis {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskIndicators: string[];
  normalValues: Record<string, unknown>;
  abnormalValues: Record<string, unknown>;
}

export interface IReportAnalysis extends Document {
  patientId: Types.ObjectId;
  reportName?: string;
  reportType: string;
  uploadedImageUrl?: string;
  originalText?: string;
  structuredData?: Record<string, unknown>;
  analysisSummary?: string;
  aiDoctorNotes?: string;
  aiAnalysis?: IReportAiAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const reportAnalysisSchema = new Schema<IReportAnalysis>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportName: { type: String, trim: true },
    reportType: { type: String, required: true, trim: true, index: true },
    uploadedImageUrl: { type: String },
    originalText: { type: String },
    structuredData: { type: Schema.Types.Mixed },
    analysisSummary: { type: String, trim: true },
    aiDoctorNotes: { type: String, trim: true },
    aiAnalysis: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

reportAnalysisSchema.index({ patientId: 1, createdAt: -1 });
reportAnalysisSchema.index({ reportType: 1 });

export const ReportAnalysisModel = mongoose.model<IReportAnalysis>(
  "ReportAnalysis",
  reportAnalysisSchema
);
