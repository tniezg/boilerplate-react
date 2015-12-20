/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-07 23:21:37
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-12-20 19:17:44
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
  // let express;
  // let app;
  // let exphbs;
  // let assemble;
  // let serverPropsGenerator;
  let serverCreator = require('server-creator');

  // listenToShutdownMessageIfChild();

  // serverLogger = require('morgan');
  // express = require('express');
  // app = express();
  // exphbs  = require('express-handlebars');

  // // views and templates setup
  // app.set('views', __dirname + '/../views');
  // app.engine('handlebars', exphbs());
  // app.set('view engine', 'handlebars');

  // app.use(serverLogger('dev'));
  // app.use(express.static('public'));

  // assembly = require('react-router-assembly');

  // serverPropsGenerator = require('./routing/serverPropsGenerator');

  // assembly.build({
  //   clientPropsPath: './routing/clientProps',
  //   routesElementPath: './routing/routes',
  //   isomorphicLogicPath: './routing/isomorphicLogic',
  //   extraCompress: process.env.NODE_ENV,
  //   templatePath: '../views/react-page.handlebars',
  //   mode: process.env.NODE_ENV === 'production'?assembly.modes.BUILD:assembly.modes.BUILD_AND_WATCH,
  //   onChange: function(){
  //     console.log('scripts changed');
  //   },
  //   onUpdate: function(attach){
  //     console.log('scripts updated');

  //     restartServer();
  //   }
  // });

  // assemble({
  //   app: app,
  //   doneCallback: setupRest.bind(null, app, configuration.port, configuration.host),
  //   routesElementPath: __dirname + '/routing/routes',
  //   serverPropsGenerator: serverPropsGenerator,
  //   templatePath: __dirname + '/../views/react-page.handlebars',
            //   isomorphicLogicPath: __dirname + '/routing/isomorphicLogic',
  //   clientPropsPath: __dirname + '/routing/clientProps',
  //   compressFrontScript: configuration.compressFrontScript,
  //   additionalTemplateProps: {
  //     pageTitle: 'got to code'
  //   }
  // });
  // 
 
  serverCreator.serverReady(process);
}