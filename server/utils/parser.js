const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

/**
 * Extracts raw text from a PDF buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
async function parsePDF(buffer) {
  // Purge require cache for pdf-parse and underlying pdf.js to prevent global state leaks/corruption
  Object.keys(require.cache).forEach(key => {
    if (key.includes('pdf-parse') || key.includes('pdf.js')) {
      delete require.cache[key];
    }
  });

  const freshPdfParse = require('pdf-parse');

  // Warm up the fresh instance to absorb the first-run initialization bug
  const dummyPDFBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<< /Size 1 >>\nstartxref\n0\n%%EOF');
  await freshPdfParse(dummyPDFBuffer).catch(() => {});

  try {
    const data = await freshPdfParse(buffer);
    return data.text;
  } catch (error) {
    console.warn("PDF Parsing failed on first try. Retrying with a fresh instance...");
    
    // Purge cache again for retry
    Object.keys(require.cache).forEach(key => {
      if (key.includes('pdf-parse') || key.includes('pdf.js')) {
        delete require.cache[key];
      }
    });
    const retryPdfParse = require('pdf-parse');
    await retryPdfParse(dummyPDFBuffer).catch(() => {});

    try {
      const data = await retryPdfParse(buffer);
      return data.text;
    } catch (retryError) {
      console.error("PDF Parsing Error after retry:", retryError);
      throw new Error("Failed to parse PDF file. The document might be encrypted or corrupted.");
    }
  }
}

/**
 * Extracts raw text from a DOCX Word buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
async function parseDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("DOCX Parsing Error:", error);
    throw new Error("Failed to parse Word Document (.docx).");
  }
}

/**
 * Performs OCR to extract text from an image buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
async function parseImage(buffer) {
  try {
    const result = await Tesseract.recognize(buffer, 'eng');
    return result.data.text;
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to perform OCR on the image. Make sure it is clear and in English.");
  }
}

/**
 * Dispatches parsing based on file mime type
 * @param {Object} file Multer file object
 * @returns {Promise<string>}
 */
async function parseFile(file) {
  const mimeType = file.mimetype;
  const buffer = file.buffer;

  if (mimeType === 'application/pdf') {
    return await parsePDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    mimeType === 'application/msword'
  ) {
    return await parseDocx(buffer);
  } else if (mimeType.startsWith('image/')) {
    return await parseImage(buffer);
  } else if (mimeType === 'text/plain') {
    return buffer.toString('utf8');
  } else {
    throw new Error("Unsupported file type. Please upload a PDF, DOCX, TXT, or Image (PNG/JPG).");
  }
}

module.exports = {
  parsePDF,
  parseDocx,
  parseImage,
  parseFile
};
