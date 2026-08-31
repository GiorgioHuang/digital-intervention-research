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
export function BrandMark({ onHome, homeLabel }: { onHome: () => void; homeLabel: string }) {
  return (
    /*
     * A real link, not a button.
     *
     * The brand goes to the start of the site from anywhere (owner,
     * 2026-08-31), and the site has real addresses now — so this can be an
     * `<a href="/">` and should be: right-click to copy, middle-click to
     * open in a tab, and the address showing in the status bar are all
     * things a link does and a button silently does not.
     *
     * A plain left click is handled here instead, so it routes without
     * reloading the page. Modified clicks — a new tab, a new window, a
     * download — are left to the browser, which is the whole reason for
     * using a link in the first place.
     */
    <a
      className="elder-toolbar__brand"
      href="/"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onHome();
      }}
    >
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
      {/*
        Where it goes, for anyone who cannot see it.

        The wordmark is `display: none` below 384px, and CSS-hidden text is
        gone from the accessibility tree — so below that width the link
        would otherwise be an unnamed icon. This is always present, which
        also means the accessible name still contains the visible text
        when the wordmark is showing (WCAG 2.5.3, Label in Name).

        The word comes from the caller because the destination is not
        always the same thing: `/` is Home once somebody is signed in and
        the way in before that, and calling the sign-in screen "Home" to
        somebody who cannot get in would be the wrong word at the worst
        moment.
      */}
      <span className="visually-hidden">{homeLabel}</span>
    </a>
  );
}

/**
 * The brand as a block, centred, for the sign-in screen: the mark above the
 * name rather than beside it. Read off the live prototype — the earlier
 * written handoff had no brand on this screen at all.
 */
export function BrandBlock() {
  return (
    <span className="brand-block">
      <svg
        className="brand-block__mark"
        viewBox="0 0 24 24"
        width="40"
        height="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 6v4a8 8 0 0 0 16 0V6" />
        <circle cx="12" cy="12.4" r="2.3" fill="currentColor" stroke="none" />
      </svg>
      <span className="brand-block__word">icareu</span>
    </span>
  );
}
