import {displayPdfName} from './file-name';
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export type LocalPdf = { uri: string; name: string; size: number };
export type AttachedDocument = LocalPdf & { id: string; meetingId: string; status: 'attached'; remoteId?: string; createdAt: string };
export function validateLocalPdf(file: LocalPdf): LocalPdf {
  const name=displayPdfName(file.name);
  if (!file.uri.startsWith('file://') || !/\.pdf$/i.test(name)) throw new Error('PDF 파일을 선택해 주세요.');
  if (!Number.isInteger(file.size) || file.size < 1 || file.size > MAX_PDF_BYTES) throw new Error('PDF는 20MB 이하의 파일만 첨부할 수 있어요.');
  const cleaned = name;
  return { ...file, name: cleaned.length > 200 ? `${cleaned.slice(0, 196)}.pdf` : cleaned };
}
