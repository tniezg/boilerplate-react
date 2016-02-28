#/bin/bash

print () {
  printf "\033[40;38;5;82m$1\033[0m\n"
}

underline () {
  printf "\033[4m$1\033[24m"
}

normalizePath() {
  NORMALIZED="`cd \"$1\"; pwd`"
  printf $NORMALIZED
}

environmentVariableExists() {

  if [ ${!1+x} ]; then
    return 0
  else
    return 1
  fi
}