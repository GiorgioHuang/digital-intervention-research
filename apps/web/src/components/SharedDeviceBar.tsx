import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * The shared-device bar (DESIGN_SYSTEM §D.6; Doc 20 §306–307).
 *
 * On a community-centre tablet the two questions that matter are "whose
 * session is this" and "how do I get out of it now", and neither was
 * answerable from the screen: the identity was nowhere, and signing out
 * lived three taps deep inside Help.
 *
 * The bar carries both, plus the screen cover, and it is only shown when
 * someone has said the device is shared. On a personal phone a permanent
 * inverse-colour bar spends scarce vertical space at 320px on a risk that
 * is not present, and a control that is always there for no reason is how
 * people learn to stop reading the top of the screen.
 */
export function SharedDeviceBar({
  identity,
  onSwitchUser,
}: {
  identity: string;
  onSwitchUser: () => void;
}) {
  const [covered, setCovered] = useState(false);
  const uncover = useRef<HTMLButtonElement | null>(null);

  /**
   * Covering has to take the keyboard with it. Without this, tabbing from
   * behind the cover walks through every control on the page and a screen
   * reader reads out exactly what the cover was put up to hide. The cover
   * itself is a sibling of the application root, so marking everything
   * else inert leaves the one button that undoes it reachable.
   */
  useEffect(() => {
    if (!covered) return;
    const cover = document.getElementById('privacy-cover');
    const behind = Array.from(document.body.children).filter((child) => child !== cover);
    for (const el of behind) el.setAttribute('inert', '');
    uncover.current?.focus();
    return () => {
      for (const el of behind) el.removeAttribute('inert');
    };
  }, [covered]);

  return (
    <>
      {/*
        Short on purpose. §D.5 caps a sticky element at a quarter of the
        viewport, and the first draft of this bar — a full sentence over
        two block-level buttons — measured 304px against 844, which is more
        than a third of the screen permanently spent on a bar rather than
        on what the person came to do. The identity and both controls fit
        in two lines instead.
      */}
      <div className="context-banner">
        <p className="context-banner-identity">
          {/* Whatever identifies the session, said plainly. Nothing here is
              a name the platform holds — it is what was typed to get in. */}
          Signed in as <strong>{identity}</strong> — shared device
        </p>
        <p className="context-banner-actions">
          <button onClick={() => setCovered(true)}>Cover screen</button>
          <button aria-label="Sign out and switch user" onClick={onSwitchUser}>
            Switch user
          </button>
        </p>
      </div>
      {covered &&
        createPortal(
          /*
            An opaque block, never `filter: blur()`. A blur can be undone
            well enough from a photograph of the screen, and to someone with
            low vision it reads as the display having gone wrong rather than
            as something they did.
          */
          <div id="privacy-cover" className="privacy-cover" role="dialog" aria-modal="true" aria-label="Screen covered">
            <button ref={uncover} onClick={() => setCovered(false)}>
              The screen is covered. Press to carry on.
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
