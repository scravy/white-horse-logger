/* vim: set et sw=2 ts=2: */

describe('white-horse-logger', function () {
  'use strict';

  var assert = require('assert');
  var WhiteHorse = require('white-horse');
  var path = require('path');

  it('should be picked up by the container', function () {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    assert(container.getModule('$logger') instanceof WhiteHorse.Module);
  });

});