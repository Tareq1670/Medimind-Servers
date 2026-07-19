import mongoose, { Schema, Document, Types } from "mongoose";

export type BlogStatus = "Draft" | "Published";

export interface IBlog extends Document {
  title: string;
  content: string;
  authorId: Types.ObjectId;
  tags: string[];
  coverImage?: string;
  status: BlogStatus;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tags: { type: [String], default: [], index: true },
    coverImage: { type: String },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft", index: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ title: 1 });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ title: "text", content: "text", tags: "text" });

export const BlogModel = mongoose.model<IBlog>("Blog", blogSchema);
