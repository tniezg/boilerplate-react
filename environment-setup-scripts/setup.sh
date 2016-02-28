#/bin/bash

DIR_OF_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAIN_PROJECT_DIR="$DIR_OF_SCRIPT/.."

. "$DIR_OF_SCRIPT/_util.sh"

print "Welcome to Boilerplate React!
Please hang tight while all the libraries are getting downloaded and setup for your operating system..."

sleep 3

print "Installing development libraries..."

cd "$MAIN_PROJECT_DIR"

npm install

print "Installing runtime libraries..."

cd "$MAIN_PROJECT_DIR/source"

npm install

print "All done! You can now launch the development environment by running `underline "npm start"`, it will build the initial version of the project in `underline "/deploy"` and launch ExpressJS at `underline "localhost:3000"` by default. During development use npm inside `underline "/source"`."