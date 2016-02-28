#/bin/bash

DIR_OF_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEFAULT_CONFIGURATION_FILE_PATH=`"$DIR_OF_SCRIPT/_get-config-path.sh"`

. "$DIR_OF_SCRIPT/_util.sh"

if environmentVariableExists "CONFIGURATION_FILE_PATH"; then
  print "custom configuration file found, using (`underline CONFIGURATION_FILE_PATH=$CONFIGURATION_FILE_PATH`)"
else
  export CONFIGURATION_FILE_PATH="$DEFAULT_CONFIGURATION_FILE_PATH"
  print "no custom configuration file found, so default configuration path exported to local environment (`underline CONFIGURATION_FILE_PATH=$CONFIGURATION_FILE_PATH`)"
fi