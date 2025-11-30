#!/bin/bash
# FibonRose Trust - Deployment Script
# This script handles deployment to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
IMAGE_TAG="${2:-latest}"
REGISTRY="${DOCKER_REGISTRY:-}"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  FibonRose Trust - Deployment       ${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "  Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "  Image Tag: ${YELLOW}${IMAGE_TAG}${NC}"
echo ""

# Check requirements
check_requirements() {
    echo -e "${YELLOW}Checking deployment requirements...${NC}"
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker is required for deployment${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker is available${NC}"
    echo ""
}

# Run tests before deployment
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    
    cd "$PROJECT_DIR"
    npm run test:run
    
    echo -e "${GREEN}✓ All tests passed${NC}"
    echo ""
}

# Build Docker image
build_image() {
    echo -e "${YELLOW}Building Docker image...${NC}"
    
    cd "$PROJECT_DIR"
    
    IMAGE_NAME="fibonrose-trust"
    
    if [ -n "$REGISTRY" ]; then
        FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    else
        FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
    fi
    
    docker build \
        --target production \
        -t "$FULL_IMAGE_NAME" \
        -f Dockerfile \
        .
    
    echo -e "${GREEN}✓ Docker image built: ${FULL_IMAGE_NAME}${NC}"
    echo ""
    
    export BUILT_IMAGE_NAME="$FULL_IMAGE_NAME"
}

# Push image to registry
push_image() {
    if [ -z "$REGISTRY" ]; then
        echo -e "${YELLOW}No registry specified, skipping push${NC}"
        return
    fi
    
    echo -e "${YELLOW}Pushing image to registry...${NC}"
    
    docker push "$BUILT_IMAGE_NAME"
    
    echo -e "${GREEN}✓ Image pushed to registry${NC}"
    echo ""
}

# Deploy to development environment
deploy_development() {
    echo -e "${YELLOW}Deploying to development environment...${NC}"
    
    cd "$PROJECT_DIR"
    
    docker compose down || true
    docker compose up -d --build
    
    echo -e "${GREEN}✓ Development deployment complete${NC}"
    echo -e "${BLUE}  Application available at: http://localhost:5000${NC}"
    echo ""
}

# Deploy to staging environment
deploy_staging() {
    echo -e "${YELLOW}Deploying to staging environment...${NC}"
    
    # Check for kubectl
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}✗ kubectl is required for staging deployment${NC}"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
    
    # Apply Kubernetes configurations
    kubectl apply -f infrastructure/kubernetes/ --namespace=staging
    
    echo -e "${GREEN}✓ Staging deployment complete${NC}"
    echo ""
}

# Deploy to production environment
deploy_production() {
    echo -e "${YELLOW}Deploying to production environment...${NC}"
    
    # Check for kubectl
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}✗ kubectl is required for production deployment${NC}"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
    
    # Confirm production deployment
    read -p "Are you sure you want to deploy to PRODUCTION? (yes/no) " -r
    if [[ ! $REPLY == "yes" ]]; then
        echo -e "${YELLOW}Production deployment cancelled${NC}"
        exit 0
    fi
    
    # Apply Kubernetes configurations
    kubectl apply -f infrastructure/kubernetes/ --namespace=production
    
    echo -e "${GREEN}✓ Production deployment complete${NC}"
    echo ""
}

# Display deployment info
show_deployment_info() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
    echo -e "${YELLOW}Deployment Details:${NC}"
    echo -e "  Environment: ${BLUE}${ENVIRONMENT}${NC}"
    echo -e "  Image Tag: ${BLUE}${IMAGE_TAG}${NC}"
    if [ -n "$BUILT_IMAGE_NAME" ]; then
        echo -e "  Image: ${BLUE}${BUILT_IMAGE_NAME}${NC}"
    fi
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  View logs: ${BLUE}docker compose logs -f${NC}"
    echo -e "  Check status: ${BLUE}docker compose ps${NC}"
    echo -e "  Stop services: ${BLUE}docker compose down${NC}"
    echo ""
}

# Main function
main() {
    check_requirements
    run_tests
    build_image
    
    case "$ENVIRONMENT" in
        development|dev)
            deploy_development
            ;;
        staging|stage)
            push_image
            deploy_staging
            ;;
        production|prod)
            push_image
            deploy_production
            ;;
        build-only)
            echo -e "${GREEN}✓ Build complete (no deployment)${NC}"
            ;;
        *)
            echo -e "${RED}Unknown environment: ${ENVIRONMENT}${NC}"
            echo -e "Usage: $0 [development|staging|production|build-only] [image-tag]"
            exit 1
            ;;
    esac
    
    show_deployment_info
}

# Run main function
main
