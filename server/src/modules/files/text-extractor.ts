import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { MAX_EXTRACTED_TEXT_LENGTH } from '../../common/multer';

const TEXT_EXTENSIONS: ReadonlySet<string> = new Set([
  'txt',
  'md',
  'csv',
  'json',
  'xml',
  'log',
  'html',
  'htm',
  'yaml',
  'yml',
  'svg',
]);

const TEXT_MIME_PREFIXES: ReadonlyArray<string> = [
  'text/',
  'application/json',
  'application/xml',
  'application/x-yaml',
];

function isTextMime(mimeType: string): boolean {
  return TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export async function extractText(input: {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}): Promise<string | null> {
  try {
    if (input.extension === 'pdf' || input.mimeType === 'application/pdf') {
      const parsed = await pdfParse(input.buffer);
      return parsed.text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    }

    if (
      input.extension === 'docx' ||
      input.mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: input.buffer });
      return result.value.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    }

    if (
      TEXT_EXTENSIONS.has(input.extension) ||
      isTextMime(input.mimeType)
    ) {
      return input.buffer
        .toString('utf8')
        .slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    }

    return null;
  } catch {
    return null;
  }
}
