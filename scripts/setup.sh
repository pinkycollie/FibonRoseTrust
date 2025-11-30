#!/bin/bash
# FibonRose Trust - Setup Script
# This script sets up the local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  FibonRose Trust - Development Setup ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check for required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    # Check for Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓ Node.js installed: ${NODE_VERSION}${NC}"
    else
        echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+ first.${NC}"
        exit 1
    fi
    
    # Check for npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        echo -e "${GREEN}✓ npm installed: ${NPM_VERSION}${NC}"
    else
        echo -e "${RED}✗ npm is not installed.${NC}"
        exit 1
    fi
    
    # Check for Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        echo -e "${GREEN}✓ Docker installed: ${DOCKER_VERSION}${NC}"
    else
        echo -e "${YELLOW}! Docker is not installed. Docker is optional but recommended for database.${NC}"
    fi
    
    # Check for Docker Compose (optional)
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose is available${NC}"
    else
        echo -e "${YELLOW}! Docker Compose is not available. Docker Compose is optional but recommended.${NC}"
    fi
    
    echo ""
}

# Setup environment file
setup_env() {
    echo -e "${YELLOW}Setting up environment...${NC}"
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
            echo -e "${YELLOW}! Please edit .env file with your configuration${NC}"
        else
            echo -e "${RED}✗ .env.example not found${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ .env file already exists${NC}"
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    
    npm ci || npm install
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
}

# Setup database with Docker
setup_database_docker() {
    echo -e "${YELLOW}Setting up database with Docker...${NC}"
    
    if command -v docker &> /dev/null; then
        # Start only the database service
        docker compose up -d db
        
        echo -e "${GREEN}✓ PostgreSQL database started${NC}"
        echo -e "${BLUE}  Database available at: localhost:5432${NC}"
        
        # Wait for database to be ready
        echo -e "${YELLOW}Waiting for database to be ready...${NC}"
        sleep 5
        
        echo -e "${GREEN}✓ Database is ready${NC}"
    else
        echo -e "${YELLOW}! Docker not available, skipping database setup${NC}"
        echo -e "${YELLOW}  Please set up PostgreSQL manually or use a cloud database${NC}"
    fi
    
    echo ""
}

# Run database migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    
    if [ -n "$DATABASE_URL" ] || [ -f .env ]; then
        npm run db:push
        echo -e "${GREEN}✓ Database migrations applied${NC}"
    else
        echo -e "${YELLOW}! DATABASE_URL not set, skipping migrations${NC}"
    fi
    
    echo ""
}

# Build the application
build_app() {
    echo -e "${YELLOW}Building application...${NC}"
    
    npm run build
    
    echo -e "${GREEN}✓ Application built successfully${NC}"
    echo ""
}

# Display next steps
show_next_steps() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Edit ${BLUE}.env${NC} file with your configuration"
    echo -e "  2. Start the development server: ${BLUE}npm run dev${NC}"
    echo -e "  3. Open ${BLUE}http://localhost:5000${NC} in your browser"
    echo ""
    echo -e "${YELLOW}Docker commands:${NC}"
    echo -e "  Start all services: ${BLUE}docker compose up${NC}"
    echo -e "  Start in background: ${BLUE}docker compose up -d${NC}"
    echo -e "  Stop services: ${BLUE}docker compose down${NC}"
    echo -e "  View logs: ${BLUE}docker compose logs -f${NC}"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  Run tests: ${BLUE}npm test${NC}"
    echo -e "  Run tests with coverage: ${BLUE}npm run test:coverage${NC}"
    echo -e "  Type check: ${BLUE}npm run check${NC}"
    echo ""
}

# Main function
main() {
    check_requirements
    setup_env
    install_dependencies
    
    # Ask user about Docker database setup
    if command -v docker &> /dev/null; then
        read -p "Do you want to start PostgreSQL with Docker? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            setup_database_docker
            run_migrations
        fi
    fi
    
    show_next_steps
}

# Run main function
main
