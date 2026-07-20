import { env } from "../config/env.js";

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

export async function uploadToImageBB(
  fileBuffer: Buffer,
  fileName = "image.jpg"
): Promise<string> {
  const apiKey = env.imagebbApiKey;
  if (!apiKey) {
    throw new Error("IMAGEBB_API_KEY environment variable is not set");
  }

  const base64 = fileBuffer.toString("base64");
  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64);

  const response = await fetch(`${IMGBB_API_URL}?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImageBB upload failed (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { data: { url: string; display_url?: string; thumb_url?: string } };
  return data.data.url;
}
