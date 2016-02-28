/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-07 23:21:37
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2016-02-28 06:37:27
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
  let fs;
  let busts;

  app.use('/public', express.static('./public'));
  app.use('/scripts', express.static('./public'));

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

    // this route is not specific to react but useful
    app.use(function(error, request, response, next) {
      console.error(error.stack);
      response.status(500);
      response.render('server-error.handlebars', {
        error: error
      });
    });

    let server = app.listen(configuration.port, configuration.host, function () {
      let host = server.address().address;
      let port = server.address().port;

      console.log('Example app listening at http://%s:%s', host, port);

      control.serverReady(process);
    });
  }

  app.use('/public', express['static']('./public'));
  app.use('/scripts', express['static']('./public'));

  fs = require('fs');
  busts = JSON.parse(fs.readFileSync('scripts/.busters.json', 'utf8'));

  assembly.attach({
    app: app,
    routesElementPath: paths.routesElementPath,
    serverPropsGeneratorPath: paths.serverPropsGenerator,
    isomorphicLogicPath: paths.isomorphicLogicPath,
    publicGeneratedFilesDirectory: './scripts/.react-router-assembly',

    onComplete: setupRest,
    templatePath: './views/react-page.handlebars',
    additionalTemplateProps: {
      pageTitle: 'React Boilerplate Title',
      busters: {
        style: busts['public/styles/main.css'],
        logic: busts['scripts/.react-router-assembly/scripts/main.generated.js']
      }
    }
  });
}