import { useEffect, useState } from 'react';
import { staffLoadError, staffActionError } from '../errors.js';
import { staffApi, type ExportToCarryOutItem, type StaffSession } from '../staff-api.js';

/**
 * Exports that have been agreed to and now have to be carried out.
 *
 * Approving was the end of the road. Nothing listed an approved request,
 * so the package was never put together and the delivery was never
 * recorded. A participant who asked for a copy of their own information
 * could be told truthfully that it had been agreed to, and then never
 * hear another thing — not because anyone refused, but because no screen
 * anywhere could take the next step.
 *
 * The three states are kept apart in the wording, because they are three
 * different facts (Doc 16 §37.3). None of them is the platform sending
 * anything: recording delivery is a person saying what they did.
 *
 * And one of the three was being described as more than it is. The screen
 * said "put the package together", and what the command writes is a
 * manifest — the export's own type, sources, de-identification and
 * restrictions, with a SHA-256 over that JSON. It reads no participant
 * data, gathers no records and writes no file. Whoever carries the export
 * out assembles it themselves, outside this platform, against that
 * manifest.
 *
 * That distinction is the whole value of the hash. The manifest is the
 * agreed statement of what may leave, fixed at the moment it was agreed,
 * so an assembled package can be checked against what was actually
 * approved. Called "the package", it instead reads as the data itself,
 * and somebody would hand over a file believing the platform had decided
 * what went into it.
 */
const STATE_WORDING: Record<string, string> = {
  Approved: 'Agreed to. The manifest has not been written yet.',
  Generated: 'The manifest exists. Nothing has been gathered and nothing has been handed over.',
  Delivered: 'Somebody recorded handing it over. The recipient has not confirmed it.',
};

const TYPE_WORDING: Record<string, string> = {
  ResearchExport: 'Research export',
  ParticipantPortability: 'A copy of someone’s own information, for them',
};

export function ExportsToCarryOut({ session }: { session: StaffSession }) {
  const [items, setItems] = useState<ExportToCarryOutItem[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const load = async () => {
    try {
      setItems((await staffApi.listExportsToCarryOut(session)).data.map((i) => i.attributes));
      setLoadError('');
    } catch (err) {
      setLoadError(staffLoadError(err, 'exports waiting to be carried out'));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const run = async (fn: () => Promise<unknown>, said: string) => {
    try {
      await fn();
      setActionError('');
      setAnnouncement(said);
      await load();
    } catch (err) {
      setActionError(staffActionError(err, 'That step'));
    }
  };

  return (
    <section aria-labelledby="carry-out-heading">
      <h3 id="carry-out-heading">Exports waiting to be carried out</h3>
      <p>
        These have already been agreed to by someone other than whoever asked. What is left is the work itself, and
        nearly all of it is yours.
      </p>
      <p>
        <strong>This platform does not assemble the data.</strong> What it writes is a manifest: the type, the
        sources, the de-identification and the restrictions that were agreed, with a hash over them. Gathering the
        records, producing the file and getting it to the recipient are things you do, outside here. Check what you
        assemble against the manifest — that is what the hash is for.
      </p>
      <p>
        <button onClick={() => void load()}>Refresh the list</button>
      </p>
      {loadError !== '' && <p role="alert">{loadError}</p>}
      {items !== null && items.length === 0 && <p>Nothing is waiting to be carried out.</p>}

      {(items ?? []).map((e) => (
        <article key={e.exportRequestId} aria-label={`Export ${e.exportRequestId}`}>
          <p>
            <strong>{TYPE_WORDING[e.exportType] ?? e.exportType}</strong> — {e.purpose}
          </p>
          <p>Recipient: {e.recipient}</p>
          <p>{STATE_WORDING[e.requestState] ?? e.requestState}</p>
          {e.manifestHash !== null && (
            <p>
              Manifest hash: <code>{e.manifestHash}</code>
            </p>
          )}
          {e.requestState === 'Approved' && (
            <p>
              <button
                onClick={() =>
                  void run(
                    () => staffApi.generateExportPackage(session, e.exportRequestId),
                    'The manifest is written. Nothing has been gathered — that part is yours.',
                  )
                }
              >
                Write the manifest for this export
              </button>{' '}
              <small>This records what may leave. It does not collect anything.</small>
            </p>
          )}
          {e.requestState === 'Generated' && (
            <p>
              {/*
                The platform does not send anything. This records what a
                person did, and the label says that rather than "Deliver".
              */}
              <button
                onClick={() =>
                  void run(
                    () => staffApi.recordExportDelivery(session, e.exportRequestId, 'Delivered'),
                    'Recorded as handed over. That is your record of it, not something this platform did.',
                  )
                }
              >
                Record that I handed it over
              </button>
            </p>
          )}
          {e.requestState === 'Delivered' && (
            <p>
              <button
                onClick={() =>
                  void run(
                    () => staffApi.recordExportDelivery(session, e.exportRequestId, 'Received'),
                    'Recorded as received.',
                  )
                }
              >
                Record that they confirmed receiving it
              </button>
            </p>
          )}
        </article>
      ))}

      {actionError !== '' && <p role="alert">{actionError}</p>}
      <p aria-live="polite" role="status">
        {announcement}
      </p>
    </section>
  );
}
