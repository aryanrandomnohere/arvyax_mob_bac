import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from "../config/constants.js";

const r2 = new AWS.S3({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: "auto",
  endpoint: R2_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const BUCKET_NAME = R2_BUCKET_NAME;
const PUBLIC_R2_URL = R2_PUBLIC_URL;

function extFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/heic") return "heic";
  if (m === "image/heif") return "heif";
  if (m === "image/gif") return "gif";
  return "bin";
}

export function getPublicR2Url(r2Key) {
  return `${PUBLIC_R2_URL}/${r2Key}`;
}

export async function uploadUserImageToR2({
  userId,
  dateKey,
  file,
  prefix = "mobile-user-images/journal",
}) {
  if (!file?.buffer) throw new Error("file buffer is required");
  if (!BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not configured");
  if (!PUBLIC_R2_URL) throw new Error("R2_PUBLIC_URL is not configured");

  const safeUser = String(userId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeDate = String(dateKey || "").replace(/[^0-9-]/g, "");
  const ext = extFromMime(file.mimetype);
  const key = `${prefix}/${safeUser}/${safeDate}/${uuidv4()}.${ext}`;

  await r2
    .putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    })
    .promise();

  return { r2Key: key, url: getPublicR2Url(key) };
}
