import { useEffect, useState } from 'react';
import { AUTH_REQUIRED_EVENT, readAccessToken, storeAccessToken } from '../api.js';

/**
 * Deployed environments sit behind a shared access token. When the server
 * rejects a request for lack of it, that is an ENVIRONMENT problem, not a
 * statement about the signed-in person — so it is shown once, at the top
 * of the shell, with the one action that fixes it, instead of leaving an
 * error code inside whichever screen happened to ask.
 *
 * The token can always be entered here: the ?token=… form is stripped from
 * the address bar (so it never lingers in history), which means a stored
 * copy lost to a cleared cache would otherwise be unrecoverable in the UI.
 */
export function AccessTokenGate() {
  const [needed, setNeeded] = useState(false);
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onNeeded = () => {
      setNeeded(true);
      setSaved(false);
      setValue(readAccessToken());
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, onNeeded);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onNeeded);
  }, []);

  if (!needed) return null;

  return (
    <section role="alert" aria-labelledby="token-gate-heading" style={{ border: '0.15rem solid currentColor', padding: '1rem', marginBlock: '0.75rem' }}>
      <h2 id="token-gate-heading">This environment needs its access passphrase</h2>
      <p>
        The server refused that request because the browser did not send this environment's access passphrase. This is
        not about your account or your permissions — it is the door to this research prototype environment.
      </p>
      <p>
        <label htmlFor="access-token">Access passphrase</label>
      </p>
      <input
        id="access-token"
        type="password"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
      />
      <p>
        <button
          onClick={() => {
            storeAccessToken(value.trim());
            setSaved(true);
          }}
        >
          Save passphrase
        </button>
      </p>
      {saved && (
        <p>The passphrase is saved. Please try that action once more; if it still fails, the passphrase is not correct.</p>
      )}
      <p>
        <small>
          The passphrase is kept only in this device's browser, and is not carried in the page address.
        </small>
      </p>
    </section>
  );
}
