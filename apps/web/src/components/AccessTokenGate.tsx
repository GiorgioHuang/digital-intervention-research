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
      <h2 id="token-gate-heading">需要此环境的访问口令</h2>
      <p>
        服务器拒绝了刚才的请求，因为浏览器没有携带这个环境的访问口令。这与你的账号和权限无关——它是这个研究原型环境的访问门。
      </p>
      <p>
        <label htmlFor="access-token">访问口令</label>
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
          保存口令
        </button>
      </p>
      {saved && <p>口令已保存。请再点一次刚才的操作；如果仍然失败，说明口令不正确。</p>}
      <p>
        <small>口令只保存在这台设备的浏览器里，不会随页面地址传播。</small>
      </p>
    </section>
  );
}
