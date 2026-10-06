# Sistema de Gestión de Inventario — DevOps CI/CD + IaC en Azure

[![CI](https://github.com/Firefigther69/inventario-devops/actions/workflows/ci.yml/badge.svg)](https://github.com/Firefigther69/inventario-devops/actions/workflows/ci.yml)
[![CD](https://github.com/Firefigther69/inventario-devops/actions/workflows/cd.yml/badge.svg)](https://github.com/Firefigther69/inventario-devops/actions/workflows/cd.yml)

Aplicación web para registrar productos, controlar stock (entradas/salidas) y alertar productos bajo el stock
mínimo. Se construye, prueba, empaqueta y despliega de forma **100 % automatizada**: el ambiente Cloud se declara
con **Terraform**, la aplicación corre en **contenedores Docker** orquestados con **Docker Compose** y los
pipelines se definen como código en **GitHub Actions**.

> Evaluación sumativa Unidad 2 — Evidencia de implementación de infraestructura como código en ambientes Cloud.
> INACAP · Analista Programador.

**URL de la aplicación:** `http://<dns-label>.<region>.cloudapp.azure.com` (salida `app_url` de Terraform)

---

## Arquitectura

```
Desarrollador ──PR──▶ GitHub (main protegida) ──▶ GitHub Actions
                                                    │  CI: lint · audit · tests · terraform validate · trivy · build
                                                    ▼
                                         GHCR (ghcr.io/<owner>/inventario-devops)
                                                    │  CD: tag vX.Y.Z → promoción → aprobación → SSH
                                                    ▼
                  Azure (rg-inventario-prod, aprovisionado con Terraform)
                  └─ VNet 10.20.0.0/16 · NSG (80, 22) · IP pública + DNS
                     └─ VM Ubuntu 24.04 (cloud-init: Docker + Compose)
                        ├─ contenedor app  (Node.js 20, puerto 80→3000)
                        └─ contenedor db   (PostgreSQL 16, volumen pgdata, red interna)
```

Diagrama del pipeline: [`docs/img/pipeline.png`](docs/img/pipeline.png) · detalle en [`docs/PIPELINE.md`](docs/PIPELINE.md).

## Estructura del repositorio

```
.
├── app/                      # Aplicación Node.js (Express)
│   ├── src/                  # API REST, validación, acceso a datos
│   ├── public/               # Interfaz web
│   ├── tests/                # Pruebas Jest + Supertest
│   ├── package.json
│   └── eslint.config.js
├── infra/terraform/          # Infraestructura como código (Azure)
│   ├── versions.tf  variables.tf  main.tf  outputs.tf
│   ├── cloud-init.yaml.tftpl # Configuración del host (Docker)
│   └── terraform.tfvars.example
├── .github/
│   ├── workflows/ci.yml      # Integración Continua
│   ├── workflows/cd.yml      # Entrega Continua
│   ├── workflows/pr-title.yml# Convención de commits en PR
│   ├── CODEOWNERS
│   └── pull_request_template.md
├── docs/                     # Requerimientos, ramas, pipeline, aprovisionamiento, evidencias
├── scripts/                  # Automatización de configuración del repositorio
├── Dockerfile                # Imagen multi-stage de la app
├── docker-compose.yml        # Orquestación app + base de datos
├── .env.example  .gitignore  .dockerignore  .trivyignore
└── README.md
```

## Inicio rápido (local)

```bash
cp .env.example .env            # completar la clave de la BD
docker compose up -d --build    # app en http://localhost:8080
curl localhost:8080/health
```

Sin Docker: `cd app && npm ci && npm start` (usa almacenamiento en memoria si no hay `DATABASE_URL`).

| Comando (en `app/`) | Uso |
|---|---|
| `npm run lint` | Análisis estático con ESLint |
| `npm test` | Pruebas + cobertura + reporte JUnit |
| `npm run audit` | Revisión de dependencias vulnerables |

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado de la app y la BD + versión desplegada |
| GET | `/api/version` | Versión y ambiente |
| GET/POST | `/api/productos` | Listar / crear productos |
| GET/PUT/DELETE | `/api/productos/:id` | Obtener / actualizar / eliminar |
| POST | `/api/productos/:id/movimientos` | Entrada (`cantidad>0`) o salida (`cantidad<0`) de stock |
| GET | `/api/productos/alertas` | Productos con stock ≤ stock mínimo |

## Flujo de trabajo

- Estrategia de ramas **GitHub Flow** con `main` protegida → [`docs/ESTRATEGIA_RAMAS.md`](docs/ESTRATEGIA_RAMAS.md)
- Commits **Conventional Commits** → [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Requerimientos del proyecto → [`docs/REQUERIMIENTOS.md`](docs/REQUERIMIENTOS.md)
- Aprovisionar / eliminar el ambiente Azure → [`docs/APROVISIONAMIENTO.md`](docs/APROVISIONAMIENTO.md)
- Liberar una versión: `git tag v1.1.0 && git push origin v1.1.0`

## Equipo

| Integrante | Usuario | Rol |
|---|---|---|
| Gino Cortés Leiva | [@Firefigther69](https://github.com/Firefigther69) | Desarrollo, CI/CD, contenedores e infraestructura (proyecto individual) |

Detalle de roles y aportes: [`docs/ROLES.md`](docs/ROLES.md).

## Seguridad

Ninguna credencial se versiona. Las claves viven en **GitHub Secrets** (`VM_HOST`, `VM_USER`, `VM_SSH_KEY`), en el
`GITHUB_TOKEN` efímero de cada ejecución y en el archivo `.env` de la VM generado por Terraform (`random_password`).
