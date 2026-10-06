# Requerimientos del proyecto

Caso de estudio: **Sistema de gestión de inventario** para un comercio de distribución (bodega y sala de ventas).

## Alcance y usuarios

| Elemento | Detalle |
|---|---|
| Problema | El control de stock se lleva en planillas: hay quiebres de stock y errores de conteo. |
| Alcance | Registro de productos (SKU, nombre, categoría, precio), entradas y salidas de stock, alertas de stock bajo, API REST e interfaz web. |
| Fuera de alcance | Facturación, autenticación de usuarios finales, multi-bodega. |
| Usuarios previstos | Encargado de bodega (registra movimientos), administrador (mantiene el catálogo), jefatura (consulta alertas). |

## Requerimientos funcionales

| ID | Requerimiento |
|---|---|
| RF-01 | Crear, listar, consultar, editar y eliminar productos. |
| RF-02 | Registrar entradas y salidas de stock sin permitir stock negativo. |
| RF-03 | Listar productos con stock igual o menor al stock mínimo. |
| RF-04 | Exponer el estado del servicio y la versión desplegada (`/health`). |

## Requerimientos técnicos que la configuración de contenedores debe satisfacer

| Aspecto | Requerimiento | Cómo se satisface |
|---|---|---|
| Lenguaje / runtime | Node.js 20 LTS, Express 4 | Imagen base `node:20-alpine` (Dockerfile multi-stage) |
| Servicios | 1) `app` (API + web) 2) `db` (PostgreSQL) | `docker-compose.yml` con dos servicios |
| Base de datos | PostgreSQL 16 | Imagen oficial `postgres:16-alpine` |
| Dependencias | express, helmet, pg (producción); jest, supertest, eslint (desarrollo) | `package.json` + `package-lock.json`; la imagen instala solo producción (`npm ci --omit=dev`) |
| Puertos | App escucha en 3000 dentro del contenedor; se publica en 80 en la VM (8080 en local). BD 5432 **solo** en red interna | `ports: "${APP_PORT}:3000"`; servicio `db` sin `ports`; NSG solo abre 80 y 22 |
| Persistencia | Los datos sobreviven a reinicios y redespliegues | Volumen nombrado `pgdata` → `/var/lib/postgresql/data` |
| Variables de entorno | `DATABASE_URL`, `PORT`, `NODE_ENV`, `APP_VERSION`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `IMAGE`, `APP_PORT` | Archivo `.env` (no versionado); plantilla `.env.example` |
| Orden de arranque | La app espera a que la BD esté sana | `depends_on: condition: service_healthy` + `pg_isready` + reintentos en la app |
| Salud | Verificación automática del contenedor | `HEALTHCHECK` en Dockerfile contra `/health` |
| Seguridad | Sin privilegios de root, sin secretos en la imagen | `USER node`, `.dockerignore` excluye `.env` |

## Proveedor Cloud y herramienta IaC

| Decisión | Elección | Justificación |
|---|---|---|
| Proveedor | **Microsoft Azure (Azure for Students)** | Crédito educativo de USD 100 sin tarjeta; VM B1s incluida en capa gratuita; los recursos permanecen encendidos hasta la retroalimentación (a diferencia de los laboratorios temporales de AWS Academy). |
| IaC | **Terraform** (provider `azurerm` 4.x) | Declarativo, multiplataforma, estándar de la industria; plan previo (`terraform plan`) y eliminación total (`terraform destroy`). |
| Cómputo | VM Linux con Docker Compose | Cumple la orquestación app + BD exigida, con costo cubierto por la capa gratuita. |
| Registro de imágenes | GitHub Container Registry (GHCR) | Integrado al repositorio; autenticación con `GITHUB_TOKEN` sin credenciales adicionales. |
| CI/CD | GitHub Actions | Pipeline como código en el mismo repositorio; ambientes con aprobación y secretos protegidos. |
