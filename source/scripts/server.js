/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-07 23:21:37
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2016-01-05 14:26:10
 */
'use strict';

let logger = require('plain-logger')('server');
let determineConfiguration = require('determine-configuration');
let isChildProcess = !!process.send;
let configuration;

logger.log('isChildProcess? ' + (isChildProcess?'true':'false'));

require('source-map-support').install();

configuration = determineConfiguration();

if(configuration === null){
  throw new Error(
    'CONFIGURATION_FILE_PATH system variable pointing to module' + 
    ' (\'require\' used) with server configuration needs to be setup before' + 
    ' running the server'
  );
}else{
  let express = require('express');
  let app = express();
  let assembly = require('react-router-assembly');
  let control = require('server-creator');
  let routingModulesDirectory = './scripts';
  let paths = {
    routesElementPath: routingModulesDirectory + '/routing/routes',
    isomorphicLogicPath: routingModulesDirectory + '/routing/isomorphicLogic',
    serverPropsGeneratorPath: routingModulesDirectory + '/routing/serverPropsGenerator'
  };

  function setupRest(){
    let exphbs;
    let serverLogger;

    // Express requests logging
    serverLogger = require('morgan');
    app.use(serverLogger('dev'));

    // The following code is primarily for the error handling template
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

  assembly.attach({
    app: app,
    routesElementPath: paths.routesElementPath,
    serverPropsGeneratorPath: paths.serverPropsGenerator,
    isomorphicLogicPath: paths.isomorphicLogicPath,

    onComplete: setupRest,
    templatePath: './views/react-page.handlebars',
    additionalTemplateProps: {
      pageTitle: 'React Boilerplate Title'
    }
  });
}