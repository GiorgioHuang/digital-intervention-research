import { useState } from 'react';
import { staffActionError, staffLoadError } from '../../errors.js';

/**
 * Pieces every approver decision screen reuses.
 *
 * The rules these encode come from RESEARCHER_WORKSPACE §1.4–1.6 and are
 * not cosmetic:
 *
 * - §1.4 the type, identifier, exact version and content hash of what is
 *   being decided must be in the same viewport as the decide control, not
 *   behind a disclosure — an approver who cannot see the hash cannot tell
 *   whether the version in front of them is the one they read;
 * - §1.5 separation of duties is stated *before* the control, and a
 *   control the server would refuse is not clickable. "Clickable, then
 *   403" is called out there as a design error;
 * - §1.6 an action that needs strong authentication says so up front, and
 *   — just as strictly — an action that does not must never be labelled as
 *   if it did.
 */

/** Truncation is display only; the confirmation shows the value in full. */
export function ShortHash({ value }: { value: string }) {
  const [full, setFull] = useState(false);
  if (value === '') return <span>not published by the server for this artefact</span>;
  return (
    <>
      <code>{full ? value : `${value.slice(0, 16)}…`}</code>{' '}
      <button type="button" onClick={() => setFull(!full)}>
        {full ? 'Shorten' : 'Show the full value'}
      </button>
    </>
  );
}

export interface ExactArtefact {
  /** Human name of the type being decided, e.g. "Protocol version". */
  typeLabel: string;
  id: string;
  /** Omitted for artefacts the platform does not version, e.g. an export request. */
  versionNumber?: number;
  hashLabel?: string;
  hash?: string;
  /** Field name / value pairs specific to the artefact type. */
  facts?: { label: string; value: string }[];
}

