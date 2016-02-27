# @Author: Tomasz Niezgoda
# @Date:   2016-02-25 19:02:32
# @Last Modified by:   Tomasz Niezgoda
# @Last Modified time: 2016-02-25 20:28:23

print () {
  echo "\033[40;38;5;82m$1\033[0m";
}

underline () {
  echo "\033[4m$1\033[24m"
}

print "Welcome to Boilerplate React!

Please hang tight while all the libraries are getting downloaded and setup for your operating system..."

sleep 3

print "Installing development libraries..."

npm install

print "Installing runtime libraries..."
cd source
npm install
cd ..

DIR_OF_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEFAULT_CONFIGURATION_FILE="configuration.example.js"

print "All done! You can now run `underline "export CONFIGURATION_FILE_PATH=\\"$DIR_OF_SCRIPT/$DEFAULT_CONFIGURATION_FILE\\""` then launch the development environment by running `underline "npm start"`, it will build the initial version of the project in `underline "/deploy"` and launch ExpressJS at `underline "localhost:3000"` by default. During development use npm inside `underline "/source"`."