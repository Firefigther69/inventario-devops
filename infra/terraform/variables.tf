variable "subscription_id" {
  description = "ID de la suscripción de Azure (Azure for Students). Se entrega por terraform.tfvars o TF_VAR_subscription_id."
  type        = string
}

variable "project" {
  description = "Prefijo para nombrar los recursos"
  type        = string
  default     = "inventario"
}

variable "environment" {
  description = "Nombre del ambiente"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Región de Azure (verificar regiones permitidas por la política de Azure for Students)"
  type        = string
  default     = "eastus"
}

variable "vm_size" {
  description = "Tamaño de la VM. Standard_B1s está incluido en la capa gratuita."
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Usuario administrador de la VM (usado también por el pipeline de CD)"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "Clave pública SSH para acceder a la VM (la privada se guarda como secreto en GitHub)"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "Rango CIDR autorizado para SSH. Los runners de GitHub usan IP dinámicas, por eso el valor por defecto es abierto y se protege con autenticación solo por clave."
  type        = string
  default     = "0.0.0.0/0"
}

variable "image" {
  description = "Imagen inicial de la aplicación en GHCR (el CD la reemplaza en cada versión)"
  type        = string
  default     = "ghcr.io/firefigther69/inventario-devops:latest"
}

variable "tags" {
  description = "Etiquetas comunes"
  type        = map(string)
  default = {
    proyecto   = "inventario-devops"
    asignatura = "DevOps-INACAP"
    gestionado = "terraform"
  }
}
