/**
 * The participant workspace's screens.
 *
 * Extracted from `App.tsx` so that `routes.ts` can name them without
 * importing the component — the alternative is a cycle between the router
 * and the thing it routes.
 */
export type Screen =
  | 'home'
  | 'consent'
  | 'access'
  | 'message'
  | 'matching'
  | 'community'
  | 'life-story'
  | 'shared-stories'
  | 'data-copy'
  | 'review'
  | 'caption'
  | 'about'
  | 'information'
  | 'exercises'
  | 'tapping'
  | 'helper'
  | 'help';
