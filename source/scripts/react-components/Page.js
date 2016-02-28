/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-11-08 01:35:13
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2016-02-28 03:08:54
 */
'use strict';

let React = require('react');

let Page = React.createClass({
  render(){
    return (
      <div>
        <h1>It Works!</h1>
        <p>Use <a target="_blank" href="http://livereload.com/">LiveReload</a> for automatic site reloading during development.</p>
      </div>
    );
  }
});

module.exports = Page;