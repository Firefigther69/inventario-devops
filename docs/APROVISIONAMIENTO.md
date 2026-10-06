# Aprovisionamiento y eliminación del ambiente Cloud (Terraform + Azure)

El ambiente **no se configura manualmente en el portal**: todo se declara en `infra/terraform/`.

## Recursos declarados

| Recurso Terraform | Nombre en Azure | Función |
|---|---|---|
| `azurerm_resource_group.rg` | `rg-inventario-prod` | Contenedor lógico de todo el ambiente |
| `azurerm_virtual_network.vnet` | `vnet-inventario-prod` (10.20.0.0/16) | Red privada |
| `azurerm_subnet.app` | `snet-app` (10.20.1.0/24) | Subred de la VM |
| `azurerm_network_security_group.nsg` | `nsg-inventario-prod` | Firewall: 80 (HTTP) y 22 (SSH solo con clave) |
| `azurerm_public_ip.pip` | `pip-inventario-prod` | IP estática + DNS `inventario-xxxxx.<region>.cloudapp.azure.com` |
| `azurerm_network_interface.nic` | `nic-inventario-prod` | Interfaz de red |
| `azurerm_linux_virtual_machine.vm` | `vm-inventario-prod` | Ubuntu 24.04, Standard_B1s, host de contenedores |
| `random_password.db` | — | Clave de PostgreSQL generada (nunca en el repo) |
| `cloud-init.yaml.tftpl` | — | Instala Docker/Compose, crea `/opt/inventario` con `docker-compose.yml` y `.env` |

## Requisitos previos (una sola vez)

1. Activar **Azure for Students** con la cuenta institucional.
2. Instalar [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) y [Terraform ≥ 1.6](https://developer.hashicorp.com/terraform/install).
3. Generar la clave SSH de despliegue (sin passphrase, la usará el pipeline):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/inventario_deploy -C deploy-inventario -N ""
   ```

## Aprovisionar

```bash
az login
az account show --query id -o tsv           # copiar el subscription_id

cd infra/terraform
cp terraform.tfvars.example terraform.tfvars # completar subscription_id, ssh_public_key, image
terraform init
terraform plan -out=tfplan
terraform apply tfplan 2>&1 | tee apply.log  # evidencia de la ejecución
terraform output
```

Salidas: `public_ip`, `app_url`, `ssh_command`, `resource_group`.
Si la región es rechazada por la política de la suscripción (`RequestDisallowedByAzure`), cambiar `location`
(por ejemplo `brazilsouth` o `eastus2`).

## Conectar el ambiente con el pipeline de CD

En GitHub → *Settings → Secrets and variables → Actions*:

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `VM_HOST` | `terraform output -raw public_ip` |
| Secret | `VM_USER` | `azureuser` |
| Secret | `VM_SSH_KEY` | contenido de `~/.ssh/inventario_deploy` (clave **privada**) |
| Variable | `APP_URL` | `terraform output -raw app_url` |

En *Settings → Environments* crear `production` con **Required reviewers** (aprobación del despliegue).

> Primer despliegue: el paquete GHCR se crea con el primer push a `main`. Luego `git tag v1.0.0 && git push origin v1.0.0`.

## Verificar

```bash
curl "$(terraform output -raw app_url)/health"
ssh azureuser@$(terraform output -raw public_ip) "cd /opt/inventario && docker compose ps"
az resource list -g rg-inventario-prod -o table
```

## Eliminar el ambiente

```bash
cd infra/terraform
terraform plan -destroy
terraform destroy          # elimina TODOS los recursos del grupo
az group show -n rg-inventario-prod   # debe responder ResourceGroupNotFound
```

**No ejecutar `destroy` antes de la fecha de retroalimentación**: el ambiente debe permanecer accesible.

## Estado de Terraform

El estado (`terraform.tfstate`) contiene la IP y la clave de la BD, por eso está en `.gitignore`. Se mantiene en
el equipo del responsable de infraestructura. Para trabajo concurrente se puede habilitar el backend `azurerm`
comentado en `versions.tf`.

## Excepciones de seguridad aceptadas

El escaneo Trivy de IaC marca SSH/HTTP abiertos a Internet. HTTP es la función del servicio; SSH es necesario
porque los runners de GitHub tienen IP dinámicas, mitigado con autenticación solo por clave. Ver `.trivyignore`.
