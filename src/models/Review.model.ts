import mongoose, { Schema, Document, Types } from "mongoose";

export type TargetType = "Doctor" | "Medicine";

export interface IReview extends Document {
  reviewerId: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: TargetType;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: { type: String, required: true, enum: ["Doctor", "Medicine"], index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ targetId: 1, targetType: 1 });
reviewSchema.index({ reviewerId: 1, targetId: 1, targetType: 1 }, { unique: true });

export const ReviewModel = mongoose.model<IReview>("Review", reviewSchema);
