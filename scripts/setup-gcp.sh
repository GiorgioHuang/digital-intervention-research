#!/usr/bin/env bash
# One-time GCP setup for GitHub Actions -> Cloud Run (keyless, Workload
# Identity Federation) for THIS repository. Mirrors the conventions already
# proven by aging-knowledge-graph in the same project: it reuses the
# github-pool WIF pool and the deployer service account when they exist,
# and adds a provider + binding scoped to this repo (WIF providers pin an
# exact repository in their attribute condition, so the KG repo's provider
# cannot be shared).
#
# Run with gcloud authenticated as a project owner (Cloud Shell works):
#   PROJECT_ID=<your-project> \
#   DATABASE_URL='postgresql://…neon…?sslmode=require' \
#   ACCESS_TOKEN="$(openssl rand -hex 24)" \
#     bash scripts/setup-gcp.sh
# Re-runnable; creates are guarded.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?set PROJECT_ID to your GCP project id}"
PROJECT_NUMBER="${PROJECT_NUMBER:-$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')}"
REPO="${REPO:-GiorgioHuang/digital-intervention-research}"
REGION="${REGION:-us-east1}"
POOL="${POOL:-github-pool}"
PROVIDER="${PROVIDER:-github-haip}"
SA_NAME="${SA_NAME:-deployer}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "== project ${PROJECT_ID} (#${PROJECT_NUMBER}), repo ${REPO} =="
gcloud config set project "$PROJECT_ID" >/dev/null

echo "== enable APIs =="
gcloud services enable \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com

echo "== deployer service account =="
gcloud iam service-accounts create "$SA_NAME" \
  --display-name "GitHub Actions deployer" 2>/dev/null || echo "  (exists)"

echo "== grant deployer roles =="
for ROLE in roles/run.admin roles/cloudbuild.builds.editor roles/artifactregistry.admin \
            roles/storage.admin roles/iam.serviceAccountUser roles/secretmanager.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member "serviceAccount:${SA_EMAIL}" --role "$ROLE" --condition=None >/dev/null
done

echo "== workload identity pool + this repo's OIDC provider =="
gcloud iam workload-identity-pools create "$POOL" \
  --location=global --display-name="GitHub Actions" 2>/dev/null || echo "  (pool exists)"

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
  --location=global --workload-identity-pool="$POOL" \
  --display-name="GitHub (${REPO#*/})" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository=='${REPO}'" 2>/dev/null || echo "  (provider exists)"

echo "== allow the repo to impersonate the deployer SA =="
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}" >/dev/null

put_secret() {
  local NAME="$1" VALUE="$2"
  if gcloud secrets describe "$NAME" >/dev/null 2>&1; then
    printf '%s' "$VALUE" | gcloud secrets versions add "$NAME" --data-file=-
  else
    printf '%s' "$VALUE" | gcloud secrets create "$NAME" --data-file=- --replication-policy=automatic
  fi
  gcloud secrets add-iam-policy-binding "$NAME" \
    --member "serviceAccount:${RUNTIME_SA}" --role roles/secretmanager.secretAccessor >/dev/null
  echo "  ${NAME} set; runtime SA granted accessor"
}

echo "== HAIP_DATABASE_URL secret (Neon connection string) =="
if [ -n "${DATABASE_URL:-}" ]; then
  put_secret HAIP_DATABASE_URL "$DATABASE_URL"
else
  echo "  DATABASE_URL not provided — create a Neon database first, then:"
  echo "    printf '%s' 'postgresql://…?sslmode=require' | gcloud secrets create HAIP_DATABASE_URL --data-file=-"
fi

echo "== HAIP_ACCESS_TOKEN secret (public-ingress gate) =="
if [ -n "${ACCESS_TOKEN:-}" ]; then
  put_secret HAIP_ACCESS_TOKEN "$ACCESS_TOKEN"
else
  echo "  ACCESS_TOKEN not provided — WITHOUT this secret the service deploys IAM-only (not public)."
  echo "  To open the token-gated public URL later:"
  echo "    openssl rand -hex 24 | tr -d '\\n' | gcloud secrets create HAIP_ACCESS_TOKEN --data-file=-"
fi

cat <<EOF

== DONE. Set these GitHub repo Variables (Settings -> Secrets and variables -> Actions -> Variables):
  GCP_PROJECT_ID       = ${PROJECT_ID}
  GCP_WIF_PROVIDER     = projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}
  GCP_SERVICE_ACCOUNT  = ${SA_EMAIL}
  GCP_REGION           = ${REGION}

Then every green CI run on main deploys automatically (or trigger
GitHub -> Actions -> "Deploy to Cloud Run" -> Run workflow).
Open the app as: <service-url>/?token=<ACCESS_TOKEN>
EOF
