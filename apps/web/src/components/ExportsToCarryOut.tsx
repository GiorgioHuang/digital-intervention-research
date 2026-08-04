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
 * different facts (Doc 16 §37.3). Putting the package together is work
 * this platform does. Handing it over is not: the platform sends nothing,
 * so recording delivery is a person saying what they did, and the screen
 * says so rather than implying a transfer happened here.
 */
const STATE_WORDING: Record<string, string> = {
  Approved: 'Agreed to. The package has not been put together yet.',
  Generated: 'The package exists. Nothing has been handed over.',
  Delivered: 'Recorded as handed over. The recipient has not confirmed it.',
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
        These have already been agreed to by someone other than whoever asked. What is left is the work itself.
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
                    'The package has been put together. Nothing has been handed over.',
                  )
                }
              >
                Put the package together
              </button>
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
