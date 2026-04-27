// ============================================
// File Parsers - PDF, DOCX, TXT, PPTX
// ============================================

if (typeof global !== 'undefined' && typeof (global as any).DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m21 = 0; m22 = 1; m41 = 0; m42 = 0;
    is2D = true; isIdentity = true;
    constructor() {}
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
  };
}

export async function parsePDF(buffer: Buffer): Promise<string> {
  let parser;
  try {
    const lib = await import('pdf-parse');
    const PDFParse = lib.PDFParse;
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      await parser.destroy();
    }
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const fn = mammoth.extractRawText || (mammoth as any).default?.extractRawText;
    const result = await fn({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parse error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

export async function parseTXT(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

export async function parseFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf':
      return parsePDF(buffer);
    case 'docx':
    case 'doc':
      return parseDOCX(buffer);
    case 'txt':
    case 'md':
      return parseTXT(buffer);
    case 'pptx':
      return parsePPTX(buffer);
    default:
      return parseTXT(buffer);
  }
}

export async function parsePPTX(buffer: Buffer): Promise<string> {
  try {
    const mod = await import('jszip');
    const JSZip = mod.default || mod;
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/ppt\/slides\/slide\d+\.xml/))
      .sort();

    let allText = '';
    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('string');
      const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches
          .map(match => match.replace(/<[^>]*>/g, ''))
          .join(' ');
        allText += slideText + '\n\n';
      }
    }
    return allText || 'No text content found in presentation';
  } catch (error) {
    console.error('PPTX parse error:', error);
    throw new Error('Failed to parse PPTX file');
  }
}
