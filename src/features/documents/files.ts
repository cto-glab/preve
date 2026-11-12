import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LocalPdf, validateLocalPdf } from './model';
function ownedDirectory() {
  if (!FileSystem.cacheDirectory) throw new Error('파일 보관 공간을 확인하지 못했습니다.');
  return `${FileSystem.cacheDirectory}preve-documents/`;
}
let initialization: Promise<void> | null = null;
export function initializeDocumentCache(): Promise<void> {
  if (!initialization) initialization = FileSystem.deleteAsync(ownedDirectory(), { idempotent: true }).catch(() => {
    initialization = null;
    throw new Error('지난 체험의 첨부파일 캐시를 정리하지 못했습니다. 다시 시도해 주세요.');
  });
  return initialization;
}
export async function deleteLocalPdf(uri: string): Promise<void> {
  const directory = ownedDirectory();
  const name = uri.slice(directory.length);
  if (!uri.startsWith(directory) || !/^[a-z0-9-]+\.pdf$/.test(name)) throw new Error('앱에서 첨부한 파일만 정리할 수 있어요.');
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
export async function pickLocalPdf(): Promise<LocalPdf | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new Error('선택한 파일을 확인하지 못했습니다.');
  const info = await FileSystem.getInfoAsync(asset.uri);
  if (!info.exists || info.isDirectory) throw new Error('파일을 읽을 수 없습니다. 다시 선택해 주세요.');
  const input = validateLocalPdf({ uri: asset.uri, name: asset.name, size: info.size });
  const signature = await FileSystem.readAsStringAsync(input.uri, { encoding: FileSystem.EncodingType.Base64, position: 0, length: 5 });
  if (signature !== 'JVBERi0=') throw new Error('PDF 형식을 확인하지 못했습니다. 파일 확장자만 바꾼 파일은 첨부할 수 없어요.');
  await initializeDocumentCache();
  const directory = ownedDirectory();
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const uri = `${directory}pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  try { await FileSystem.copyAsync({ from: input.uri, to: uri }); }
  catch { await deleteLocalPdf(uri).catch(() => {}); throw new Error('파일을 보관하지 못했습니다. 다시 시도해 주세요.'); }
  return { ...input, uri };
}
