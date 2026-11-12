export type MeetingNote = {
  id: string; meetingId: string; text: string; followUp: string; done: boolean; updatedAt: string;
};
export type NoteInput = { text: string; followUp: string };
export function normalizeNote(input: NoteInput): NoteInput {
  const text = input.text.trim();
  const followUp = input.followUp.trim();
  if (!text && !followUp) throw new Error('메모 또는 후속 할 일을 입력해 주세요.');
  if (text.length > 2000 || followUp.length > 300) throw new Error('메모는 2,000자, 후속 할 일은 300자까지 입력할 수 있어요.');
  return { text, followUp };
}
export type NoteAction =
  | { type: 'save'; note: MeetingNote }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string }
  | { type: 'clear' };
export function notesReducer(notes: MeetingNote[], action: NoteAction): MeetingNote[] {
  switch (action.type) {
    case 'clear': return [];
    case 'save': {
      const input = normalizeNote(action.note);
      const existing = notes.find(note => note.id === action.note.id);
      if (existing && existing.meetingId !== action.note.meetingId) throw new Error('다른 일정의 기록을 수정할 수 없습니다.');
      const next = { ...action.note, ...input, done: Boolean(input.followUp && action.note.done) };
      return existing ? notes.map(note => note.id === next.id ? next : note) : [next, ...notes];
    }
    case 'delete': return notes.filter(note => note.id !== action.id);
    case 'toggle': return notes.map(note => note.id === action.id && note.followUp ? { ...note, done: !note.done } : note);
  }
}
