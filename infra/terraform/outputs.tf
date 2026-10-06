output "resource_group" {
  description = "Grupo de recursos creado"
  value       = azurerm_resource_group.rg.name
}

output "public_ip" {
  description = "IP pública de la VM (secreto VM_HOST en GitHub)"
  value       = azurerm_public_ip.pip.ip_address
}

output "app_url" {
  description = "URL pública de la aplicación (variable APP_URL en GitHub)"
  value       = "http://${azurerm_public_ip.pip.fqdn}"
}

output "ssh_command" {
  description = "Comando para conectarse a la VM"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.pip.ip_address}"
}
