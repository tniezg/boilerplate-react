/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-07 23:06:18
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2016-02-28 12:52:43
 */

'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');
var logger = require('plain-logger')('gulpfile', 'green');
var Q = require('q');
var newer = require('gulp-newer');
var babel = require('gulp-babel');
var babelify = require('babelify');
var browserify = require('browserify');
var browserifyShim = require('browserify-shim');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var exorcist = require('exorcist');
var path = require('path');
var childP = require('child_process');
var exec = childP.exec;
var livereload = require('gulp-livereload');
var fs = require('fs');
var determineConfiguration = require('determine-configuration');
var open = require('gulp-open');
var cache = require('gulp-cached');
var _ = require('lodash');
var sfx = require("sfx");
var gulpif = require('gulp-if');
var batch = require('gulp-batch');
var bust = require('gulp-buster');
var rename = require('gulp-rename');
var chokidar = require('chokidar');
var assembly = require('react-router-assembly');
var batchServerReload;
var stream = require('stream');

var sourcePath = 'source';
var distPath = 'deploy';
var serverEntryFilePath = './deploy/server.js';
var rawSourceFilesToDeploy = [
  sourcePath + '/**/*',
  '!' + sourcePath + '/{scripts,scripts/**}',// process all js files using Babel
  '!' + sourcePath + '/public/{scripts,scripts/**}',// these files will go through babel and browserify, so ignore here
  '!' + sourcePath + '/public/{styles,styles/**}',// ignore scss files, they'll be processed to css
  '!' + sourcePath + '/.gitignore',// file not needed in deploy
  '!' + sourcePath + '/{react-components,react-components/**}',
  '!' + sourcePath + '/public/graphics/{sprites,sprites/**}'// ignore because sprites
];
var nodeModulesToDeploy = sourcePath + '/node_modules/*';
var stylesSourceFilesToDeploy = sourcePath + '/public/styles/**/*';
var browserifyScriptsSourceFilesToDeploy = sourcePath + '/public/scripts/**/*.js';
var serverScriptsSourceFilesToDeploy = sourcePath + '/scripts/**/*.js';
var sassEntryFile = sourcePath + '/public/styles/*.scss';
var cssDestinationDirectory = distPath + '/public/styles/';
var browserifySourceScriptEntry = sourcePath + '/public/scripts/main.js';
var browserifyDeployScriptPath = distPath + '/public/scripts/';
var browserifyDeployScriptFileName = 'main.js';
var serverSourceFiles = sourcePath + '/scripts/**/*.js';
var serverScriptsDeployPath = distPath + '/scripts/';
var browserifySourceMapPath = path.join(__dirname, distPath, '/public/main.js.map');
var browserifySourceMapUrl = '/main.js.map';
var sourceGraphicsSpritesPath = sourcePath + '/public/graphics/sprites';
var spritesDeployPath = 'deploy/public/graphics/sprites';
var gulpTemporaryFilesPath = '.gulp-temp';
var temporarySpriteSassPath = gulpTemporaryFilesPath + '/scss';
var sourceGraphicsSpritesDefinitionFile = '_sprity-definition.scss';
var spritesSourceFilesToDeploy = sourcePath + '/public/graphics/sprites/**/*.{png,jpg}';
var spritesImagesUrlPath = '/graphics/sprites';
var reloadSoundPath = 'alert-2.wav';
var errorSoundPath = 'alert-1.wav';
var busts = {};
var cancellableReloadTimeout = null;

function swallowError (error) {
  // If you want details of the error in the console
  logger.log(error.toString());

  playErrorSound();

  // emitting end allows gulp to continue working
  this.emit('end');
}

function playErrorSound(){
  return Q.nbind(sfx.play, sfx)(errorSoundPath, 50);
}

function tryOpenSite(){
  var configuration = determineConfiguration();
  var open = configuration.gulp.openBrowser;

  logger.log('should open default browser? ' + (open?'yes':'no'));

  if(open === true){
    openSite();
  }

  return null;
}

function openSite(){
  var uri;
  var configuration = determineConfiguration();

  uri = 'http://' + configuration.host + ':' + configuration.port;

  gulp.src(__filename).pipe(open({uri:uri}));
}






