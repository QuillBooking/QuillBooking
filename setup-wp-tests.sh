#!/usr/bin/env bash

# Load environment variables from .env file
if [ -f .env ]; then
  set -a
  # This will properly handle special characters in the values
  while IFS='=' read -r key value; do
    if [[ ! $key =~ ^# && -n "$key" ]]; then
      export "$key=$value"
    fi
  done < .env
  set +a
  
  echo "Environment loaded from .env file"
  echo "WP_TESTS_DB_NAME=$WP_TESTS_DB_NAME"
  echo "WP_TESTS_DB_USER=$WP_TESTS_DB_USER"
  echo "WP_TESTS_DB_PASSWORD=$WP_TESTS_DB_PASSWORD"
else
  echo "No .env file found"
  exit 1
fi

# Run the wp-tests install script
./bin/install-wp-tests.sh 