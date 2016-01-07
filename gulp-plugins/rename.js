// /* 
//  * @Author: Tomasz Niezgoda
//  * @Date: 2016-01-06 23:19:15
//  * @Last Modified by: Tomasz Niezgoda
//  * @Last Modified time: 2016-01-07 00:31:25
//  */
// 'use strict';

// var PLUGIN_NAME = 'gulp-rename-cache';

// var through = require('through2');
// // var rename = require('gulp-rename');uninstall from --save-dev!
// var uuid = require('uuid');
// var Path = require('path');

// module.exports = function(customOptions) {
//   // create a single UUID for all files going through
//   var newUuid = uuid.v1();
//   var renamer = file.pipe(rename({
//     suffix: '.' + newUuid
//   }));

//   if(typeof customOptions !== 'object'){
//     this.emit('error', new PluginError(PLUGIN_NAME, 'options must be specified'));
//     return;
//   }

//   if(typeof customOptions.bust !== 'function'){
//     this.emit('error', new PluginError(PLUGIN_NAME, 'bust option must be a function'));
//     return;
//   }

//   return through.obj(function(file, encoding, callback) {

//     // renamer should be run first and the callback after it successfully fisnihes but the risk is low
//     customOptions.bust(file.relative, );
    


//     // if (file.isNull()) {
//     //   // nothing to do
//     //   return callback(null, file);
//     // }

//     // if (file.isStream()) {
//     //   console.log('STREAM');
//     //   console.log(file);

//     // } else if (file.isBuffer()) {
//     //   console.log('BUFFER');
//     //   console.log(file);
//     // }

//     callback(null, renamer);
//   });
// };