# Cloud Run image: one container serves the API + built web app and (when
# RUN_JOBS=true) runs the pg-boss worker and scheduler alongside. Built by
# Cloud Build via `gcloud run deploy --source .` from the deploy workflow.
FROM node:22-slim AS build
WORKDIR /app
# Pinned pnpm via npm, NOT corepack: corepack's signature verification of
# freshly-published pnpm releases is a known intermittent build breaker.
# Keep the version in lockstep with the packageManager field in package.json.
RUN npm install -g pnpm@10.33.0
COPY . .
# Cloud Build's default machine has far less memory than a CI runner, so the
# per-package builds run with bounded concurrency instead of one tsc process
# per core; `prune` is best-effort (a larger image beats a failed build).
RUN pnpm install --frozen-lockfile \
  && pnpm -r --workspace-concurrency=2 --filter './packages/**' --filter './apps/**' run build \
  && (pnpm prune --prod || echo "prune skipped")

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
EXPOSE 8080
CMD ["node", "tools/start-cloud.mjs"]
