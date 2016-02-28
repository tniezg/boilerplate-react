#/bin/bash

DIR_OF_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEFAULT_CONFIGURATION_FILE="configuration.example.js"
CONFIGURATION_FILE_PATH="$DIR_OF_SCRIPT/.."

. "$DIR_OF_SCRIPT/_util.sh"

printf "`normalizePath \"$CONFIGURATION_FILE_PATH\"`/$DEFAULT_CONFIGURATION_FILE"