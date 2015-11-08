/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-10-25 13:09:59
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-11-08 01:34:53
 */
'use strict';

let SerializableKeySet = require('serializable-key-set');
let grabber = new SerializableKeySet();
let logger = require('plain-logger')('clientProps');

module.exports = function(logic){
  grabber.add(['/', null], function(route){
    console.log('clientProps for /, null');

    return [
      
    ];
  });

  return grabber;
};