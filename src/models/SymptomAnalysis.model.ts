import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISymptomAnalysis extends Document {
  patientId: Types.ObjectId;
  reportedSymptoms: string[];
  AI_Assessment_Result?: string;
  recommendedAction?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const symptomAnalysisSchema = new Schema<ISymptomAnalysis>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportedSymptoms: { type: [String], default: [] },
    AI_Assessment_Result: { type: String, trim: true },
    recommendedAction: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

symptomAnalysisSchema.index({ patientId: 1, timestamp: -1 });

export const SymptomAnalysisModel = mongoose.model<ISymptomAnalysis>(
  "SymptomAnalysis",
  symptomAnalysisSchema
);
