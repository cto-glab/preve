export type LayoutMode = 'wide' | 'narrow' | 'short';
export function getLayoutMode(width: number, height: number): LayoutMode {
  if (height < 420) return 'short';
  return width < 600 ? 'narrow' : 'wide';
}
