#!/usr/bin/env bash
# Configura la protección de la rama main mediante la API de GitHub (configuración como código).
# Requisitos: GitHub CLI autenticado (gh auth login) con permisos de administración del repositorio.
# Uso: ./scripts/proteger-main.sh OWNER/REPO
# Proyecto individual: se exige PR y checks del CI; GitHub no permite aprobar un PR propio,
# por eso las aprobaciones requeridas son 0 (subir a 1 si se incorporan más integrantes).
set -euo pipefail

REPO="${1:?Uso: $0 OWNER/REPO}"

gh api --method PUT "repos/${REPO}/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint y auditoría de dependencias",
      "Pruebas unitarias e integración",
      "Validar Terraform y configuración",
      "Construir y publicar imagen",
      "Título Conventional Commits"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON

# Solo "squash merge" y borrado automático de ramas integradas
gh api --method PATCH "repos/${REPO}" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true -F squash_merge_commit_title=PR_TITLE >/dev/null

echo "Protección de main aplicada en ${REPO}"
gh api "repos/${REPO}/branches/main/protection" --jq '{checks: .required_status_checks.contexts, reviews: .required_pull_request_reviews.required_approving_review_count}'
