# FibonRose Trust - Terraform Configuration
# Main infrastructure configuration

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration - uncomment and configure for your setup
  # backend "gcs" {
  #   bucket = "fibonrose-terraform-state"
  #   prefix = "terraform/state"
  # }
}

# ===========================================
# Providers
# ===========================================
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "kubernetes" {
  host                   = google_container_cluster.primary.endpoint
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
}

data "google_client_config" "default" {}

# ===========================================
# Random ID for unique resource names
# ===========================================
resource "random_id" "suffix" {
  byte_length = 4
}

# ===========================================
# VPC Network
# ===========================================
resource "google_compute_network" "vpc" {
  name                    = "${var.project_name}-vpc-${random_id.suffix.hex}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${var.project_name}-subnet"
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.services_cidr
  }
}

# ===========================================
# Cloud SQL - PostgreSQL
# ===========================================
resource "google_sql_database_instance" "postgres" {
  name             = "${var.project_name}-postgres-${random_id.suffix.hex}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_size         = var.db_disk_size
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = var.environment == "production"
      start_time                     = "03:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = var.environment == "production"
}

resource "google_sql_database" "database" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

resource "random_password" "db_password" {
  length  = 24
  special = true
}

resource "google_sql_user" "db_user" {
  name     = var.db_user
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# ===========================================
# GKE Cluster
# ===========================================
resource "google_container_cluster" "primary" {
  name     = "${var.project_name}-gke-${random_id.suffix.hex}"
  location = var.region

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  release_channel {
    channel = "REGULAR"
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.project_name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count

  node_config {
    machine_type = var.node_machine_type
    disk_size_gb = 50
    disk_type    = "pd-standard"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.environment
    }

    tags = ["${var.project_name}-gke"]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }

  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }
}

# ===========================================
# Cloud Storage - for uploads/assets
# ===========================================
resource "google_storage_bucket" "assets" {
  name     = "${var.project_name}-assets-${random_id.suffix.hex}"
  location = var.region

  uniform_bucket_level_access = true

  cors {
    origin          = var.allowed_origins
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
}

# ===========================================
# Secret Manager
# ===========================================
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.project_name}-db-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# ===========================================
# Cloud Armor (optional, for production)
# ===========================================
resource "google_compute_security_policy" "policy" {
  count = var.environment == "production" ? 1 : 0

  name = "${var.project_name}-security-policy"

  rule {
    action   = "allow"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Allow all traffic"
  }

  rule {
    action   = "deny(403)"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default deny rule"
  }
}
