import { getDB } from "../config/db.js";

const SETTINGS_COLLECTION = "platform_settings";
const SETTINGS_DOC_ID = "global";

export interface PlatformSettings {
  maintenance_mode: boolean;
  allow_registration: boolean;
  require_doctor_verification: boolean;
  ai_disclaimer: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  maintenance_mode: false,
  allow_registration: true,
  require_doctor_verification: true,
  ai_disclaimer: true,
};

export async function getSettings(): Promise<PlatformSettings> {
  const db = getDB();
  const doc = await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_DOC_ID as any });
  return doc ? ({ ...DEFAULT_SETTINGS, ...doc } as PlatformSettings) : DEFAULT_SETTINGS;
}

export async function updateSettings(
  data: Partial<PlatformSettings>
): Promise<PlatformSettings> {
  const db = getDB();
  await db.collection(SETTINGS_COLLECTION).updateOne(
    { _id: SETTINGS_DOC_ID as any },
    { $set: data },
    { upsert: true }
  );
  return getSettings();
}
