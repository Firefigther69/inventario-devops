terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Estado local por defecto (ver docs/APROVISIONAMIENTO.md).
  # Para trabajo en equipo se puede activar un backend remoto en Azure Storage:
  # backend "azurerm" {
  #   resource_group_name  = "rg-tfstate"
  #   storage_account_name = "<cuenta>"
  #   container_name       = "tfstate"
  #   key                  = "inventario.tfstate"
  # }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}
