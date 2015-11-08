/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-10-25 13:09:45
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-11-08 03:29:19
 */
'use strict';

let SerializableKeySet = require('serializable-key-set');
let grabber = new SerializableKeySet();
let logger = require('plain-logger')('serverPropsGenerator');

module.exports = function(logic){
  grabber.add(['/', null], function(route){
    console.log('serverProps for /, null');

    return [
      
    ];
  });

  return grabber;
};