/**
 * Cloud Run entrypoint: starts the API (serving the built web app when
 * WEB_DIST_DIR is set) and, with RUN_JOBS=true, the pg-boss worker and
 * scheduler in the same container. Any child exiting takes the container
 * down (fail closed — Cloud Run restarts a whole, healthy unit; a service
 * silently running without its safety sweeps would be worse than a
 * restart). Honest limitation, documented in DEPLOYMENT.md: with
 * min-instances=0 background jobs only run while an instance is up.
 */
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers';

const env = {
  ...process.env,
  API_PORT: process.env.API_PORT ?? process.env.PORT ?? '8080',
};

const children = [];
let shuttingDown = false;

function launch(name, script) {
  const child = spawn('node', [script], { stdio: 'inherit', env });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    console.error(`[start-cloud] ${name} exited (code=${code}, signal=${signal}); stopping container`);
    shuttingDown = true;
    for (const c of children) c.kill('SIGTERM');
    process.exit(code ?? 1);
  });
  children.push(child);
}

launch('api', 'apps/api/dist/main.js');
if ((process.env.RUN_JOBS ?? 'true') === 'true') {
  launch('worker', 'apps/worker/dist/main.js');
  // Staggered: worker and scheduler both run pg-boss schema/queue setup on
  // boot, and starting them simultaneously can deadlock in Postgres.
  delay(() => {
    if (!shuttingDown) launch('scheduler', 'apps/scheduler/dist/main.js');
  }, 5000);
}

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    shuttingDown = true;
    for (const c of children) c.kill(sig);
  });
}
