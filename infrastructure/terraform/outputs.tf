# FibonRose Trust - Terraform Outputs

# ===========================================
# GKE Cluster Outputs
# ===========================================
output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "gke_cluster_location" {
  description = "GKE cluster location"
  value       = google_container_cluster.primary.location
}

# ===========================================
# Database Outputs
# ===========================================
output "db_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.postgres.name
}

output "db_instance_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "db_name" {
  description = "Database name"
  value       = google_sql_database.database.name
}

output "db_user" {
  description = "Database username"
  value       = google_sql_user.db_user.name
}

output "database_url" {
  description = "Database connection URL (sensitive)"
  value       = "postgresql://${google_sql_user.db_user.name}:${random_password.db_password.result}@localhost:5432/${google_sql_database.database.name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}"
  sensitive   = true
}

# ===========================================
# Storage Outputs
# ===========================================
output "assets_bucket_name" {
  description = "Cloud Storage bucket name for assets"
  value       = google_storage_bucket.assets.name
}

output "assets_bucket_url" {
  description = "Cloud Storage bucket URL"
  value       = google_storage_bucket.assets.url
}

# ===========================================
# Network Outputs
# ===========================================
output "vpc_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.subnet.name
}

# ===========================================
# Secret Manager Outputs
# ===========================================
output "db_password_secret_id" {
  description = "Secret Manager ID for database password"
  value       = google_secret_manager_secret.db_password.secret_id
}

# ===========================================
# Kubernetes Connection Command
# ===========================================
output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${google_container_cluster.primary.location} --project ${var.project_id}"
}
