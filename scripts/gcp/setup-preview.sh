#!/usr/bin/env bash
# One-time Google Cloud setup so GitHub Actions can deploy the preview
# (docs/deploy-setup.md). Run in Cloud Shell as a NIHO admin (@niho.life).
# Safe to re-run: existing resources are kept and only missing ones are added.
#
# Creates, in a project of its own (separate from NIHOapp):
#   - Artifact Registry repository for images (keeps the 10 newest)
#   - runtime service account with no permissions
#   - deployer service account that only GitHub Actions on main can use (OIDC, no keys)
#
# Optional settings (environment variables):
#   PROJECT_ID       default niho-experience-web (must be globally unique)
#   ORG_ID           needed only to create the project; auto-detected if you have one organization
#   BILLING_ACCOUNT  needed only if billing is not linked yet; auto-detected if you have one
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-niho-experience-web}"
REGION="${REGION:-asia-northeast1}"
REPOSITORY="${REPOSITORY:-web}"
GITHUB_REPO="niho-coliving/niho-experience"
# Numeric id of the GitHub repository: it survives renames and cannot be claimed by someone else.
GITHUB_REPO_ID="1425500695"
POOL="github"
PROVIDER="niho-experience"
RUNTIME_SA="experience-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOY_SA="experience-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

say() { printf '\n== %s\n' "$*"; }
only_one() {
  # Prints the single value from stdin, or fails with the list so the person can choose.
  local values count
  values="$(cat)"
  count="$(printf '%s' "$values" | grep -c . || true)"
  if [ "$count" = "1" ]; then printf '%s' "$values"; return 0; fi
  echo "Found ${count} candidates for $1. Set $1 to one of:" >&2
  printf '%s\n' "$values" >&2
  return 1
}

say "Account: $(gcloud config get-value account 2>/dev/null)"

# 1. Project and billing
if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  say "Project ${PROJECT_ID} already exists"
else
  ORG_ID="${ORG_ID:-$(gcloud organizations list --format='value(ID)' | only_one ORG_ID)}"
  say "Creating project ${PROJECT_ID} in organization ${ORG_ID}"
  gcloud projects create "$PROJECT_ID" --organization="$ORG_ID" --name="NIHO Experience"
fi
if [ "$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')" != "True" ]; then
  BILLING_ACCOUNT="${BILLING_ACCOUNT:-$(gcloud billing accounts list --filter='open=true' --format='value(ACCOUNT_ID)' | only_one BILLING_ACCOUNT)}"
  say "Linking billing account ${BILLING_ACCOUNT}"
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
fi
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

say "Enabling APIs"
gcloud services enable --project "$PROJECT_ID" \
  run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com

# 2. Image repository
if ! gcloud artifacts repositories describe "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" >/dev/null 2>&1; then
  say "Creating Artifact Registry repository ${REPOSITORY}"
  gcloud artifacts repositories create "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" \
    --repository-format=docker --description="NIHO Experience images"
fi
policy="$(mktemp)"
cat > "$policy" <<'JSON'
[
  {"name": "keep-newest-10", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": 10}},
  {"name": "delete-older-than-30-days", "action": {"type": "Delete"}, "condition": {"tagState": "any", "olderThan": "30d"}}
]
JSON
gcloud artifacts repositories set-cleanup-policies "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" \
  --policy="$policy" --no-dry-run --quiet >/dev/null
rm -f "$policy"

# 3. Service accounts
ensure_sa() {
  local email="$1" name="$2"
  if ! gcloud iam service-accounts describe "$email" --project "$PROJECT_ID" >/dev/null 2>&1; then
    say "Creating service account ${email}"
    gcloud iam service-accounts create "${email%%@*}" --project "$PROJECT_ID" --display-name="$name"
  fi
}
ensure_sa "$RUNTIME_SA" "NIHO Experience runtime (no permissions)"
ensure_sa "$DEPLOY_SA" "NIHO Experience deployer (GitHub Actions on main)"

say "Granting the deployer only what a deploy needs"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${DEPLOY_SA}" \
  --role=roles/run.admin --condition=None --quiet >/dev/null
gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" --project "$PROJECT_ID" --location "$REGION" \
  --member="serviceAccount:${DEPLOY_SA}" --role=roles/artifactregistry.writer --quiet >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --project "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOY_SA}" --role=roles/iam.serviceAccountUser --quiet >/dev/null

# 4. GitHub OIDC (Workload Identity Federation): no keys, main branch of this repository only
if ! gcloud iam workload-identity-pools describe "$POOL" --project "$PROJECT_ID" --location=global >/dev/null 2>&1; then
  say "Creating workload identity pool ${POOL}"
  gcloud iam workload-identity-pools create "$POOL" --project "$PROJECT_ID" --location=global \
    --display-name="GitHub Actions"
fi
CONDITION="assertion.repository_id == '${GITHUB_REPO_ID}' && assertion.ref == 'refs/heads/main'"
MAPPING="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref,attribute.environment=assertion.environment"
if ! gcloud iam workload-identity-pools providers describe "$PROVIDER" --project "$PROJECT_ID" --location=global \
  --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  say "Creating OIDC provider ${PROVIDER} for ${GITHUB_REPO}"
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --project "$PROJECT_ID" --location=global \
    --workload-identity-pool="$POOL" --display-name="${GITHUB_REPO}" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="$MAPPING" --attribute-condition="$CONDITION"
fi
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" --project "$PROJECT_ID" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository_id/${GITHUB_REPO_ID}" \
  --quiet >/dev/null

say "Done. Add these as GitHub repository variables (not secrets; nothing here is a password):"
cat <<EOF
GCP_PROJECT_ID=${PROJECT_ID}
GCP_REGION=${REGION}
GCP_ARTIFACT_REPOSITORY=${REPOSITORY}
GCP_WIF_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}
GCP_DEPLOY_SERVICE_ACCOUNT=${DEPLOY_SA}
GCP_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_SA}
EOF
