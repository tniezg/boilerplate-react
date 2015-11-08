# React boilerplate

## While React is relatively easy to setup, especially due to react-router-assembly, quite a bit of processing needs to be done before files run, in this case by Gulp.

## Configuration file example is located at /configuration.example.js. Adjust it to the server configuration and place in a safe place, where it won't be deleted between deployments. The path to this module needs to be provided in the environment variable called `CONFIGURATION_FILE_PATH`. This file is required for Gulp, as Gulp runs Express, and Express directly.