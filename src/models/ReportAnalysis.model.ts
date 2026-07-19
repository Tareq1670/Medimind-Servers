import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReportAnalysis extends Document {
  patientId: Types.ObjectId;
  reportType: string;
  uploadedImageUrl?: string;
  structuredData?: Record<string, unknown>;
  analysisSummary?: string;
  aiDoctorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportAnalysisSchema = new Schema<IReportAnalysis>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportType: { type: String, required: true, trim: true, index: true },
    uploadedImageUrl: { type: String },
    structuredData: { type: Schema.Types.Mixed },
    analysisSummary: { type: String, trim: true },
    aiDoctorNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

reportAnalysisSchema.index({ patientId: 1, createdAt: -1 });
reportAnalysisSchema.index({ reportType: 1 });

export const ReportAnalysisModel = mongoose.model<IReportAnalysis>(
  "ReportAnalysis",
  reportAnalysisSchema
);
