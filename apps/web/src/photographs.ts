import { useEffect, useRef, useState } from 'react';
import { api, type AttachedFile, type Session } from './api.js';
import { isShowableImage } from './story-entry.js';

/**
 * Photographs, fetched as bytes and held as object URLs.
 *
 * The bytes cannot be an `<img src>`: this platform authenticates with
 * headers and a browser sends none of them when it fetches an image. So
 * each file is fetched like any other request and turned into an object
 * URL — which also keeps a Sensitive-Personal photograph out of the
 * address bar and out of anything that logs URLs.
 *
 * The reason this is a module rather than twenty lines in each screen is
 * the revoking. An object URL that is never revoked keeps somebody's
 * photograph in memory for as long as the tab is open, and a cleanup
 * that reads state captures whatever that state held on the render it was
 * created in — leaking every URL made after it. The ref below is what
 * makes the cleanup see the current set.
 *
 * `MyLifeStory` has its own copy of this logic, entangled with the
 * pending-upload preview and with removal; it should come here when that
 * is untangled. Until then the two are written to behave the same and
 * this comment is the pointer between them.
 */
export interface Photograph {
  url: string;
  /**
   * The type the SERVER was willing to call it, read off the Blob. Never
   * the type declared at upload: the server serves an image type only for
   * a file whose bytes really are that image, so believing the Blob is
   * believing the check that was already made.
   */
  type: string;
}

export function usePhotographs(session: Session) {
  const [pictures, setPictures] = useState<Record<string, Photograph>>({});
  const held = useRef<Record<string, Photograph>>({});
  held.current = pictures;

  useEffect(
    () => () => {
      for (const p of Object.values(held.current)) URL.revokeObjectURL(p.url);
    },
    [],
  );

  /**
   * Fetch what is not already here.
   *
   * A failure is deliberately quiet: the memory and its words are on the
   * screen already, and turning "one picture would not load" into the
   * screen's error state would push somebody's memory aside to report a
   * thumbnail. The caller draws a description instead.
   */
  const load = async (files: readonly AttachedFile[]) => {
    await Promise.all(
      files.map(async (file) => {
        if (held.current[file.objectId] !== undefined) return;
        try {
          const blob = await api.readFileContent(session, file.objectId);
          const url = URL.createObjectURL(blob);
          setPictures((p) => {
            // Two opens racing for the same file: keep the first and
            // revoke this one, rather than leaking the URL that lost.
            if (p[file.objectId] !== undefined) {
              URL.revokeObjectURL(url);
              return p;
            }
            return { ...p, [file.objectId]: { url, type: blob.type } };
          });
        } catch {
          /* Described rather than shown; see above. */
        }
      }),
    );
  };

  return { pictures, load, canShow: isShowableImage };
}
