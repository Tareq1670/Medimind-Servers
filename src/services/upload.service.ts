import axios from "axios";
import FormData from "form-data";
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

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", fileBuffer, fileName);

  const response = await axios.post<{
    data: { url: string; display_url?: string; thumb_url?: string };
  }>(IMGBB_API_URL, formData, {
    headers: formData.getHeaders(),
    timeout: 30000,
  });

  return response.data.data.url;
}
