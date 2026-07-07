import * as pdfjsLib from 'pdfjs-dist';

// Load the PDFJS worker with a version matching the installed pdfjs-dist package to avoid version mismatch errors
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.1.200'}/build/pdf.worker.min.mjs`;

/**
 * Extracts plain text from a PDF file.
 * @param file The PDF file uploaded by the user.
 * @param onProgress Callback function for extraction progress (0 to 100).
 */
export async function extractTextFromPdf(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<{ text: string; title: string; wordCount: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    // Wire up standard loading task progress if possible, or fall back to page-by-page progress
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let textContent = '';
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      
      textContent += pageText + '\n\n';
      
      if (onProgress) {
        onProgress(Math.round((pageNum / numPages) * 100));
      }
    }
    
    const title = file.name
      .replace(/\.[^/.]+$/, "") // Remove file extension
      .replace(/[_-]/g, " ");    // Replace underscores and hyphens with spaces
    
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    
    return { 
      text: textContent, 
      title: title,
      wordCount: wordCount
    };
  } catch (error) {
    console.error("PDF text extraction error:", error);
    throw new Error("Failed to extract text from PDF. The file might be corrupted, password-protected, or scanned image-only.");
  }
}