export function ExactVersionBlock({ artefact }: { artefact: ExactArtefact }) {
  return (
    <dl>
      <dt>Type</dt>
      <dd>{artefact.typeLabel}</dd>
      <dt>Identifier</dt>
      <dd>
        <code>{artefact.id}</code>
      </dd>
      {artefact.versionNumber !== undefined && (
        <>
          <dt>Version</dt>
          <dd>v{artefact.versionNumber}</dd>
        </>
      )}
      {artefact.hashLabel !== undefined && (
        <>
          <dt>{artefact.hashLabel}</dt>
          <dd>
            <ShortHash value={artefact.hash ?? ''} />
          </dd>
        </>
      )}
      {(artefact.facts ?? []).map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * §1.5 layer 2: a permanent line saying what this person's relationship to
 * the artefact is, rather than leaving them to infer it from whether a
 * button happens to be enabled.
 */
export function SeparationOfDutiesLine({ isOwnSubmission }: { isOwnSubmission: boolean }) {
  return isOwnSubmission ? (
    <p>
      <strong>You submitted this.</strong> Separation of duties means you cannot decide it. Another person holding the
      permission has to.
    </p>
  ) : (
    <p>You did not draft or submit this version, so you can decide it.</p>
  );
}

/** §1.6: says what this screen will and will not ask a step-up for. */
export function AuthStrengthNote({
  needsMfa,
  authStrength,
  action,
}: {
  needsMfa: boolean;
  authStrength: 'password' | 'mfa' | 'step-up';
  action: string;
}) {
  if (!needsMfa) {
    return <p role="note">{action} needs your confirmation only — it is not in the strong-authentication tier.</p>;
  }
  // Both tiers satisfy the requirement, and the engine ranks a fresh
  // re-authentication ABOVE a second factor — it answers a harder
  // question. Naming which one is met keeps the note honest about what
  // the person actually did.
  const met = authStrength === 'mfa' || authStrength === 'step-up';
  return (
    <p role="note">
      {action} needs strong authentication.{' '}
      {met
        ? authStrength === 'step-up'
          ? 'You confirmed it was you a moment ago, which meets it.'
          : 'You are signed in at that level.'
        : 'You are signed in at password level, so the server will refuse it until you confirm it is you — use “Confirm it is you” at the top of the workspace.'}
    </p>
  );
}

/**
 * Refusing, with the reason beside the button.
 *
 * Every approval screen in the platform offered exactly one outcome until
 * now, which meant the only way to clear a queue was to approve everything
 * in it. The reason is required and is stored on the artefact, because the
 * person whose work is refused has to be able to find out why, and because
 * a refusal nobody can read is only a disappearance.
 */
export function RefuseControl({
  idPrefix,
  label,
  help,
  disabled,
  onRefuse,
}: {
  idPrefix: string;
  label: string;
  help: string;
  disabled: boolean;
  onRefuse: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div>
      <p>
        <label htmlFor={`${idPrefix}-refuse-reason`}>Why you are not accepting it (required)</label>
        <textarea
          id={`${idPrefix}-refuse-reason`}
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </p>
      <p>
        <button disabled={disabled || reason.trim() === ''} onClick={() => onRefuse(reason.trim())}>
          {label}
        </button>{' '}
        <small>{help}</small>
      </p>
    </div>
  );
}

export interface PendingDecision {
  /** Sentence naming the action, shown in the confirmation. */
  label: string;
  artefact: ExactArtefact;
  run: () => Promise<unknown>;
  /** Extra consequence text specific to this decision. */
  consequence?: string;
  /**
   * Re-read the artefact and return its current identity marker. If it no
   * longer matches what was displayed, the decision is refused rather than
   * applied to something the approver has not read (§1.4).
   */
  recheck?: () => Promise<string | null>;
  /** The marker as displayed when the approver opened the confirmation. */
  marker?: string;
}

/**
 * Confirmation + execution shared by the four screens. The full hash is
 * shown here, per §1.4, because this is the last point at which the
 * approver can compare it against what they read.
 */
export function useDecision() {
  const [pending, setPending] = useState<PendingDecision | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [busy, setBusy] = useState(false);

  const execute = async () => {
    if (pending === null || busy) return;
    const decision = pending;
    setBusy(true);
    try {
      if (decision.recheck !== undefined) {
        const now = await decision.recheck();
        if (now !== decision.marker) {
          setPending(null);
          setAnnouncement(
            now === null
              ? 'This artefact is no longer in the queue — someone may have decided it already. Nothing was submitted. Refresh the list and start again.'
              : 'This artefact changed while you were reading it. Nothing was submitted. Refresh the list and read the current version before deciding.',
          );
          return;
        }
      }
      await decision.run();
      setPending(null);
      setAnnouncement(`Recorded: ${decision.label} on ${decision.artefact.id}. It is in the audit trail in your name.`);
    } catch (err) {
      setPending(null);
      setAnnouncement(staffActionError(err, decision.label));
    } finally {
      setBusy(false);
    }
  };

  return { pending, setPending, announcement, setAnnouncement, execute, busy };
}

export function ConfirmDecision({
  pending,
  onConfirm,
  onCancel,
  busy,
}: {
  pending: PendingDecision;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div role="alertdialog" aria-labelledby="decision-confirm">
      <h3 id="decision-confirm">Confirm: {pending.label}</h3>
      <ExactVersionBlock artefact={pending.artefact} />
      {pending.artefact.hash !== undefined && pending.artefact.hash !== '' && (
        <p>
          Full {pending.artefact.hashLabel ?? 'hash'}: <code>{pending.artefact.hash}</code>
        </p>
      )}
      {pending.consequence !== undefined && <p>{pending.consequence}</p>}
      <p>This decision is recorded in your name in the audit trail.</p>
      {/*
        The buttons used to read `Confirm` and `Back`, which name nothing.
        An approver works a queue of near-identical dialogs — approve a
        protocol version, refuse a research finding, lock a dataset — and
        the only thing distinguishing one press from the next was a heading
        they had already scrolled past. Read aloud out of context, `Confirm`
        could be confirming anything on any screen.
        `pending.label` is already the action in words, and it is already in
        the heading, so naming the button costs nothing and makes the press
        self-describing wherever it is encountered.
      */}
      <button onClick={onConfirm} disabled={busy}>
        Confirm: {pending.label}
      </button>{' '}
      <button onClick={onCancel} disabled={busy}>
        Back, do not record this
      </button>
    </div>
  );
}

/** Shared queue loading so every screen reports failures the same way. */
export function useQueue<T>(load: () => Promise<T[]>, what: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState('');
  const refresh = async () => {
    try {
      setItems(await load());
      setError('');
    } catch (err) {
      setError(staffLoadError(err, what));
    }
  };
  return { items, error, refresh, setItems };
}
