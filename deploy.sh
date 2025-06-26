#!/bin/bash

# Deploy script for timetable-scheduler

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Timetable Scheduler Deployment ===${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Build and start the containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose up --build -d

# Check if containers are running
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
    echo -e "${GREEN}The application is now running at http://localhost:8000${NC}"
    echo -e "${YELLOW}To view logs: ${NC}docker-compose logs -f"
    echo -e "${YELLOW}To stop: ${NC}docker-compose down"
else
    echo -e "${RED}Deployment failed. Check the logs for more information.${NC}"
    exit 1
fi 