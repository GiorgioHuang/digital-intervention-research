/**
 * The mark and wordmark that sit at the left of the top bar on a wide screen.
 *
 * The mark is the owner's, supplied 2026-08-29; the source is
 * `design/brand/icareu-mark.svg` and this is the only place it is drawn, so
 * replacing it stays a single edit. It arrived already on this project's
 * icon grid — `viewBox="0 0 24 24"` at stroke-width 2, the same as
 * `TabIcon` — so nothing had to be adjusted to make it sit with the tab
 * icons, and its `#b68235` is exactly `--cl-accent`. The token is used
 * rather than the literal, which is §0.1 (literal colours live in `:root`
 * and nowhere else) and also means the mark follows the palette if the
 * palette ever moves.
 *
 * The wordmark is live text, not the `<text>` element in the supplied
 * `icareu-logo.svg`. That file forces its glyphs to a fixed width so it
 * renders identically without the font; this app self-hosts Cormorant
 * Garamond, so setting it as text keeps it crisp at any size and keeps it
 * real text — to a screen reader, and to find-in-page.
 *
 * **The mark is always on screen; the name is what gives way.** It used to
 * be the other way round — the whole thing vanished below the breakpoint,
 * because the four reading controls filled the row at 320px and a second
 * row in the bar an 78-year-old uses to make the text bigger is not worth a
 * brand. The room came from elsewhere: merging the two size buttons into a
 * segmented pair gives back their gap and one border, 18px, and the mark
 * costs 30. The wordmark, at 68px, is the part that still does not fit, and
 * it is also the part the mark already stands for.
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
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 6v4a8 8 0 0 0 16 0V6" />
        <circle cx="12" cy="12.4" r="2.3" fill="currentColor" stroke="none" />
      </svg>
      <span className="elder-toolbar__wordmark">icareu</span>
    </span>
  );
}
