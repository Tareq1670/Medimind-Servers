import mongoose, { Schema, Document } from "mongoose";

export type Severity = "Low" | "Medium" | "High";

export interface IHealthCondition extends Document {
  title: string;
  description: string;
  symptoms: string[];
  severity: Severity;
  precautions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const healthConditionSchema = new Schema<IHealthCondition>(
  {
    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    symptoms: { type: [String], default: [] },
    severity: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High"],
      index: true,
    },
    precautions: { type: [String], default: [] },
  },
  { timestamps: true }
);

healthConditionSchema.index({ title: 1 });
healthConditionSchema.index({ severity: 1 });
healthConditionSchema.index({ title: "text", description: "text", symptoms: "text" });

export const HealthConditionModel = mongoose.model<IHealthCondition>(
  "HealthCondition",
  healthConditionSchema
);
