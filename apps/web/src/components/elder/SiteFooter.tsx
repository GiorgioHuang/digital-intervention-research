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

export function SiteFooter({ year }: { year: number }) {
  return (
    <footer className="site-footer">
      {/*
        A copyright line and nothing else. A footer is where links go to be
        forgotten, and on a screen built for somebody who finds a page of
        options hard, adding a row of small print underneath the thing they
        came to do would undo the work of the page above it. Anything that
        deserves reading deserves a place on Help, which is one tap away
        from everywhere.
      */}
      <p>
        © {year} {COPYRIGHT_HOLDER}
      </p>
    </footer>
  );
}
