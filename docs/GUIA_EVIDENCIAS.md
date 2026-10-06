# Guía de ejecución y evidencias (escala de apreciación, 60 puntos)

Orden recomendado para el equipo. Cada paso indica qué ítem de la escala cubre y qué captura tomar.
Las capturas deben mostrar **fecha, usuario o ID de ejecución** (requisito de la entrega).

## Fase 1 — Repositorio y control de versiones (ítems 1–5 · 12 pts)

Proyecto individual de `@Firefigther69`. El historial se construye con una rama y un PR por área:

| Rama | Contenido | Título del PR |
|---|---|---|
| `feature/api-productos` | `app/src`, `app/package*.json`, `app/eslint.config.js` | `feat(api): crud de productos y movimientos de stock` |
| `test/api` | `app/tests` | `test(api): pruebas de crud, movimientos y alertas` |
| `feature/web` | `app/public` | `feat(web): interfaz de inventario` |
| `build/contenedores` | `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.env.example` | `build(docker): imagen multi-stage y orquestación app + postgres` |
| `ci/pipeline` | `ci.yml`, `pr-title.yml`, plantilla PR, CODEOWNERS, `.trivyignore`, script de protección | `ci: pipeline de integración continua` |
| `infra/azure` | `infra/terraform/**`, `docs/APROVISIONAMIENTO.md` | `infra(azure): declarar ambiente con terraform` |
| `ci/cd-azure` | `cd.yml`, `docs/PIPELINE.md`, diagramas | `ci(cd): entrega continua hacia azure` |
| `docs/requerimientos` | `docs/REQUERIMIENTOS.md`, `docs/ROLES.md`, guía | `docs: requerimientos, roles y guía de evidencias` |

Cada PR se integra con **Squash and merge** una vez que los checks del CI están en verde.
Aplicar la protección de `main`: `./scripts/proteger-main.sh Firefigther69/inventario-devops`.

**Capturas:** árbol del repo · *Settings → Branches* (regla de main) · lista de PR cerrados ·
un PR con sus checks en verde · `git log --oneline --graph` · *Insights → Contributors*.

## Fase 2 — Integración Continua (ítems 6–10 · 15 pts)

- Ítem 6: `docs/img/pipeline.png` (etapas, disparadores, condiciones de falla).
- Ítem 7: `.github/workflows/ci.yml` en el repo.
- Ítem 8: jobs de ESLint, `npm audit`, `terraform validate` y Trivy.
- Ítem 9: jobs de pruebas y construcción de imagen.
- Ítem 10: **Actions → CI** con varias ejecuciones exitosas; detalle de una con los 4 jobs, el resumen de cobertura
  y el artefacto `reportes-pruebas`. Sumar una ejecución fallida intencional en un PR (por ejemplo, una prueba
  rota) que muestre el merge bloqueado: demuestra las condiciones de falla.

## Fase 3 — Contenedores (ítems 17–21 · 15 pts)

- Ítem 17: `docs/REQUERIMIENTOS.md` (servicios, dependencias, puertos, persistencia, variables).
- Ítem 18: `Dockerfile`.
- Ítem 19: **Packages** del repo en GHCR con las etiquetas `sha-…`, `main`, `v1.0.0`, `v1.1.0`, `latest`.
- Ítem 20: `docker-compose.yml`; captura de `docker compose ps` (app y db *healthy*).
- Ítem 21: `ssh` a la VM → `docker compose ps` + `docker compose logs app --tail 20`; navegador con la URL pública.

## Fase 4 — Infraestructura como código (ítems 11–12 · 6,6 pts)

- Seguir `docs/APROVISIONAMIENTO.md`. Guardar `apply.log`.
- **Capturas:** terminal con `terraform plan` y `Apply complete! Resources: 10 added`, `terraform output`,
  portal de Azure con el grupo `rg-inventario-prod` y sus recursos (con la etiqueta `gestionado = terraform`).

## Fase 5 — Entrega Continua (ítems 13–16 · 11,4 pts)

1. Configurar secretos y variable (`VM_HOST`, `VM_USER`, `VM_SSH_KEY`, `APP_URL`) y el ambiente `production`
   con revisor obligatorio.
2. **Versión 1:** `git tag v1.0.0 && git push origin v1.0.0` → aprobar el despliegue → verificar.
3. **Versión 2:** hacer un cambio visible por PR (ejemplo abajo), merge, `git tag v1.1.0 && git push origin v1.1.0`.
4. **Capturas:** Actions → CD con ambas ejecuciones · pantalla de aprobación del ambiente · *Settings → Secrets*
   (solo nombres, nunca valores) · Releases v1.0.0 y v1.1.0 · navegador con la insignia **versión v1.0.0** y luego
   **versión v1.1.0** · `curl APP_URL/health` de cada versión.

Cambio sugerido para v1.1.0 (`feat(web): mostrar total valorizado del inventario`): en
`app/public/index.html` agregar `<p id="total"></p>` bajo el título de la tabla, y en `app/public/app.js`, dentro
de `cargar()`, después del `forEach`:

```js
var total = items.reduce(function (s, p) { return s + p.stock * p.precio; }, 0);
document.getElementById('total').textContent = 'Valor total del inventario: ' + clp.format(total);
```

## Resumen de puntaje

| Bloque | Ítems | Puntos |
|---|---|---|
| Control de versiones | 1–5 | 12,0 |
| Integración Continua | 6–10 | 15,0 |
| IaC + Entrega Continua | 11–16 | 18,0 |
| Contenedores | 17–21 | 15,0 |
| **Total** | 21 | **60,0** |
