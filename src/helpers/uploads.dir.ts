import fs from "fs";
import os from "os";
import { join } from "path";

// On serverless platforms (Vercel / AWS Lambda) the project filesystem is
// read-only and only the OS temp dir (e.g. /tmp) is writable. Locally we keep
// using a project-relative ./uploads folder.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const uploadsDir = isServerless
  ? join(os.tmpdir(), "uploads")
  : join(process.cwd(), "uploads");

// Ensure the directory exists, but never crash if it cannot be created.
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.warn(`Could not pre-create uploads dir "${uploadsDir}":`, err);
}
