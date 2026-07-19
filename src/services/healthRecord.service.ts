import { HealthRecordModel, IHealthRecord } from "../models/HealthRecord.model.js";

export async function getHealthRecordByPatientId(
  patientId: string
): Promise<IHealthRecord | null> {
  return HealthRecordModel.findOne({ patientId }).lean();
}

export async function createHealthRecord(
  data: Partial<IHealthRecord>
): Promise<IHealthRecord> {
  return HealthRecordModel.create(data);
}

export async function updateHealthRecord(
  patientId: string,
  data: Partial<IHealthRecord>
): Promise<IHealthRecord | null> {
  return HealthRecordModel.findOneAndUpdate(
    { patientId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
}

export async function deleteHealthRecord(patientId: string): Promise<IHealthRecord | null> {
  return HealthRecordModel.findOneAndDelete({ patientId }).lean();
}
