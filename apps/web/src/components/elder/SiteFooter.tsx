/**
 * The footer, on the sign-in screen and under every signed-in page.
 *
 * The holder is the Healthy Aging Intelligence Lab, given by the owner
 * (2026-08-31) — it had been the brand name as a placeholder, because the
 * entity that holds copyright in a research platform is not something to
 * infer from a logo file.
 *
 * The year is a parameter, not a call to `new Date()` inside the render.
 * A footer that reads the clock is a small time bomb of exactly the kind
 * this project has already been caught by (D-103): a test asserting "2026"
 * passes all year and fails on 1 January, on code nobody touched. The
 * boundaries are decided by the caller and tested at fixed instants.
 */
export const COPYRIGHT_HOLDER = 'Healthy Aging Intelligence Lab (HAIL)';

export function SiteFooter({ year, onAbout }: { year: number; onAbout: () => void }) {
  return (
    <footer className="site-footer">
      {/*
        The copyright line and one link, which is what the prototype's
        footer carries. One is the limit: a footer is where links go to be
        forgotten, and on a screen built for somebody who finds a page of
        options hard, a row of small print under the thing they came to do
        would undo the work of the page above it. About earns its place
        because it is where the telephone number is, and because somebody
        deciding whether to trust this with their life story is owed a
        plain answer about who runs it, from every screen.
      */}
      <p>
        © {year} {COPYRIGHT_HOLDER} ·{' '}
        <button type="button" className="link-button link-button--small" onClick={onAbout}>
          about
        </button>
      </p>
    </footer>
  );
}
