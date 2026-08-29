/**
 * The mark and wordmark that sit at the left of the top bar on a wide screen.
 *
 * **The mark is a placeholder, and is meant to be replaced.** This project
 * has no logo asset — there is no `.svg`, no favicon, no brand file anywhere
 * in `apps/web` — and inventing a permanent identity for a study is the
 * owner's decision, not a decision to make while laying out a toolbar. So
 * what is drawn here is deliberately restrained and deliberately swappable:
 * it lives in this one file, on the same 24px grid and the same stroke
 * weight as the tab icons (`TabIcon`), so replacing it with a real mark is a
 * single edit to the `<svg>` below and touches nothing else.
 *
 * It is hidden below the wide-screen breakpoint. On a phone the four reading
 * controls already fill the row, and this bar holds one row at 320px by
 * measurement, not by luck — see `.elder-toolbar` in `styles.css`. Branding
 * is not worth a second row in the bar an 78-year-old uses to make the text
 * bigger.
 */
export function BrandMark() {
  return (
    <span className="elder-toolbar__brand">
      {/*
        Decorative: the wordmark beside it already carries the name, and an
        alt text here would make a screen reader say "icareu" twice.
      */}
      <svg
        className="elder-toolbar__brand-mark"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9.25" />
        <circle cx="12" cy="9.5" r="2.5" />
        <path d="M6.9 17.4a5.6 5.6 0 0 1 10.2 0" />
      </svg>
      <span className="elder-toolbar__wordmark">icareu</span>
    </span>
  );
}
