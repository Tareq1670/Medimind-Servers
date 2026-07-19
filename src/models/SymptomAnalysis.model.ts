import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAiSymptomCondition {
  name: string;
  probability: string;
  description: string;
  commonIn?: string;
  urgency?: string;
}

export interface IAiSymptomAnalysis {
  urgencyLevel: "immediate" | "soon" | "routine" | "monitor";
  urgencyExplanation?: string;
  possibleConditions: IAiSymptomCondition[];
  recommendations: string[];
  warningSignsToWatch: string[];
  shouldSeeDoctor: boolean;
  doctorType?: string;
  lifestyleAdvice?: string[];
  disclaimer: string;
}

export interface ISymptomAnalysis extends Document {
  patientId: Types.ObjectId;
  reportedSymptoms: string[];
  duration?: string;
  severity?: string;
  additionalInfo?: string;
  aiAnalysis?: IAiSymptomAnalysis;
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
    duration: { type: String, trim: true },
    severity: { type: String, trim: true },
    additionalInfo: { type: String, trim: true },
    aiAnalysis: { type: Schema.Types.Mixed },
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
