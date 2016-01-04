/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-07 23:21:37
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-12-21 14:57:32
 */
'use strict';

let logger = require('plain-logger')('server');
let determineConfiguration = require('determine-configuration');
let isChildProcess = !!process.send;
let configuration;

logger.log('isChildProcess? ' + (isChildProcess?'true':'false'));

require('source-map-support').install();

configuration = determineConfiguration();

// function launchApp(app, port, host, afterLaunch){
//   let server = app.listen(port, host, function () {
//     let host = server.address().address;
//     let port = server.address().port;

//     logger.log('listening at http://' + host + ':' + port);

//     afterLaunch();
//   });
// }

// function addErrorRoute(app){
//   // this route is not specific to react but useful
//   app.use(function(error, request, response, next) {
//     console.error(error.stack);
//     response.status(500);
//     response.render('server-error.handlebars', {
//       error: error
//     });
//   });
// }

// function setupRest(app, port, host){
//     addErrorRoute(app);

//     launchApp(app, port, host, function(){
//       sendOnlineMessageIfChild();
//     });
//   }

if(configuration === null){
  throw new Error(
    'CONFIGURATION_FILE_PATH system variable pointing to module' + 
    ' (\'require\' used) with server configuration needs to be setup before' + 
    ' running the server'
  );
}else{
  // let serverLogger;
  // let serverPropsGenerator;
  let express = require('express');
  let app = express();
  let assembly = require('react-router-assembly');
  let control = require('server-creator');

  let routesElementPath = './routing/routes';
  let isomorphicLogicPath = './routing/isomorphicLogic';

  function setupRest(){
    let exphbs;

    app.set('views', __dirname + '/views');
    exphbs = require('express-handlebars');
    app.engine('handlebars', exphbs());
    app.set('view engine', 'handlebars');

    app.use(express.static('public'));

    // this route is not specific to react but useful
    app.use(function(error, request, response, next) {
      console.error(error.stack);
      response.status(500);
      response.render('server-error.handlebars', {
        error: error
      });
    });

    let server = app.listen(3000, function () {
      let host = server.address().address;
      let port = server.address().port;

      console.log('Example app listening at http://%s:%s', host, port);

      control.serverReady(process);
    });
  }

  // serverLogger = require('morgan');
  // exphbs  = require('express-handlebars');

  // // views and templates setup
  // app.set('views', __dirname + '/../views');
  // app.engine('handlebars', exphbs());
  // app.set('view engine', 'handlebars');

  // app.use(serverLogger('dev'));
  // app.use(express.static('public'));

  assembly.attach({
    app: app,
    routesElementPath: routesElementPath,
    serverPropsGeneratorPath: './routing/serverPropsGenerator',
    isomorphicLogicPath: isomorphicLogicPath,

    onComplete: setupRest//,
    // templatePath: './views/react-page.handlebars',
    // additionalTemplateProps: {
    //   pageTitle: 'got to code'
    // }
  });
}