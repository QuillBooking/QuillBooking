# QuillBooking

WordPress plugin for managing bookings.

## Development

### Requirements

- PHP 7.4 or higher
- WordPress 5.9 or higher
- Composer
- Node.js & npm

### Setup

1. Clone this repository into your WordPress plugins directory
2. Run `composer install` to install PHP dependencies
3. Run `npm install` to install JavaScript dependencies
4. Activate the plugin in WordPress admin

### Testing

The plugin uses PHPUnit for unit testing. To run the tests locally:

Copy `.env.example` to `.env` and update the database credentials

```bash
# Set up the WordPress test environment (first time only)
./setup-wp-tests.sh

# Run the tests
composer test
```

## Continuous Integration

This project uses GitHub Actions to run automated tests against various PHP and WordPress versions. The CI pipeline:

1. Runs on every push to main/master and on all pull requests
2. Tests against PHP versions 7.4, 8.0, 8.1, and 8.2
3. Tests against WordPress versions 5.9, 6.0, 6.1, 6.2, 6.3, 6.4, and latest
4. Excludes incompatible combinations (e.g., WP 5.9 with PHP 8.1+)

The test matrix ensures compatibility across different environments and helps catch issues early.

### CI Workflow

The GitHub Actions workflow:

1. Sets up the specified PHP version
2. Installs Composer dependencies
3. Creates a MySQL database for testing
4. Sets up the WordPress test environment for the specified version
5. Runs the PHPUnit tests

You can view the workflow configuration in `.github/workflows/wordpress-phpunit.yml`.

## Contributing

1. Create a feature branch from `main`
2. Make your changes and add tests if applicable
3. Run tests locally to ensure they pass
4. Submit a pull request 