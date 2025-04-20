#!/usr/bin/env bash

# Enable error tracing for debugging in GitHub Actions
if [ "${GITHUB_ACTIONS}" = "true" ]; then
  set -x  # Print commands before execution
  echo "Running in GitHub Actions environment"
fi

# Debug: Show environment variables 
echo "Environment variables: WP_TESTS_DB_NAME=$WP_TESTS_DB_NAME, WP_TESTS_DB_USER=$WP_TESTS_DB_USER, WP_TESTS_DB_HOST=$WP_TESTS_DB_HOST, WP_VERSION=$WP_VERSION"

# Check if environment variables are set
if [[ -n "$WP_TESTS_DB_NAME" && -n "$WP_TESTS_DB_USER" && -n "$WP_TESTS_DB_PASSWORD" ]]; then
	# Use environment variables
	echo "Using environment variables"
	DB_NAME=$WP_TESTS_DB_NAME
	DB_USER=$WP_TESTS_DB_USER
	DB_PASS=$WP_TESTS_DB_PASSWORD
	DB_HOST=${WP_TESTS_DB_HOST:-localhost}
	WP_VERSION=${WP_VERSION:-latest}
	SKIP_DB_CREATE=${SKIP_DB_CREATE:-false}
elif [ -f .env ]; then
	# Try loading from .env file if it exists
	echo "Loading from .env file"
	set -a
	# This will properly handle special characters in the values
	while IFS='=' read -r key value; do
		if [[ ! $key =~ ^# && -n "$key" ]]; then
			export "$key=$value"
		fi
	done < .env
	set +a
	
	DB_NAME=$WP_TESTS_DB_NAME
	DB_USER=$WP_TESTS_DB_USER
	DB_PASS=$WP_TESTS_DB_PASSWORD
	DB_HOST=${WP_TESTS_DB_HOST:-localhost}
	WP_VERSION=${WP_VERSION:-latest}
	SKIP_DB_CREATE=${SKIP_DB_CREATE:-false}
	
	echo "Loaded from .env file: DB_NAME=$DB_NAME, DB_USER=$DB_USER, DB_HOST=$DB_HOST"
else
	# Fall back to command line arguments
	echo "Using command line arguments"
	if [ $# -lt 3 ]; then
		echo "usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-database-creation]"
		echo "  or set WP_TESTS_DB_NAME, WP_TESTS_DB_USER, WP_TESTS_DB_PASSWORD environment variables"
		exit 1
	fi
	
	DB_NAME=$1
	DB_USER=$2
	DB_PASS=$3
	DB_HOST=${4-localhost}
	WP_VERSION=${5-latest}
	SKIP_DB_CREATE=${6-false}
fi

echo "Using DB configuration: DB_NAME=$DB_NAME, DB_USER=$DB_USER, DB_HOST=$DB_HOST"

# Use WP_TESTS_DIR from environment if defined
TMPDIR=${TMPDIR-/tmp}
TMPDIR=$(echo $TMPDIR | sed -e "s/\/$//")
WP_TESTS_DIR=${WP_TESTS_DIR-$TMPDIR/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR-$TMPDIR/wordpress/}

download() {
    if [ `which curl` ]; then
        curl -s "$1" > "$2";
    elif [ `which wget` ]; then
        wget -nv -O "$2" "$1"
    fi
}

if [[ $WP_VERSION =~ ^[0-9]+\.[0-9]+\-(beta|RC)[0-9]+$ ]]; then
	WP_BRANCH=${WP_VERSION%\-*}
	WP_TESTS_TAG="branches/$WP_BRANCH"

elif [[ $WP_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
	WP_TESTS_TAG="branches/$WP_VERSION"
elif [[ $WP_VERSION =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
	if [[ $WP_VERSION =~ [0-9]+\.[0-9]+\.[0] ]]; then
		# version x.x.0 means the first release of the major version, so strip off the .0 and download version x.x
		WP_TESTS_TAG="tags/${WP_VERSION%??}"
	else
		WP_TESTS_TAG="tags/$WP_VERSION"
	fi
elif [[ $WP_VERSION == 'nightly' || $WP_VERSION == 'trunk' ]]; then
	WP_TESTS_TAG="trunk"
else
	# http serves a single offer, whereas https serves multiple. we only want one
	download http://api.wordpress.org/core/version-check/1.7/ /tmp/wp-latest.json
	grep '[0-9]+\.[0-9]+(\.[0-9]+)?' /tmp/wp-latest.json
	LATEST_VERSION=$(grep -o '"version":"[^"]*' /tmp/wp-latest.json | sed 's/"version":"//')
	if [[ -z "$LATEST_VERSION" ]]; then
		echo "Latest WordPress version could not be found"
		exit 1
	fi
	WP_TESTS_TAG="tags/$LATEST_VERSION"
fi
set -ex

install_wp() {

	if [ -d $WP_CORE_DIR ]; then
		return;
	fi

	mkdir -p $WP_CORE_DIR

	if [[ $WP_VERSION == 'nightly' || $WP_VERSION == 'trunk' ]]; then
		mkdir -p $TMPDIR/wordpress-nightly
		download https://wordpress.org/nightly-builds/wordpress-latest.zip  $TMPDIR/wordpress-nightly/wordpress-nightly.zip
		unzip -q $TMPDIR/wordpress-nightly/wordpress-nightly.zip -d $TMPDIR/wordpress-nightly/
		mv $TMPDIR/wordpress-nightly/wordpress/* $WP_CORE_DIR
	else
		if [ $WP_VERSION == 'latest' ]; then
			local ARCHIVE_NAME='latest'
		else
			local ARCHIVE_NAME="wordpress-$WP_VERSION"
		fi
		download https://wordpress.org/${ARCHIVE_NAME}.tar.gz  $TMPDIR/wordpress.tar.gz
		tar --strip-components=1 -zxmf $TMPDIR/wordpress.tar.gz -C $WP_CORE_DIR
	fi

	download https://raw.github.com/markoheijnen/wp-mysqli/master/db.php $WP_CORE_DIR/wp-content/db.php
}

install_test_suite() {
	# portable in-place argument for both GNU sed and Mac OSX sed
	if [[ $(uname -s) == 'Darwin' ]]; then
		local ioption='-i.bak'
	else
		local ioption='-i'
	fi

	# set up testing suite if it doesn't yet exist
	if [ ! -d $WP_TESTS_DIR ]; then
		# set up testing suite
		mkdir -p $WP_TESTS_DIR
		echo "Checking out includes from SVN using tag/branch: ${WP_TESTS_TAG}"
		echo "SVN URL: https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/includes/"
		svn co https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/includes/ $WP_TESTS_DIR/includes
		svn_status=$?
		if [ $svn_status -ne 0 ]; then
			echo "SVN checkout failed with status $svn_status"
			exit 1
		fi
		
		echo "Checking out data from SVN..."
		svn co https://develop.svn.wordpress.org/${WP_TESTS_TAG}/tests/phpunit/data/ $WP_TESTS_DIR/data
		svn_status=$?
		if [ $svn_status -ne 0 ]; then
			echo "SVN data checkout failed with status $svn_status"
			exit 1
		fi
	fi

	if [ ! -f wp-tests-config.php ]; then
		download https://develop.svn.wordpress.org/${WP_TESTS_TAG}/wp-tests-config-sample.php "$WP_TESTS_DIR"/wp-tests-config.php
		# remove all forward slashes in the end
		WP_CORE_DIR=$(echo $WP_CORE_DIR | sed "s:/\+$::")
		sed $ioption "s:dirname( __FILE__ ) . '/src/':'$WP_CORE_DIR/':" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s/youremptytestdbnamehere/$DB_NAME/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s/yourusernamehere/$DB_USER/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s/yourpasswordhere/$DB_PASS/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s|localhost|${DB_HOST}|" "$WP_TESTS_DIR"/wp-tests-config.php
	fi

}

install_db() {
	if [ ${SKIP_DB_CREATE} = "true" ]; then
		return 0
	fi

	# parse DB_HOST for port or socket references
	local PARTS=(${DB_HOST//\:/ })
	local DB_HOSTNAME=${PARTS[0]};
	local DB_SOCK_OR_PORT=${PARTS[1]};
	local EXTRA=""

	if ! [ -z $DB_HOSTNAME ] ; then
		if [ $(echo $DB_SOCK_OR_PORT | grep -e '^[0-9]\{1,\}$') ]; then
			EXTRA=" --host=$DB_HOSTNAME --port=$DB_SOCK_OR_PORT --protocol=tcp"
		elif ! [ -z $DB_SOCK_OR_PORT ] ; then
			EXTRA=" --socket=$DB_SOCK_OR_PORT"
		elif ! [ -z $DB_HOSTNAME ] ; then
			EXTRA=" --host=$DB_HOSTNAME --protocol=tcp"
		fi
	fi

	# Debug output
	echo "DEBUG: Using DB_USER=$DB_USER"
	echo "DEBUG: Using DB_PASS=$DB_PASS"
	echo "DEBUG: Using DB_NAME=$DB_NAME"
	echo "DEBUG: Using EXTRA=$EXTRA"
	
	# create database using MYSQL_PWD environment variable
	export MYSQL_PWD=$DB_PASS
	echo "Trying to access MySQL with user $DB_USER"
	
	# First check if we can connect
	if ! mysql --user="$DB_USER"$EXTRA -e "SELECT 1"; then
		echo "Error: Cannot connect to MySQL. Please check your credentials and connection."
		if [ "${GITHUB_ACTIONS}" = "true" ]; then
			echo "In GitHub Actions, ensuring the database exists:"
			mysql -uroot -ppassword -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
			mysql -uroot -ppassword -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
			mysql -uroot -ppassword -e "FLUSH PRIVILEGES;"
		else
			exit 1
		fi
	fi
	
	# Now create the database
	mysql --user="$DB_USER"$EXTRA -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`"
	mysql_status=$?
	if [ $mysql_status -ne 0 ]; then
		echo "Failed to create database with status $mysql_status"
		exit 1
	fi
	
	unset MYSQL_PWD
}

install_wp
install_test_suite
install_db 