///////////////////////////////////////////////////////////////////////////
var serverStartPromise = null;// crude solution
var serverStopPromise = null;
var serverInstance = null;

function serverStart(){

  if(serverStartPromise){

    return serverStartPromise;
  }else{
    var serverCreator = require('server-creator');
    var startDefer = Q.defer();

    serverStartPromise = startDefer;

    serverInstance = serverCreator.create({
      path: serverEntryFilePath,
      cwd: distPath,
      onOnline: function(instance){
        logger.log('server is ready to accept calls', {color: 'red'});

        livereload.reload();

        serverStartPromise = null;
        startDefer.resolve();
      },
      onOffline: function(){
        logger.log('server stopped', {color: 'red'});

        var stopDefer = serverStopPromise;

        serverStartPromise = null;
        serverInstance = null;
        serverStopPromise = null;

        //if there is something wrong with the server, startDefer.resolve won't 
        //happen and later stopDefer won't be assigned. if startDefer.resolve 
        //DOES happen, startDefer.reject() command will do nothing which is fine.
        if(stopDefer){
          stopDefer.resolve();
        }
        startDefer.reject();
      }
    });

    return startDefer.promise;
  }
}

function serverStop(){
  logger.log('stopping server', {color: 'red'});

  if(serverStopPromise){
    return serverStopPromise;
  }else{
    var defer = Q.defer();

    if(serverInstance){
      serverStopPromise = defer;
      serverInstance.destroy();
    }else{
      //do not assign to serverStopPromise, as serverStopPromise won't be set 
      //to null later (it's immediately null)
      defer.resolve();
    }

    return defer.promise;
  }
}

function serverReloadBatch(events, unlockCallback){
  logger.log('\n┬─┐┌─┐┬  ┌─┐┌─┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌─┐┬─┐┬  ┬┌─┐┬─┐\n├┬┘├┤ │  │ │├─┤ │││││││ ┬  └─┐├┤ ├┬┘└┐┌┘├┤ ├┬┘\n┴└─└─┘┴─┘└─┘┴ ┴─┴┘┴┘└┘└─┘  └─┘└─┘┴└─ └┘ └─┘┴└─', {color: 'red'});

  return serverStop()
    .then(function(){
      return serverStart();
    })
    .then(function(){
      logger.log('server reloaded', {color: 'red'});
    })
    .then(playReloadSound, playReloadSound)
    .then(unlockCallback, unlockCallback);
}

batchServerReload = batch({timeout: 500}, serverReloadBatch);

function serverReload(){
  batchServerReload();
}

function onRawChange(eventType, relativePath){
  var processedTargetPath;

  processedTargetPath = path.join(
    distPath, 
    path.relative(path.join(__dirname, sourcePath), relativePath)
  );

  logger.log('raw file, relativePath = ' + relativePath +', eventType = ' + 
    eventType + ', processedTargetPath = ' + processedTargetPath + 
    ', event = ' + eventType);

  if(eventType === 'unlink' || eventType === 'unlinkDir'){
    del(processedTargetPath);
  }else if(eventType === 'add' || eventType === 'change'){
    fs.writeFileSync(processedTargetPath, fs.readFileSync(relativePath));
  }else if(eventType === 'addDir'){
    fs.mkdirSync(processedTargetPath);
  }
  
  serverReload();
}

/**
 * Basically copy of onRawChange, consider combining.
 */
function syncRemovedFilesInDeploy(eventType, relativePath){
  var processedTargetPath;

  logger.log('browserify script or server script file changed, checking if removed');

  if(eventType === 'unlink' || eventType === 'unlinkDir'){
    processedTargetPath = path.join(
      distPath, 
      path.relative(path.join(__dirname, sourcePath), relativePath)
    );

    del(processedTargetPath);
  }
}

function generateUUID(){
  var uuid = require('uuid');

  return uuid.v1();
}

function bustAndRename(uuid, bustsObject, basePathSource, basePathDest){
  return function(parsedPath){
    var originalPath;
    var newPath;
    
    originalPath = path.join(parsedPath.dirname, parsedPath.basename + parsedPath.extname);
    parsedPath.basename += '.' + uuid;
    newPath = path.join(parsedPath.dirname, parsedPath.basename + parsedPath.extname);
    bustsObject[path.join(basePathSource, originalPath)] = path.join(basePathDest, newPath);
  };
}

