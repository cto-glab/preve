import {displayPdfName} from './file-name';
import { ApiError, createApiClient } from '../../api/client';
import { LocalPdf, validateLocalPdf } from './model';
export const DOCUMENT_API_VERSION = '0.5.0';
export const DOCUMENT_AI_CONSENT = 'document-analysis-2026-10-28';
export type AnalysisFact = { kind: 'delivery' | 'price' | 'scope' | 'other'; text: string; page: number; quote: string };
export type Analysis = { source: 'openai'; model: string; pageCount: number; summary: string; facts: AnalysisFact[]; openQuestions: string[]; warnings: string[]; evidenceVerification: 'ai-extracted'; analyzedAt: string };
export type RemoteDocument = { documentId: string; meetingId: string; fileName: string; size: number; pageCount: number; status: 'queued' | 'processing' | 'ready' | 'failed'; error: string | null; updatedAt?:string|null; analysis: Analysis | null };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const states = ['queued', 'processing', 'ready', 'failed'];
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function string(value: unknown, max = 2000): value is string { return typeof value === 'string' && !!value.trim() && value.length <= max; }
function invalid(): never { throw new ApiError('invalid-response'); }
function pageCount(value: unknown): value is number { return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 100; }
function parseAnalysis(value: unknown, pages: number): Analysis {
  if (!object(value) || value.source !== 'openai' || value.evidenceVerification !== 'ai-extracted' || !string(value.model, 200) || !string(value.summary) || value.pageCount !== pages || !string(value.analyzedAt, 100) || !Number.isFinite(Date.parse(value.analyzedAt))) return invalid();
  if (!Array.isArray(value.facts) || value.facts.length > 40) return invalid();
  const facts = value.facts.map(fact => {
    if (!object(fact) || !['delivery', 'price', 'scope', 'other'].includes(String(fact.kind)) || !string(fact.text, 1200) || !string(fact.quote, 1000) || !Number.isInteger(fact.page) || Number(fact.page) < 1 || Number(fact.page) > pages) return invalid();
    return { kind: fact.kind, text: fact.text, quote: fact.quote, page: fact.page } as AnalysisFact;
  });
  const strings = (input: unknown): string[] => {
    if (!Array.isArray(input) || input.length > 20 || !input.every(item => string(item, 1000))) return invalid();
    return input;
  };
  return { source: 'openai', model: value.model, summary: value.summary, facts, pageCount: pages, openQuestions: strings(value.openQuestions), warnings: strings(value.warnings), evidenceVerification: 'ai-extracted', analyzedAt: value.analyzedAt };
}
export function parseRemoteDocument(value: unknown): RemoteDocument {
  if (!object(value) || !string(value.documentId, 36) || !uuid.test(value.documentId) || !string(value.meetingId, 64) || !string(value.fileName, 255) || !Number.isInteger(value.size) || Number(value.size) < 1 || Number(value.size) > 20 * 1024 * 1024 || !pageCount(value.pageCount) || !states.includes(String(value.status)) || (value.error !== null && !string(value.error, 100))) return invalid();
  const analysis = value.status === 'ready' ? parseAnalysis(value.analysis, value.pageCount) : null;
  if (value.status !== 'ready' && value.analysis !== null) return invalid();
  return { documentId: value.documentId, meetingId: value.meetingId, fileName: displayPdfName(value.fileName), updatedAt:typeof value.updatedAt==='string'&&Number.isFinite(Date.parse(value.updatedAt))?value.updatedAt:null, size: Number(value.size), pageCount: value.pageCount, status: value.status as RemoteDocument['status'], error: value.error as string | null, analysis };
}
function documentId(value: string) { if (!uuid.test(value)) throw new Error('Invalid document ID'); return value; }
function meetingId(value: string) { if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) throw new Error('Invalid meeting ID'); return value; }
function receipt(value: unknown): Pick<RemoteDocument, 'documentId' | 'status'> {
  if (!object(value) || typeof value.documentId !== 'string' || !uuid.test(value.documentId) || !states.includes(String(value.status))) return invalid();
  return { documentId: value.documentId, status: value.status as RemoteDocument['status'] };
}
export function createDocumentApi(client: Pick<ReturnType<typeof createApiClient>, 'request'>, makeForm = () => new FormData()) {
  return {
    async upload(meeting: string, input: LocalPdf, requestKey: string, consent: boolean) {
      if (!consent) throw new Error('문서의 OpenAI 전송·분석에 동의해 주세요.');
      if (!/^[A-Za-z0-9_-]{16,80}$/.test(requestKey)) throw new Error('Invalid upload request key');
      const file = validateLocalPdf(input);
      const route = `/v1/meetings/${meetingId(meeting)}/documents`;
      const body = makeForm();
      body.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' } as unknown as Blob);
      return receipt(await client.request(route, { method: 'POST', headers: { 'Idempotency-Key': requestKey, 'X-AI-Consent': DOCUMENT_AI_CONSENT }, body }, { timeoutMs: 60000 }));
    },
    async status(id: string) { return parseRemoteDocument(await client.request(`/v1/documents/${documentId(id)}`)); },
    async list(meeting: string) {
      const result = await client.request<unknown>(`/v1/meetings/${meetingId(meeting)}/documents`);
      if (!object(result) || !Array.isArray(result.documents) || result.documents.length > 100) return invalid();
      return result.documents.map(parseRemoteDocument);
    },
    async retry(id: string, consent: boolean) {
      if (!consent) throw new Error('문서의 OpenAI 전송·분석에 동의해 주세요.');
      return receipt(await client.request(`/v1/documents/${documentId(id)}/retry`, { method: 'POST', headers: { 'X-AI-Consent': DOCUMENT_AI_CONSENT } }));
    },
  };
}
