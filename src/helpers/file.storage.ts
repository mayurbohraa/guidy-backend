import mongoose, { Types } from "mongoose";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export function resourceBucket() {
  if (!mongoose.connection.db) throw new Error("Database is not connected");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "resourceFiles" });
}

export async function storeFile(buffer: Buffer, filename: string, contentType: string) {
  const stream = resourceBucket().openUploadStream(filename, { metadata: { contentType } });
  try { await pipeline(Readable.from(buffer), stream); }
  catch (error) { await resourceBucket().delete(stream.id).catch(() => undefined); throw error; }
  return new Types.ObjectId(stream.id.toHexString());
}

export async function removeFile(id: Types.ObjectId) {
  await resourceBucket().delete(id);
}
