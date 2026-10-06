# Estrategia de ramas: GitHub Flow

El equipo adopta **GitHub Flow**, una variante de *trunk-based development* con ramas de corta duración:

```
main ─────●──────────●──────────●──────── (siempre desplegable, protegida)
           \        /  \        /   tag v1.0.0 → CD     tag v1.1.0 → CD
            feature/crud-productos   feature/alertas-stock
```

| Rama | Propósito | Ejemplo |
|---|---|---|
| `main` | Código integrado y desplegable. Solo recibe cambios por PR. | — |
| `feature/<tema>` | Nueva funcionalidad | `feature/movimientos-stock` |
| `fix/<tema>` | Corrección | `fix/validacion-precio` |
| `ci/<tema>` | Pipelines o contenedores | `ci/escaneo-trivy` |
| `infra/<tema>` | Terraform / ambiente Cloud | `infra/nsg-reglas` |
| `docs/<tema>` | Documentación | `docs/aprovisionamiento` |

**Por qué GitHub Flow y no GitFlow:** el proyecto tiene un único ambiente productivo y libera versiones frecuentes
mediante tags; GitFlow agrega ramas `develop` y `release` que no aportan valor a este tamaño de equipo y retrasan la
integración continua.

## Ciclo de un cambio

1. `git switch -c feature/alertas-stock` desde `main` actualizada.
2. Commits pequeños con Conventional Commits.
3. `git push -u origin feature/alertas-stock` y abrir un PR hacia `main` usando la plantilla.
4. El CI corre automáticamente y el autor completa la autorrevisión de la plantilla (proyecto individual; ver `docs/ROLES.md`).
5. Merge con **Squash and merge** (el título del PR, validado por `pr-title.yml`, queda como commit en `main`).
6. Se elimina la rama. Para liberar: `git tag vX.Y.Z` sobre `main` → pipeline de CD.

## Protección de la rama `main`

Configurada con el script versionado [`scripts/proteger-main.sh`](../scripts/proteger-main.sh) (GitHub API):

- Requiere pull request antes de integrar (aprobaciones requeridas: 0 por ser proyecto individual; GitHub no permite aprobar un PR propio).
- Descarta aprobaciones si se suben nuevos commits.
- **Checks obligatorios:** `Lint y auditoría de dependencias`, `Pruebas unitarias e integración`,
  `Validar Terraform y configuración`, `Construir y publicar imagen`, `Título Conventional Commits`.
- La rama debe estar actualizada con `main` antes del merge.
- Conversaciones resueltas obligatorias; historial lineal; sin *force push* ni eliminación.

## Convención de commits

Ver [`CONTRIBUTING.md`](../CONTRIBUTING.md).
