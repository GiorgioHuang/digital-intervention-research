/**
 * Shown only while a helper is with the person, from the handoff's
 * "Global chrome" §1.
 *
 * The sentence is the whole point of the banner and is not ours to soften:
 * somebody is helping, and the person whose story it is still decides. The
 * design puts the helper's name first and the ownership second, in one
 * line, on every screen.
 */
export function HelperBanner({
  helperName,
  participantName,
  onStop,
}: {
  helperName: string;
  participantName: string;
  onStop: () => void;
}) {
  return (
    <div className="elder-helper-banner" role="status">
      <p>
        {helperName} is helping. {participantName} decides.
      </p>
      <button type="button" onClick={onStop}>
        Stop
      </button>
    </div>
  );
}
