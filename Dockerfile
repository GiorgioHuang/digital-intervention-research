# Cloud Run image: one container serves the API + built web app and (when
# RUN_JOBS=true) runs the pg-boss worker and scheduler alongside. Built by
# Cloud Build via `gcloud run deploy --source .` from the deploy workflow.
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile \
  && pnpm build \
  && pnpm prune --prod

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
EXPOSE 8080
CMD ["node", "tools/start-cloud.mjs"]
