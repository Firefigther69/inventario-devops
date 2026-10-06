# Guía de contribución

## Convención de commits: Conventional Commits 1.0.0

Formato: `tipo(alcance): descripción en minúsculas y en imperativo`

| Tipo | Uso | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(api): agregar endpoint de alertas de stock` |
| `fix` | Corrección de error | `fix(api): impedir stock negativo en salidas` |
| `test` | Pruebas | `test(api): cubrir movimientos de stock` |
| `ci` | Pipelines | `ci: agregar escaneo de imagen con trivy` |
| `build` | Docker / dependencias | `build(docker): imagen multi-stage con usuario no root` |
| `infra` | Terraform | `infra(azure): declarar vm, nsg e ip pública` |
| `docs` | Documentación | `docs: documentar aprovisionamiento y eliminación` |
| `refactor` / `style` / `chore` | Mantenimiento | `chore: actualizar dependencias` |

Alcances sugeridos: `api`, `web`, `db`, `docker`, `compose`, `ci`, `cd`, `azure`, `docs`.
Un cambio incompatible se marca con `!` (`feat(api)!: ...`).

## Reglas

1. Nunca hacer push directo a `main`: siempre rama + pull request.
2. Cada PR se revisa con los checks del CI y la autorrevisión de la plantilla (proyecto individual).
3. El PR debe pasar todos los checks del CI.
4. No subir credenciales, tokens, claves, `.env` ni `terraform.tfvars`.
5. Antes de abrir el PR: `cd app && npm run lint && npm test`.
