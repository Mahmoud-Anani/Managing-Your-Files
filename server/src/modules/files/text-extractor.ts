import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parseOffice } from 'officeparser';
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

// Office formats that the universal parser (officeparser) can extract text
// from: Office Open XML (docx/xlsx/pptx), OpenDocument (odt/ods/odp) and RTF.
// Legacy binary formats (doc/xls/ppt) are routed here too; officeparser will
// simply return no text for them, which preserves the previous behaviour.
const OFFICE_EXTENSIONS: ReadonlySet<string> = new Set([
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'rtf',
]);

const OFFICE_MIME_PREFIXES: ReadonlyArray<string> = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml',
  'application/vnd.oasis.opendocument',
  'application/rtf',
];

function isTextMime(mimeType: string): boolean {
  return TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

function isOfficeMime(mimeType: string): boolean {
  return OFFICE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
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
      OFFICE_EXTENSIONS.has(input.extension) ||
      isOfficeMime(input.mimeType)
    ) {
      const ast = await parseOffice(input.buffer, {
        ocr: false,
        extractAttachments: false,
      });
      return ast.toText().slice(0, MAX_EXTRACTED_TEXT_LENGTH);
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
