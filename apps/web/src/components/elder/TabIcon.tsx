/**
 * The five tab-bar icons, from the handoff's Assets: Lucide, 24px grid,
 * `stroke-width: 2`, round caps, `currentColor`.
 *
 * Inlined rather than pulled in as a dependency — five glyphs against a
 * whole icon package — and drawn on Lucide's own grid so that adding the
 * sixth later matches. DESIGN_SYSTEM §A.9 has specified an icon system for
 * a long time and had none built; this is the first of it, and A.9's rule
 * still governs: **no icon appears without a text label**, which is why
 * these are `aria-hidden` and the label beside them does the naming.
 */
const PATHS: Record<string, string> = {
  house: 'M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z',
  'book-open': 'M12 7v14M3 5h5a4 4 0 0 1 4 3 4 4 0 0 1 4-3h5v13h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM2 7l10 6 10-6',
  'help-circle': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
};

export function TabIcon({ name }: { name: keyof typeof PATHS | string }) {
  const d = PATHS[name];
  if (d === undefined) return null;
  return (
    <svg
      className="elder-tab__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
