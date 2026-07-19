import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage {
  senderId: Types.ObjectId;
  content: string;
  timestamp: Date;
}

export type ChatStatus = "Active" | "Closed";

export interface IChatSession extends Document {
  participants: Types.ObjectId[];
  messages: IMessage[];
  status: ChatStatus;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new Schema<IChatSession>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: { type: [messageSchema], default: [] },
    status: { type: String, enum: ["Active", "Closed"], default: "Active", index: true },
  },
  { timestamps: true }
);

chatSessionSchema.index({ participants: 1 });
chatSessionSchema.index({ status: 1, createdAt: -1 });

export const ChatSessionModel = mongoose.model<IChatSession>("ChatSession", chatSessionSchema);
