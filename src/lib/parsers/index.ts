// ============================================
// File Parsers - PDF, DOCX, TXT, PPTX
// ============================================

import { PDFParse } from 'pdf-parse';

export async function parsePDF(buffer: Buffer): Promise<string> {
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('Failed to parse PDF file');
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
