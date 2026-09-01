import { beforeEach } from 'vitest';

/**
 * Every test starts at the same address.
 *
 * The participant workspace reads the current screen out of
 * `window.location` (see `src/routes.ts`), which is what makes a refresh
 * come back to the same place. jsdom gives the whole file one window and
 * one history, so without this a test that navigates leaves the next one
 * starting on whatever screen it finished on — five tests in
 * `participant-screen-budgets` failed exactly that way, each looking for a
 * control on Home while sitting on the screen its predecessor had opened.
 *
 * This is not papering over a defect in the app: a browser begins every
 * page load at a known address, and the test environment should too. What
 * it does mean is that a test which cares about the address must set it
 * itself, which the refresh tests do.
 */
beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

/**
 * jsdom implements neither of these; every browser implements both.
 *
 * The life story turns a photograph's bytes into an object URL, so
 * without them `createObjectURL` throws, the component's own catch treats
 * it as "this picture would not load", and the fallback is drawn instead.
 * Every test would still pass — and none would ever have shown a
 * photograph. Stubbing them is what makes the difference visible.
 */
if (typeof URL.createObjectURL !== 'function') {
  let made = 0;
  URL.createObjectURL = () => {
    made += 1;
    return `blob:test/${String(made)}`;
  };
  URL.revokeObjectURL = () => undefined;
}
