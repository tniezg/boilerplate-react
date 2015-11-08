/* 
 * @Author: Tomasz Niezgoda
 * @Date: 2015-10-25 13:09:32
 * @Last Modified by: Tomasz Niezgoda
 * @Last Modified time: 2015-11-08 01:39:41
 */
'use strict';

let React = require('react');
let Router = require('react-router');
let IndexRoute = Router.IndexRoute;
let Route = Router.Route;

let Page = require('../react-components/Page');

module.exports = (
  <Route path="/">
    <IndexRoute component={Page}/>
    <Route path="*" component={Page}/>
  </Route>
);