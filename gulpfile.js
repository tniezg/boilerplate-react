/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-07 23:06:18
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-11-07 23:10:39
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
var browserifyInc = require('browserify-incremental');
var _ = require('lodash');
var sfx = require("sfx");
var sprity = require('sprity');
var gulpif = require('gulp-if');
var batch = require('gulp-batch');
var bust = require('gulp-buster');
var rename = require('gulp-rename');
var template = require('gulp-template');
var chokidar = require('chokidar');
var batchServerReload;

var serverStartPromise;
var serverProcess;
var sourcePath = 'source';
var distPath = 'deploy';
var serverReadyTouchPath = './deploy/on-server-ready';
var serverEntryFileName = 'server.js';
var rawSourceFilesToDeploy = [
  sourcePath + '/**/*',
  '!' + sourcePath + '/{scripts,scripts/**}',// process all js files using Babel
  '!' + sourcePath + '/public/{scripts,scripts/**}',// these files will go through babel and browserify, so ignore here
  '!' + sourcePath + '/public/{styles,styles/**}',// ignore scss files, they'll be processed to css
  '!' + sourcePath + '/.gitignore',// file not needed in deploy
  '!' + sourcePath + '/{react-components,react-components/**}',
  '!' + sourcePath + '/public/graphics/{sprites,sprites/**}',// ignore because sprites
  '!' + sourcePath + '/{views,views/**}'
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
var temporaryCacheBustingHashesPath = gulpTemporaryFilesPath + '/bust/';
var temporaryCacheBustingHashesFilename = 'bust.json';
var sourceSpriteStylePath = temporarySpriteSassPath;
var sourceGraphicsSpritesDefinitionFile = '_sprity-definition.scss';
var spritesSourceFilesToDeploy = sourcePath + '/public/graphics/sprites/**/*.{png,jpg}';
var spritesImagesUrlPath = '/graphics/sprites';
var reloadSoundPath = 'alert-2.wav';
var errorSoundPath = 'alert-1.wav';
var cacheBustingTemplateFilesSource = sourcePath + '/views/**/*.{handlebars,html}';
var cacheBustingTemplateFilesDeploy = distPath + '/views/';

var bustConfig = {
  fileName: temporaryCacheBustingHashesFilename,
  algo: function(vinylFile){
    var relativeFilePath = path.relative(vinylFile.cwd, vinylFile.path);
    var busters = JSON.parse(fs.readFileSync(
      temporaryCacheBustingHashesPath + temporaryCacheBustingHashesFilename, 
      "utf8"
    ));
    var bust = busters[relativeFilePath];
    var oldFilePath;

    if(typeof bust !== 'undefined'){
      oldFilePath = path.dirname(relativeFilePath) + '/' + 
        path.basename(relativeFilePath, path.extname(relativeFilePath)) + '-' + 
        bust + path.extname(relativeFilePath);

      del(oldFilePath);
    }

    return require("crypto")
      .createHash("md5")
      .update(vinylFile.contents)
      .digest("hex");
  }
};

// creates bust file so it always exists and is empty on every gulp task start
try{
  fs.statSync(temporaryCacheBustingHashesPath);
}catch(err){

  if(err && err.code == 'ENOENT'){
    var mkdirp = require('mkdirp');

    mkdirp.sync(temporaryCacheBustingHashesPath);
  }
}

fs.writeFileSync(temporaryCacheBustingHashesPath + temporaryCacheBustingHashesFilename, '{}');

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

function openSite(){
  var uri;
  var configuration = determineConfiguration();

  logger.log('should open default browser? ' + (configuration.openBrowser?'yes':'no'));

  if(configuration.openBrowser === true){
    uri = 'http://' + configuration.host + ':' + configuration.port;

    return gulp.src(__filename).pipe(open({uri:uri}));
  }else{
    return null;
  }
}






///////////////////////////////////////////////////////////////////////////
serverStartPromise = null;// crude solution
function serverStart(){
  var defer;
  var childProcess;

  if(serverStartPromise){
    return serverStartPromise;
  }else{
    defer = Q.defer();

    logger.log('starting node server', {
      color: 'red'
    });

    childProcess = childP.fork(serverEntryFileName, {cwd: distPath});

    childProcess.on('message', function(message) {

      if(message === 'online'){
        logger.log('server ready to accept calls, using livereload to reload page');

        serverStartPromise = null;

        livereload.reload();

        defer.resolve(childProcess);
      }
    });

    childProcess.on('close', function (code, signal) {
      logger.log('child process exited with code ' + code + ' and signal '+signal, {color: 'red'});

      serverStartPromise = null;

      defer.reject();
    });

    serverStartPromise = defer.promise;

    return defer.promise;
  }
}

function serverStop(process){
  var defer = Q.defer();

  logger.log('stopping server', {color: 'red'});

  process.on('close', function (code, signal) {
    logger.log('server stopped', {color: 'red'});

    defer.resolve();
  });

  process.kill('SIGINT');

  return defer.promise;
}

function serverReloadBatch(events, unlockCallback){
  logger.log('\n┬─┐┌─┐┬  ┌─┐┌─┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌─┐┬─┐┬  ┬┌─┐┬─┐\n├┬┘├┤ │  │ │├─┤ │││││││ ┬  └─┐├┤ ├┬┘└┐┌┘├┤ ├┬┘\n┴└─└─┘┴─┘└─┘┴ ┴─┴┘┴┘└┘└─┘  └─┘└─┘┴└─ └┘ └─┘┴└─', {color: 'red'});

  if(serverProcess !== null){
    return serverStop(serverProcess)
      .then(function(){
        serverProcess = null;

        return serverStart();
      }, function(){
        serverProcess = null;

        return serverStart();
      })
      .then(function(process){
        serverProcess = process;

        logger.log('server reloaded', {color: 'red'});
      })
      .then(playReloadSound, playReloadSound)
      .then(unlockCallback, unlockCallback);
  }else{
    return serverStart()
      .then(function(process){
        serverProcess = process;

        logger.log('server reloaded', {color: 'red'});
      })
      .then(playReloadSound, playReloadSound)
      .then(unlockCallback, unlockCallback);
  }
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
    .pipe(gulp.dest(cssDestinationDirectory))
    .pipe(bust(bustConfig))
    .pipe(gulp.dest(temporaryCacheBustingHashesPath));
}

function buildSprites(cb){
  var glob = require('glob');
  var foundSpriteSourceFiles = glob.sync(sourceGraphicsSpritesPath + '/**/*.{png,jpg}');

  if(!foundSpriteSourceFiles.length){
    //Skip sprite generation as there are not sprite source images.
    cb();
  }else{

    return sprity.src({
      src: sourceGraphicsSpritesPath + '/**/*.{png,jpg}',
      style: sourceGraphicsSpritesDefinitionFile,
      prefix: 'sprite',
      cssPath: spritesImagesUrlPath,
      processor: 'sass',
      dimension: [{
        ratio: 1, dpi: 120
      }, {
        ratio: 2, dpi: 160
      }, {
        ratio: 3, dpi: 240
      }]
    })
    .pipe(gulpif('*.png', gulp.dest(spritesDeployPath), gulp.dest(sourceSpriteStylePath)));
  }
}

function buildFrontScripts(){
  var browserifyInstance = browserify(
    browserifySourceScriptEntry, 
    _.assign({}, browserifyInc.args, {debug: true})
  );

  browserifyInc(browserifyInstance, {cacheFile: gulpTemporaryFilesPath + '/browserify-cache.json'});

  return browserifyInstance
    .transform(babelify)
    .transform(browserifyShim)
    .bundle()
    .on('error', swallowError)
    .pipe(exorcist(browserifySourceMapPath, browserifySourceMapUrl))
    .pipe(source(browserifyDeployScriptFileName))
    .pipe(buffer())
    .pipe(gulp.dest(browserifyDeployScriptPath))
    .pipe(bust(bustConfig))
    .pipe(gulp.dest(temporaryCacheBustingHashesPath));
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


function addBustingKeysToHtml(){
  var busters = JSON.parse(fs.readFileSync(
    temporaryCacheBustingHashesPath + '/' + temporaryCacheBustingHashesFilename, 
    "utf8"
  ));

  return gulp.src(cacheBustingTemplateFilesSource)
    .pipe(template({busters: busters}))
    .pipe(gulp.dest(cacheBustingTemplateFilesDeploy));
}

function performCacheBusting(done){
  var busters = JSON.parse(fs.readFileSync(
    temporaryCacheBustingHashesPath + '/' + temporaryCacheBustingHashesFilename, 
    "utf8"
  ));
  var busterKeyPath;
  var parallelStreams = [];
  var renamer;

  function createRenamer(fullPath, bust){

    return function createRenamerStream(done){
      logger.log('renaming ' + fullPath);

      return gulp.src(fullPath)
        .on('error', swallowError)
        .pipe(rename(function(renamePath){
          var bustedName = path.basename(fullPath, path.extname(fullPath)) + '-' + bust;

          renamePath.dirname = path.dirname(fullPath);
          renamePath.basename = bustedName;
        }))
        .pipe(gulp.dest('.'));
    };
  }

  for(busterKeyPath in busters){
    logger.log('busting ' + busterKeyPath);
    renamer = createRenamer(busterKeyPath, busters[busterKeyPath]);
    parallelStreams.push(renamer);
  }

  // for some reason, gulp.parallel(parallelStreams) combined with del(..) 
  // inside a gulp.series didn't complete, so they were both flattened into
  // gulp.series. not a huge issue but I should figure out why it fails (
  // I'm getting a gulp#4 timeout even though all streams/callbacks work).

  gulp.series.apply(gulp, parallelStreams.concat(function(done){
    del(Object.keys(busters), done);
  }))(done);
}

function reloadStyles(){
  return gulp.src([
      cssDestinationDirectory + '**/*',
      cacheBustingTemplateFilesDeploy
    ])
    .pipe(livereload());
}

function reloadBrowserifyScripts(){
  return gulp.src([
      browserifyDeployScriptPath + browserifyDeployScriptFileName, 
      cacheBustingTemplateFilesDeploy
    ])
    .pipe(livereload());
}

gulp.task('play-error-sound', function(cb){
  playErrorSound();
  cb();
});

gulp.task('sound-check', function(){
  return playReloadSound()
    .then(playErrorSound);
});

/**
 * Task runs everything needed to create a full deployment inside the deployment
 * directory at the start of deployment. During development, use watchers to
 * optimise processing speed.
 */
gulp.task('deploy', gulp.series(
  removeDeploy,
  gulp.parallel(
    copyOverToDeploy,
    gulp.series(
      buildSprites,
      buildStyles,
      gulp.series([/*performCacheBusting, */addBustingKeysToHtml])
    ),
    gulp.series(
      buildServerSideScripts//,
      // buildFrontScripts,
      // gulp.series([performCacheBusting, addBustingKeysToHtml])
    )
  )
));

serverProcess = null;
gulp.task('serve', function(next){

  serverStart()
    .then(function(process){
      var rawCopyWatcher;
      var stylesWatcher;
      var browserifyScriptsWatcher;
      var componentsWatcher;
      var serverScriptsWatcher;
      var spriteWatcher;
      var batchServerScripts;
      var batchBrowserifyScripts;

      function batchTasks(tasks){
        return batch({timeout: 300}, function(events, cb){
          tasks(cb);
        });
      }

      serverProcess = process;

      livereload.listen();

      rawCopyWatcher = chokidar.watch(rawSourceFilesToDeploy, {ignoreInitial: true});
      rawCopyWatcher.on('all', onRawChange);

      logger.log('watching raw files in source');

      spriteWatcher = chokidar.watch(spritesSourceFilesToDeploy, {ignoreInitial: true});
      spriteWatcher.on('all', batchTasks(gulp.series(
        buildSprites, 
        buildStyles,
        gulp.series([/*performCacheBusting, */addBustingKeysToHtml]),
        reloadStyles,
        playReloadSound
      )));

      logger.log('watching sprite files in source');

      stylesWatcher = chokidar.watch(stylesSourceFilesToDeploy, {ignoreInitial: true});
      stylesWatcher.on('all', batchTasks(gulp.series(
        buildStyles,
        gulp.series([/*performCacheBusting, */addBustingKeysToHtml]),
        reloadStyles,
        playReloadSound
      )));
      
      logger.log('watching style files in source');

      serverScriptsWatcher = chokidar.watch(serverScriptsSourceFilesToDeploy, {ignoreInitial: true});
      batchServerScripts = batchTasks(gulp.series(
        buildServerSideScripts,
        // buildFrontScripts,
        // gulp.series([performCacheBusting, addBustingKeysToHtml]),
        function(cb){
          serverReload();//usually, the server doesn't need to be reloaded but here it does
          cb();
        }
      ));
      serverScriptsWatcher.on('all', function(eventType, relativePath){
        syncRemovedFilesInDeploy(eventType, relativePath);

        batchServerScripts();
      });


      logger.log('watching server scripts');

      browserifyScriptsWatcher = chokidar.watch(browserifyScriptsSourceFilesToDeploy, {ignoreInitial: true});
      batchBrowserifyScripts = batchTasks(gulp.series(
        // buildFrontScripts, 
        // gulp.series([performCacheBusting, addBustingKeysToHtml]),
        // reloadBrowserifyScripts,
        // playReloadSound
        function(cb){
          serverReload();
          cb();
        }
      ));
      browserifyScriptsWatcher.on('all', function(eventType, relativePath){
        syncRemovedFilesInDeploy(eventType, relativePath);

        batchBrowserifyScripts();
      });

      logger.log('watching front-end-only scripts files in source');

      return openSite();
    }, function(){
      throw new Error('cannot spawn server');
    });

  next();
});

gulp.task('default', gulp.series('deploy', 'serve'));