function buildStyles(){

  return gulp.src(sassEntryFile)
    .pipe(sass({
      includePaths: [temporarySpriteSassPath]
    }))
    .on('error', swallowError)
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(rename(bustAndRename(
      generateUUID(), 
      busts,
      'public/styles',
      'public/styles'
    )))
    .pipe(gulp.dest(cssDestinationDirectory))
}

function buildSprites(cb){
  var glob = require('glob');
  var foundSpriteSourceFiles = glob.sync(sourceGraphicsSpritesPath + '/**/*.{png,jpg}');

  if(!foundSpriteSourceFiles.length){
    //Skip sprite generation as there are not sprite source images.
    cb();
  }else{
    var spritesmith = require('gulp.spritesmith');
    var spriteData = gulp.src(sourceGraphicsSpritesPath + '/**/*.{png,jpg}').pipe(spritesmith({
      padding: 5,
      imgName: 'sprite.png',
      cssName: 'sprite-style.scss'
    }));

    var imagemin = require('gulp-imagemin');
    var merge = require('merge-stream');

    var imgStream = spriteData.img
      .pipe(buffer())
      .pipe(imagemin())
      .pipe(gulp.dest(spritesDeployPath));

    var cssStream = spriteData.css
      .pipe(gulp.dest(temporarySpriteSassPath));

    return merge(imgStream, cssStream);
  }
}

function buildFrontScripts(cb){
  assembly.build({
    cwd: 'deploy',
    clientPropsPath: './scripts/routing/clientProps',
    routesElementPath: './scripts/routing/routes',
    isomorphicLogicPath: './scripts/routing/isomorphicLogic',
    extraCompress: process.env.NODE_ENV,
    mode: assembly.modes.BUILD,//currently, only WATCH is not available
    publicGeneratedFilesDirectory: '../' + gulpTemporaryFilesPath + '/.react-router-assembly',
    onUpdate: function(){

      var stream = gulp.src(gulpTemporaryFilesPath + '/.react-router-assembly' + '/scripts/main.generated.js')
        .pipe(rename(bustAndRename(
          generateUUID(), 
          busts,
          'scripts/.react-router-assembly' + '/scripts',
          'scripts'
        )))
        .pipe(gulp.dest(distPath + '/scripts/.react-router-assembly' + '/scripts'));
        // should generate in temporary folder and rename to deploy
      stream.on('finish', cb);
    }
  });
}

function playReloadSound(){
  return Q.nbind(sfx.play, sfx)(reloadSoundPath, 50);
}

function copyOverToDeploy(){
  return gulp.src(rawSourceFilesToDeploy, {dot: true, follow: true})
    .pipe(newer(distPath))
    .pipe(gulp.dest(distPath));
}

/**
 * Simply removes all files inside deploy
 */
function removeDeploy(cb){
  del(distPath, cb);
}

/**
 * Builds everything inside /scripts, without server.js
 */
function buildServerSideScripts(){
  return gulp.src(serverSourceFiles)
    .pipe(cache('server-scripts'))
    .pipe(sourcemaps.init())
    .on('error', swallowError)
    .pipe(babel())
    .pipe(sourcemaps.write('.', {sourceRoot: path.join(__dirname, sourcePath)}))
    .pipe(gulp.dest(serverScriptsDeployPath));
}

function readJsonSync(pathToFile){
  return JSON.parse(fs.readFileSync(
    pathToFile,
    "utf8"
  ))
}

function reloadStyles(cb){
  serverReload();

  cb();
}

gulp.task('play-error-sound', function(cb){
  playErrorSound();
  cb();
});

gulp.task('sound-check', function(){
  return playReloadSound()
    .then(playErrorSound);
});

function updateBustsFile(cb){
  var bustsStream = new stream.Readable();

  bustsStream._read = function noop() {}; // redundant? see update below
  bustsStream.push(JSON.stringify(busts));
  bustsStream.push(null);

  bustsStream
    .pipe(source('.busters.json'))
    .pipe(gulp.dest(serverScriptsDeployPath))
    .on('finish', cb);

  logger.log('busts: ' + JSON.stringify(busts));
}

