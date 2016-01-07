# React boilerplate

## While React is relatively easy to setup, especially due to react-router-assembly, quite a bit of processing needs to be done before files run, in this case by Gulp.

## Configuration file example is located at /configuration.example.js. Adjust it to the server configuration and place in a safe place, where it won't be deleted between deployments. The path to this module needs to be provided in the environment variable called `CONFIGURATION_FILE_PATH`.

## Constituents
What React boilerplate does:

- compile SASS
- convert ES6 JavaScript including JSX to ES5
- merge image sprites into a single file to reduce the number of file downloads
- compress JavaScript on the front-end
- use react-router-assembly to simplify server and client side rendering for SEO and website opitimisations for users
- restart the server when developing but also allows the `/deploy` directory to be self-contained and ready for using in production