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

  it('should inject a logger', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    container.inject(function ($logger) {
      assert($logger.trace);
      assert($logger.debug);
      assert($logger.info);
      assert($logger.warn);
      assert($logger.error);
      assert($logger.fatal);
      done();
    });
  });
  
  it('should pickup a transport from registered modules', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.inject(function ($logger) {
      $logger.info("woop");
    }, function () {
      assert.equal(messages.length, 1);
      assert(/^INFO +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +woop$/.test(messages[0]));
      done();
    });
  });

  it('should inject the right logger into the right module', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.register('something', function ($logger) {
      $logger.warn('yea');
    });
    container.get('something', function (err, result) {
      assert(!err);
      assert.equal(messages.length, 1);
      assert(/^WARN +[0-9\-]+T[0-9:\.]+Z +\[something\] +yea$/.test(messages[0]));
      done();
    });
  });

});