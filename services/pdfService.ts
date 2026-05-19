import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text?.trim();

    if (!text) {
      throw new Error("No readable text found in this PDF.");
    }

    return text;
  } catch (error: any) {
    console.error("PDF extraction failed:", error);
    throw new Error("Failed to extract text from PDF. Please try a text-based PDF instead of a scanned image PDF.");
  }
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200) {
  const chunks = [];
  let i = 0;
  
  // Clean text a bit
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  while (i < cleanText.length) {
    const chunk = cleanText.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  
  return chunks;
}
