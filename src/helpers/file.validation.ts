import { extname } from "path";
import { connect } from "net";
import { once } from "events";

export const allowedExtensions = [".pdf", ".txt", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"];
export const uploadLimit = () => (process.env.VERCEL ? 4 : 10) * 1024 * 1024;
const invalid = () => Object.assign(new Error("File contents do not match a supported, readable format"), { status: 400 });

function zipEntries(buffer: Buffer) {
  let end = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw invalid();
  const count = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16), total = 0;
  const entries: string[] = [];
  if (!count || count > 2000) throw invalid();
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) throw invalid();
    const flags = buffer.readUInt16LE(cursor + 8), size = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28), extra = buffer.readUInt16LE(cursor + 30), comment = buffer.readUInt16LE(cursor + 32);
    if (cursor + 46 + nameLength + extra + comment > buffer.length || flags & 1) throw invalid();
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8").replace(/\\/g, "/");
    total += size;
    if (name.startsWith("/") || name.split("/").includes("..") || /^[A-Za-z]:/.test(name) || total > 100 * 1024 * 1024) throw invalid();
    entries.push(name); cursor += 46 + nameLength + extra + comment;
  }
  return entries;
}

export function inspectFile(buffer: Buffer, filename: string) {
  const ext = extname(filename).toLowerCase();
  if (!allowedExtensions.includes(ext) || !buffer.length || buffer.length > uploadLimit()) throw invalid();
  const starts = (hex: string) => buffer.subarray(0, hex.length / 2).equals(Buffer.from(hex, "hex"));
  if (ext === ".txt") {
    try { new TextDecoder("utf-8", { fatal: true }).decode(buffer); } catch { throw invalid(); }
    if (buffer.some(byte => byte < 9 || (byte > 13 && byte < 32))) throw invalid();
    return "text/plain";
  }
  if (ext === ".pdf" && buffer.subarray(0, 5).toString() === "%PDF-" && buffer.subarray(-1024).includes(Buffer.from("%%EOF"))) return "application/pdf";
  if (ext === ".png" && starts("89504e470d0a1a0a") && buffer.length >= 33 && buffer.subarray(12,16).toString() === "IHDR") return "image/png";
  if ([".jpg", ".jpeg"].includes(ext) && starts("ffd8ff") && buffer.subarray(-2).equals(Buffer.from("ffd9", "hex"))) return "image/jpeg";
  if ([".doc", ".xls", ".ppt"].includes(ext) && starts("d0cf11e0a1b11ae1") && buffer.length >= 512) return "application/octet-stream";
  if ([".zip", ".docx", ".xlsx", ".pptx"].includes(ext) && starts("504b0304")) {
    const entries = zipEntries(buffer);
    if (ext !== ".zip") {
      const folder = ext === ".docx" ? "word/" : ext === ".xlsx" ? "xl/" : "ppt/";
      if (!entries.includes("[Content_Types].xml") || !entries.some(name => name.startsWith(folder))) throw invalid();
      if (entries.some(name => /vbaProject\.bin$/i.test(name))) throw invalid();
    }
    return "application/octet-stream";
  }
  throw invalid();
}

export async function scanFile(buffer: Buffer): Promise<"clean" | "format-checked"> {
  const host = process.env.CLAMAV_HOST;
  if (!host) {
    if (process.env.REQUIRE_MALWARE_SCAN === "true") throw Object.assign(new Error("File scanning is not configured"), { status: 503 });
    return "format-checked";
  }
  const socket = connect({ host, port: Number(process.env.CLAMAV_PORT || 3310) });
  let response = "";
  const reply = new Promise<string>((resolve, reject) => {
    socket.setTimeout(15000, () => socket.destroy(new Error("Scan timeout")));
    socket.on("error", reject);
    socket.on("data", chunk => {
      response += chunk.toString();
      if (response.length > 4096) socket.destroy(new Error("Invalid scanner reply"));
      else if (response.includes("\0") || response.includes("\n")) resolve(response.replace(/[\0\r\n]/g, ""));
    });
    socket.on("end", () => response ? resolve(response.trim()) : reject(new Error("Empty scanner reply")));
  });
  // Attach a rejection handler before connecting so failed sockets never produce unhandled promises.
  reply.catch(() => undefined);
  try {
    await once(socket, "connect");
    socket.write("zINSTREAM\0");
    for (let offset = 0; offset < buffer.length; offset += 65536) {
      const chunk = buffer.subarray(offset, offset + 65536), length = Buffer.alloc(4);
      length.writeUInt32BE(chunk.length); socket.write(length);
      if (!socket.write(chunk)) await once(socket, "drain");
    }
    socket.write(Buffer.alloc(4));
    const result = await reply;
    if (result.endsWith(" FOUND")) throw Object.assign(new Error("The file was rejected by malware scanning"), { status: 400 });
    if (result !== "stream: OK") throw new Error("Scanner unavailable");
    return "clean";
  } catch (error) {
    if ((error as any).status === 400) throw error;
    throw Object.assign(new Error("File scanning is unavailable. Try again later."), { status: 503 });
  } finally { socket.destroy(); }
}
