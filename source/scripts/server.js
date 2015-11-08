/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-07 23:21:37
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-11-08 00:33:59
 */
'use strict';

let logger = require('plain-logger')('server');
let determineConfiguration = require('determine-configuration');
let isChildProcess = !!process.send;
let configuration;

logger.log('isChildProcess? ' + (isChildProcess?'true':'false'));

require('source-map-support').install();

configuration = determineConfiguration();

function listenToShutdownMessageIfChild(){

  if(isChildProcess){
    process.on('message', function(message) {
      logger.log('server shutdown');

      if (message === 'shutdown') {
        process.exit(1);
      }
    });
  }
}

function launchApp(app, port, host, afterLaunch){
  let server = app.listen(port, host, function () {
    let host = server.address().address;
    let port = server.address().port;

    logger.log('listening at http://' + host + ':' + port);

    afterLaunch();
  });
}

function addErrorRoute(app){
  // this route is not specific to react but useful
  app.use(function(error, request, response, next) {
    console.error(error.stack);
    response.status(500);
    response.render('server-error.handlebars', {
      error: error
    });
  });
}

function sendOnlineMessageIfChild(){

  if(isChildProcess){
    process.send('online');
  }
}

function setupRest(app, port, host){
    addErrorRoute(app);

    launchApp(app, port, host, function(){
      sendOnlineMessageIfChild();
    });
  }

if(configuration === null){
  throw new Error(
    'CONFIGURATION_FILE_PATH system variable pointing to module' + 
    ' (\'require\' used) with server configuration needs to be setup before' + 
    ' running the server';
  );
}else{
  let serverLogger;
  let express;
  let app;
  let exphbs;
  let assembleReact;
  let serverPropsGenerator;

  listenToShutdownMessageIfChild();

  serverLogger = require('morgan');
  express = require('express');
  app = express();
  exphbs  = require('express-handlebars');

  // views and templates setup
  app.set('views', __dirname + '/../views');
  app.engine('handlebars', exphbs());
  app.set('view engine', 'handlebars');

  app.use(serverLogger('server.js'));
  app.use(express.static('public'));

  assembleReact = require('react-router-assembly');

  serverPropsGenerator = require('./routing/serverPropsGenerator');

  assembleReact({
    app: app,
    doneCallback: setupRest.bind(null, app, configuration.port, configuration.host),
    routesElementPath: __dirname + '/routing/routes',
    serverPropsGenerator: serverPropsGenerator,
    templatePath: __dirname + '/../views/react-page.handlebars',
    isomorphicLogicPath: __dirname + '/routing/isomorphicLogic',
    clientPropsPath: __dirname + '/routing/clientProps',
    compressFrontScript: configuration.compressFrontScript,
    additionalTemplateProps: {
      pageTitle: 'got to code'
    }
  });
}
