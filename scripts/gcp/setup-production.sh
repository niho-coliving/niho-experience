#!/usr/bin/env bash
# One-time, owner-run setup for the separate production project.
# This script links a billing account and grants deploy rights; review the plan
# in docs/production-deploy.md before running it. It does not publish a site.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-niho-experience-prod}"
REGION="${REGION:-asia-northeast1}"
REPOSITORY="${REPOSITORY:-web}"
ORG_ID="${ORG_ID:?Set the approved NIHO organization ID}"
BILLING_ACCOUNT="${BILLING_ACCOUNT:?Set the approved billing account ID}"
GITHUB_REPO_ID=1425500695
POOL=github-production
PROVIDER=niho-experience-production
RUNTIME_SA="experience-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOY_SA="experience-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

if [[ "$PROJECT_ID" == niho-experience-web || "$PROJECT_ID" == niho-app-* ]]; then
  echo "Production must use a project separate from preview and NIHOapp" >&2
  exit 1
fi

if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud projects create "$PROJECT_ID" --organization="$ORG_ID" --name="NIHO Experience production"
fi
if [[ "$(gcloud projects describe "$PROJECT_ID" --format='value(parent.id)')" != "$ORG_ID" ]]; then
  echo "Project ${PROJECT_ID} is not in the approved organization" >&2
  exit 1
fi
if [[ "$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')" != True ]]; then
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
fi
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

gcloud services enable --project "$PROJECT_ID" \
  run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com

if ! gcloud artifacts repositories describe "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" \
    --repository-format=docker --description="NIHO Experience production images"
fi
policy="$(mktemp)"
trap 'rm -f "$policy"' EXIT
cat > "$policy" <<'JSON'
[
  {"name": "keep-newest-10", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": 10}},
  {"name": "delete-older-than-30-days", "action": {"type": "Delete"}, "condition": {"tagState": "any", "olderThan": "30d"}}
]
JSON
gcloud artifacts repositories set-cleanup-policies "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" \
  --policy="$policy" --no-dry-run --quiet >/dev/null

ensure_sa() {
  local email="$1" display_name="$2"
  if ! gcloud iam service-accounts describe "$email" --project "$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "${email%%@*}" --project "$PROJECT_ID" --display-name="$display_name"
  fi
}
ensure_sa "$RUNTIME_SA" "NIHO Experience production runtime"
ensure_sa "$DEPLOY_SA" "NIHO Experience production deployer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${DEPLOY_SA}" \
  --role=roles/run.admin --condition=None --quiet >/dev/null
gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" \
  --member="serviceAccount:${DEPLOY_SA}" --role=roles/artifactregistry.writer --quiet >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --project "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOY_SA}" --role=roles/iam.serviceAccountUser --quiet >/dev/null

# Isolated pool: a preview OIDC token cannot impersonate the production SA.
if ! gcloud iam workload-identity-pools describe "$POOL" --project "$PROJECT_ID" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL" --project "$PROJECT_ID" --location=global \
    --display-name="Production GitHub Actions"
fi
condition="assertion.repository_id == '${GITHUB_REPO_ID}' && assertion.ref == 'refs/heads/main' && assertion.environment == 'production' && assertion.event_name == 'workflow_dispatch' && assertion.workflow_ref == 'niho-coliving/niho-experience/.github/workflows/deploy-production.yml@refs/heads/main'"
mapping="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref,attribute.environment=assertion.environment"
if ! gcloud iam workload-identity-pools providers describe "$PROVIDER" --project "$PROJECT_ID" --location=global \
  --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --project "$PROJECT_ID" --location=global \
    --workload-identity-pool="$POOL" --display-name="niho-coliving/niho-experience production" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="$mapping" --attribute-condition="$condition"
fi
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" --project "$PROJECT_ID" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository_id/${GITHUB_REPO_ID}" \
  --quiet >/dev/null

cat <<EOF
PROD_GCP_PROJECT_ID=${PROJECT_ID}
PROD_GCP_REGION=${REGION}
PROD_GCP_ARTIFACT_REPOSITORY=${REPOSITORY}
PROD_GCP_WIF_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}
PROD_GCP_DEPLOY_SERVICE_ACCOUNT=${DEPLOY_SA}
PROD_GCP_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_SA}
EOF
