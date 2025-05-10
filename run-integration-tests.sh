#!/bin/bash

# Run QuillBooking integration tests
# This script runs all integration tests and shows detailed output

echo "Running QuillBooking Integration Tests..."
echo "============================================"

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    echo -e "${RED}Error: composer is not installed or not in PATH${RESET}"
    exit 1
fi

# Check if WP test environment is set up
if [ ! -d "vendor/bin" ]; then
    echo -e "${YELLOW}Installing dependencies...${RESET}"
    composer install
fi

# Run the integration tests
echo -e "${GREEN}Running all integration tests...${RESET}"
composer test:integration

# Run specific test suites with more detailed output
echo -e "\n${GREEN}Running booking flow tests...${RESET}"
composer test:booking

echo -e "\n${GREEN}Running payment processing tests...${RESET}"
composer test:payment

echo -e "\n${GREEN}Running API endpoint tests...${RESET}"
composer test:api

echo -e "\n${GREEN}Integration tests completed.${RESET}"
echo "============================================" 