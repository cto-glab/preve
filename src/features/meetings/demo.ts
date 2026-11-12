export type Meeting = { id: string; startsAt?: string|null; source?: 'manual' | 'google'; title: string; time: string; company: string; contact: string; location: string; brief: string; briefPages: string[]; evidence: string[] };
export const demoMeetings: Meeting[] = [
 { id: 'demo-proposal', title: '서비스 도입 제안 미팅', time: '14:00 – 15:00', company: '샘플테크', contact: '김담당 · 구매 담당', location: '샘플테크 회의실 (가상 장소)', brief: '요청서의 납기는 4주, 제안서는 6주입니다. 납기 기준을 먼저 확인하세요.', briefPages: ['요청서의 납기는 4주입니다.', '제안서는 6주입니다. 납기 기준을 확인하세요.'], evidence: ['샘플 요청서 · 2쪽: 납기 4주', '샘플 제안서 · 8쪽: 납기 6주'] },
 { id: 'demo-followup', title: '프로젝트 진행 점검', time: '16:00 – 16:30', company: '예시스튜디오', contact: '이담당 · 프로젝트 매니저', location: '온라인 미팅', brief: '첨부자료가 없습니다. 진행 상황과 다음 일정을 확인해 보세요.', briefPages: ['첨부자료가 없습니다.', '진행 상황과 다음 일정을 확인해 보세요.'], evidence: [] },
];
export function findMeeting(id: string, demo: boolean) { return demo ? demoMeetings.find(item => item.id === id) : undefined; }
