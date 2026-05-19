import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  console.log(`Starting PDF extraction for buffer of size: ${buffer.length} bytes`);
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`PDF successfully loaded. Total pages: ${numPages}`);
    
    let fullText = "";
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(" ");
      
      fullText += pageText + "\n";
      console.log(`Extracted text from page ${i}/${numPages} (Length: ${pageText.length})`);
    }

    const finalResult = fullText.trim();
    console.log(`PDF Extraction Complete. Final text length: ${finalResult.length}`);

    if (finalResult.length === 0) {
      console.error("Zero characters extracted from PDF.");
      throw new Error("This PDF contains no readable text. It might be a scanned image or empty.");
    }

    return finalResult;
  } catch (error: any) {
    console.error("PDF extraction failed with pdfjs-dist:", error);
    throw new Error("Failed to extract text from PDF. Please ensure it is a text-based PDF and not a scanned image.");
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
