/**
 * What a folded memory says about itself.
 *
 * Each entry on the life story is now a row that opens, so what is on the
 * row is what somebody has to decide from. Those pieces are pure and live
 * here, because the awkward cases — a memory with no words in it yet, a
 * long first sentence, an entry a drafting tool wrote — are then ordinary
 * tests rather than something to catch on a screenshot.
 */

/**
 * The first part of somebody's own words.
 *
 * Cut on a space, never mid-word: a row ending "the neighbours would sto…"
 * reads as a fault in the page rather than as a preview. The ellipsis is
 * only added when something was actually left out, so a short memory is
 * shown whole and does not pretend to have more behind it.
 */
export function excerptOf(text: string | null, max = 110): string {
  if (text === null) return '';
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * What to call a memory that has no name.
 *
 * Memories carry no title at all now (owner, 2026-09-07) — a life story
 * is somebody saying what happened, and being made to name it first is a
 * form to fill in before they can begin. But the screens still have to
 * refer to one: a menu has to say which memory it belongs to, a window
 * has to say which one it is about, and every post needs a name a screen
 * reader can navigate the page by.
 *
 * The first few words of the memory itself, then. They are the
 * participant's own — nothing here writes a name for somebody's life —
 * and they are what a person would say if you asked them which memory
 * they meant.
 *
 * The fallback names nothing. A memory whose words have not arrived yet
 * cannot be identified by them, and "Untitled" or "Memory 3" would be
 * this platform naming a piece of somebody's life after nothing at all.
 */
export function openingWords(contentText: string | null, max = 60): string {
  const opening = excerptOf(contentText, max);
  return opening === '' ? 'this memory' : opening;
}

/**
 * The same, for the middle of a sentence.
 *
 * A window has to say which memory it is about — "Take … out of your
 * story?" — and quoting the participant's own opening words is the only
 * honest way to point at a memory that has no name. Shorter than the
 * name a screen reader is given, because this one has to fit inside a
 * heading beside other words.
 *
 * When there are no words yet, it says "this memory" and does not put
 * quotation marks around a phrase nobody wrote.
 */
export function quotedOpening(contentText: string | null, max = 40): string {
  const opening = excerptOf(contentText, max);
  return opening === '' ? 'this memory' : `“${opening}”`;
}

/**
 * Who can see it, in the two or three words a row has space for.
 *
 * The full sentences stay on the opened entry. This is the same fact said
 * shorter, and it is on the row deliberately: who can read a memory is
 * the thing somebody is most likely to want to check without opening
 * anything.
 */
const VISIBILITY_SHORT: Record<string, string> = {
  Private: 'Only you',
  'Selected People': 'Chosen people',
  Connections: 'Your connections',
  Community: 'Your community',
  'Platform Public': 'Anyone here',
};

export function shortVisibility(visibility: string): string {
  return VISIBILITY_SHORT[visibility] ?? visibility;
}

/**
 * The date, spelled out.
 *
 * "2 June 2026" rather than 02/06/2026, which is a different day in North
 * America than it is in Britain and gives no clue which reading is meant.
 */
export function entryDate(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  return at.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** The row's quiet line: when it was last touched, and who can read it. */
export function metaLine(item: { updatedAt: string; visibility: string }): string {
  return [entryDate(item.updatedAt), shortVisibility(item.visibility)].filter((p) => p !== '').join(' · ');
}

/**
 * Whether a stored file is something this platform can put on the screen.
 *
 * Asked of the Blob that came back, never of the content type declared at
 * upload: the server serves an image type only for a file whose bytes
 * really are that image, so believing the Blob is believing the check
 * that was already made. Believing the declaration would be believing the
 * uploader.
 */
export function isShowableImage(blobType: string): boolean {
  return blobType === 'image/jpeg' || blobType === 'image/png';
}
