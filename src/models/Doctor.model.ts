import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface IDoctor extends Document {
  userId: Types.ObjectId;
  specialty: string;
  experienceYears: number;
  hospitalAffiliation: string;
  bio: string;
  consultationFee: number;
  availabilitySlots: IAvailabilitySlot[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialty: { type: String, required: true, trim: true, index: true },
    experienceYears: { type: Number, required: true, min: 0 },
    hospitalAffiliation: { type: String, required: true, trim: true },
    bio: { type: String, required: true, trim: true },
    consultationFee: { type: Number, required: true, min: 0 },
    availabilitySlots: { type: [availabilitySlotSchema], default: [] },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialty: 1, isVerified: 1 });
doctorSchema.index({ specialty: "text", bio: "text", hospitalAffiliation: "text" });

export const DoctorModel = mongoose.model<IDoctor>("Doctor", doctorSchema);
