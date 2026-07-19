import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICurrentMedication {
  name: string;
  dosage: string;
  frequency: string;
  startDate?: Date;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IHealthRecord extends Document {
  patientId: Types.ObjectId;
  chronicConditions: string[];
  allergies: string[];
  currentMedications: ICurrentMedication[];
  emergencyContact?: IEmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

const currentMedicationSchema = new Schema<ICurrentMedication>(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    startDate: { type: Date },
  },
  { _id: false }
);

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const healthRecordSchema = new Schema<IHealthRecord>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    chronicConditions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    currentMedications: { type: [currentMedicationSchema], default: [] },
    emergencyContact: { type: emergencyContactSchema },
  },
  { timestamps: true }
);

export const HealthRecordModel = mongoose.model<IHealthRecord>(
  "HealthRecord",
  healthRecordSchema
);
