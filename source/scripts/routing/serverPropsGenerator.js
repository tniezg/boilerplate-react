/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-10-25 13:09:45
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-11-08 02:07:12
 */
'use strict';

let SerializableKeySet = require('serializable-key-set');
let grabber = new SerializableKeySet();
let logger = require('plain-logger')('serverPropsGenerator');

module.exports = function(){
  return function(logic){
    grabber.add(['/', null], function(route){
      console.log('serverProps for /, null');

      return [
        
      ];
    });

    return grabber;
  }
};