/**
 * Task runs everything needed to create a full deployment inside the deployment
 * directory at the start of deployment. During development, use watchers to
 * optimise processing speed.
 */
gulp.task('deploy', gulp.series(
  removeDeploy,
  copyOverToDeploy,
  gulp.parallel(
    gulp.series(
      buildSprites,
      buildStyles
    ),
    gulp.series(
      buildServerSideScripts,
      buildFrontScripts
    )
  ),
  updateBustsFile
));

function cancellableServerReload(){
  cancellableReloadTimeout = setTimeout(serverReload, 1000);
}

function cancelServerReload(){
  clearTimeout(cancellableReloadTimeout);
}

gulp.task('serve', function(next){

  serverStart()
    .then(function(){
      var rawCopyWatcher;
      var stylesWatcher;
      var componentsWatcher;
      var serverScriptsWatcher;
      var spriteWatcher;
      var batchServerScripts;

      function batchTasks(tasks){
        return batch({timeout: 300}, function(events, cb){
          tasks(cb);
        });
      }

      livereload.listen();

      rawCopyWatcher = chokidar.watch(rawSourceFilesToDeploy, {ignoreInitial: true});
      rawCopyWatcher.on('all', onRawChange);

      logger.log('watching raw files in source');

      spriteWatcher = chokidar.watch(spritesSourceFilesToDeploy, {ignoreInitial: true});
      spriteWatcher.on('all', batchTasks(gulp.series(
        buildSprites, 
        buildStyles,
        updateBustsFile,
        reloadStyles,
        playReloadSound
      )));

      logger.log('watching sprite files in source');

      stylesWatcher = chokidar.watch(stylesSourceFilesToDeploy, {ignoreInitial: true});
      stylesWatcher.on('all', batchTasks(gulp.series(
        buildStyles,
        updateBustsFile,
        reloadStyles,
        playReloadSound
      )));
      
      logger.log('watching style files in source');

      batchServerScripts = batchTasks(gulp.series(
        buildServerSideScripts,
        function(cb){
          cancellableServerReload();
          cb();
        }
      ));
      serverScriptsWatcher = chokidar.watch(serverScriptsSourceFilesToDeploy, {ignoreInitial: true});
      serverScriptsWatcher.on('all', function(eventType, relativePath){
        syncRemovedFilesInDeploy(eventType, relativePath);

        batchServerScripts();
      });


      logger.log('watching server scripts');

      assembly.build({
        cwd: 'deploy',
        clientPropsPath: './scripts/routing/clientProps',
        routesElementPath: './scripts/routing/routes',
        isomorphicLogicPath: './scripts/routing/isomorphicLogic',
        extraCompress: process.env.NODE_ENV,
        mode: assembly.modes.BUILD_AND_WATCH,//currently, only WATCH is not available
        publicGeneratedFilesDirectory: '../' + gulpTemporaryFilesPath + '/.react-router-assembly',
        onChange: function(){
          logger.log('cancelling delayed server reload due to front-end ' + 
            'changes after back-end (reloading after front-end gets updated ' + 
            'instead of twice)', {color: 'yellow'});
          cancelServerReload();
        },
        onUpdate: function(){
          var stream;

          logger.log('cache busting files using rename');

          stream = gulp.src(gulpTemporaryFilesPath + '/.react-router-assembly' + '/scripts/main.generated.js')
            .pipe(rename(bustAndRename(
              generateUUID(), 
              busts, 
              'scripts/.react-router-assembly' + '/scripts',
              'scripts'
            )))
            .pipe(gulp.dest(distPath + '/scripts/.react-router-assembly' + '/scripts'));
            // should generate in temporary folder and rename to deploy
          
          stream.on('finish', function(){
            updateBustsFile(function(){
              serverReload();
            })
          });
        }
      });

      return tryOpenSite();
    }, function(){
      throw new Error('cannot spawn server');
    });

  next();
});

gulp.task('browser', function(next){
  openSite();
  next();
});

gulp.task('default', gulp.series('deploy', 'serve'));