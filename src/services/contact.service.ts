import { getDB } from "../config/db.js";

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const db = getDB();
  await db.collection("contact_submissions").insertOne({
    ...data,
    createdAt: new Date(),
  });
}
