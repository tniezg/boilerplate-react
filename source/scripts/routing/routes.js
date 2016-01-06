/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-10-25 13:09:32
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2016-01-05 11:53:44
 */
'use strict';

let React = require('react');
let Router = require('react-router');
// let IndexRoute = Router.IndexRoute;//Used when no subroute specified in URL
let Route = Router.Route;

let Page = require('../react-components/Page');

module.exports = (
  <Route path="/" component={Page}></Route>
);