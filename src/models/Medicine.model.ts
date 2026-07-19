import mongoose, { Schema, Document } from "mongoose";

export interface IMedicine extends Document {
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  price: number;
  stockQuantity: number;
  description: string;
  image?: string;
  isPrescriptionRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    manufacturer: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, required: true, trim: true },
    image: { type: String },
    isPrescriptionRequired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1, price: 1 });
medicineSchema.index({ name: "text", genericName: "text", description: "text" });

export const MedicineModel = mongoose.model<IMedicine>("Medicine", medicineSchema);
