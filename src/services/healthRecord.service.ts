import { healthRecordsCol, toObjectId } from "../db/collections.js";
import type { IHealthRecord } from "../types/models.js";

export async function getHealthRecordByPatientId(patientId: string): Promise<IHealthRecord | null> {
  return healthRecordsCol().findOne({ patientId: toObjectId(patientId) });
}

export async function createHealthRecord(data: Record<string, unknown>): Promise<IHealthRecord> {
  const now = new Date();
  const doc: IHealthRecord = {
    patientId: toObjectId(data.patientId as string),
    chronicConditions: (data.chronicConditions as string[]) || [],
    allergies: (data.allergies as string[]) || [],
    currentMedications: (data.currentMedications as IHealthRecord["currentMedications"]) || [],
    emergencyContact: data.emergencyContact as IHealthRecord["emergencyContact"],
    createdAt: now,
    updatedAt: now,
  };
  const result = await healthRecordsCol().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateHealthRecord(patientId: string, data: Record<string, unknown>): Promise<IHealthRecord | null> {
  const update: Record<string, unknown> = { $set: { ...data, updatedAt: new Date() } };
  delete (update.$set as Record<string, unknown>)._id;
  return healthRecordsCol().findOneAndUpdate(
    { patientId: toObjectId(patientId) },
    update,
    { returnDocument: "after" }
  );
}

export async function deleteHealthRecord(patientId: string): Promise<IHealthRecord | null> {
  return healthRecordsCol().findOneAndDelete({ patientId: toObjectId(patientId) });
}
