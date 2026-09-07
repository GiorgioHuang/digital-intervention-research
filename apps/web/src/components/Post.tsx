import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { excerptOf } from '../story-entry.js';
import { Modal } from './Modal.js';
import { TabIcon } from './elder/TabIcon.js';

/**
 * The parts a post is made of, on the story and in the community.
 *
 * The shape is the owner's (2026-09-07), taken from what a familiar
 * timeline does: the words folded with a way to read the rest,
 * photographs shown rather than described, everything that can be DONE
 * to a post gathered in one menu at its corner, and a quiet line at the
 * foot saying when it was written.
 *
 * The reason to gather the actions is not tidiness. A memory carries
 * five or six things somebody can do to it — confirm it as their own
 * words, change who may read it, rewrite it, add a photograph, take it
 * out — and laid out as buttons they crowd the words they are about,
 * which are the point of the screen and somebody's own writing.
 */

/**
 * Everything that can be done to a post, behind one control at its
 * corner.
 *
 * A menu, not a disclosure: it is announced as one, it closes on Escape
 * and on a press anywhere else, and it hands focus back to the control
 * that opened it — the same rules as a window, for the same reason. The
 * control carries a word for anybody who cannot see the glyph, and the
 * word names the post so that two menus on one screen are told apart.
 */
export function PostMenu({ about, children }: { about: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    };
    /*
     * Pressing anywhere else closes it — including on another post's
     * menu, which is what makes two of them behave like one menu rather
     * than two things that can both be open at once.
     */
    const onDown = (e: MouseEvent) => {
      if (wrap.current !== null && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <div className="post-menu" ref={wrap}>
      <button
        ref={trigger}
        className="post-menu__open"
        aria-label={`What you can do with “${about}”`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((was) => !was)}
      >
        <span aria-hidden="true">···</span>
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          className="post-menu__items"
          /*
           * Choosing anything closes it. Each item is written by the
           * screen that owns the post, so rather than making every one
           * of them remember to close, the menu closes on any press
           * inside it.
           */
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** One thing in that menu. */
export function PostMenuItem({
  onSelect,
  children,
  disabled,
}: {
  onSelect: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button role="menuitem" className="post-menu__item" disabled={disabled === true} onClick={onSelect}>
      {children}
    </button>
  );
}

/**
 * The words, folded, with a way to read the rest.
 *
 * Folded by characters rather than by a line clamp, because the cut has
 * to be decidable without measuring: at this workspace's reading size,
 * with the text size somebody may have raised twice, "three lines" is
 * not a length anybody can predict. `excerptOf` cuts on a space and adds
 * its ellipsis only when something was actually left out, so a short
 * memory is shown whole and does not pretend to have more behind it.
 *
 * Nothing is hidden that was not also reachable: the button says how it
 * ends, and pressing it puts the whole text on the screen.
 */
export const FOLD_AT = 320;

export function PostWords({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const folded = excerptOf(text, FOLD_AT);
  const longer = folded !== text.replace(/\s+/g, ' ').trim();
  return (
    <div className="post-words">
      <blockquote className="post-words__text">{open || !longer ? text : folded}</blockquote>
      {longer && (
        <button className="post-words__more" aria-expanded={open} onClick={() => setOpen((was) => !was)}>
          {open ? 'Show less' : 'Show more'}
          <span className="visually-hidden"> of {label}</span>
        </button>
      )}
    </div>
  );
}

export interface PostPicture {
  /** What identifies it to the screen that owns it. */
  key: string;
  url: string;
  alt: string;
  /** Drawn on the photograph itself; nothing is drawn when this is absent. */
  corner?: ReactNode;
}

/**
 * The photographs.
 *
 * One fills the width. Several go side by side and are scrolled, rather
 * than stacked down the page: a memory with four photographs on it
 * pushed everything else — including the next memory — an entire screen
 * away, and the words are what the screen is for.
 *
 * Any of them opens to be looked at. The opening control is a button
 * wrapping the picture so a keyboard reaches it and it is announced as
 * something to press; the picture's own description is what names it.
 */
export function PostPhotographs({ pictures }: { pictures: readonly PostPicture[] }) {
  const [open, setOpen] = useState<PostPicture | null>(null);
  if (pictures.length === 0) return null;
  return (
    <>
      <ul className={pictures.length > 1 ? 'post-pictures post-pictures--many' : 'post-pictures'}>
        {pictures.map((p) => (
          <li key={p.key} className="post-pictures__item">
            <button className="post-pictures__open" onClick={() => setOpen(p)}>
              <img className="post-pictures__image" src={p.url} alt={p.alt} />
              <span className="visually-hidden">Open this photograph larger</span>
            </button>
            {p.corner}
          </li>
        ))}
      </ul>
      {open !== null && (
        <Modal labelledBy="picture-open-heading" role="dialog" wide onClose={() => setOpen(null)}>
          <h2 id="picture-open-heading" className="visually-hidden">
            {open.alt}
          </h2>
          <img className="post-pictures__large" src={open.url} alt={open.alt} />
          <p className="post-pictures__close">
            <button onClick={() => setOpen(null)}>Close</button>
          </p>
        </Modal>
      )}
    </>
  );
}

/**
 * The line at the foot: when it was written.
 *
 * The owner asked for a reply count and a like count here as well
 * (2026-09-07). Neither is drawn, because neither exists: there is no
 * reactions table and no comments table anywhere on this platform, so a
 * count would be a number the platform made up and a control that did
 * nothing when pressed. It is recorded as B-37, with what building them
 * would take — comments on somebody's life story need moderation,
 * reporting and blocking before they can be offered at all.
 */
export function PostFooter({ when, children }: { when: string; children?: ReactNode }) {
  return (
    <p className="post-footer">
      <span className="post-footer__when">{when}</span>
      {children}
    </p>
  );
}

/** The bin the story screen puts on a photograph of its own. */
export function PictureCorner({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <button className="story-photograph__remove" aria-label={label} onClick={onSelect}>
      <TabIcon name="trash-2" />
    </button>
  );
}
