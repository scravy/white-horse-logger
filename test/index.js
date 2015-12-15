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
      assert.equal(messages.length, 1, 'there should be one message');
      assert(/^INFO +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +woop$/.test(messages[0]), 'should be INFO in $root');
      done();
    });
  });

  it('should log on six default levels', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.inject(function ($logger) {
      $logger.trace("one", 1);
      $logger.debug("two", 2);
      $logger.info("three", 3);
      $logger.warn("four", 4);
      $logger.error("five", 5);
      $logger.fatal("six", 6);
    }, function () {
      assert.equal(messages.length, 6, 'there should be six messages');
      assert(/^TRACE +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +one 1$/.test(messages[0]));
      assert(/^DEBUG +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +two 2$/.test(messages[1]));
      assert(/^INFO +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +three 3$/.test(messages[2]));
      assert(/^WARN +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +four 4$/.test(messages[3]));
      assert(/^ERROR +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +five 5$/.test(messages[4]));
      assert(/^FATAL +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +six 6$/.test(messages[5]));
      done();
    });
  });

  it('should log custom levels', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.register('$loggerLogLevels', {
      nevermind: 2,
      problem: 4,
      issue: 6
    });
    container.inject(function ($logger) {
      $logger.nevermind("one", 1);
      $logger.problem("two", 2);
      $logger.issue("three", 3);
    }, function () {
      assert.equal(messages.length, 3, 'there should be three messages');
      assert(/^NEVERMIND +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +one 1$/.test(messages[0]));
      assert(/^PROBLEM +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +two 2$/.test(messages[1]));
      assert(/^ISSUE +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +three 3$/.test(messages[2]));
      done();
    });
  });
  
  it('should log custom levels with a configured $root logger', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.register('$loggerLogLevels', {
      nevermind: 2,
      problem: 4,
      issue: 6
    });
    container.register('$loggerConfig', {
      $root: {
        level: 'problem'
      }
    });
    container.inject(function ($logger) {
      $logger.nevermind("one", 1);
      $logger.problem("two", 2);
      $logger.issue("three", 3);
    }, function () {
      assert.equal(messages.length, 2, 'there should be two messages');
      assert(/^PROBLEM +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +two 2$/.test(messages[0]));
      assert(/^ISSUE +[0-9\-]+T[0-9:\.]+Z +\[\$root\] +three 3$/.test(messages[1]));
      done();
    });
  });
  
  it('should log custom levels with a configured $root logger and custom format', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.register('$loggerLogLevels', {
      nevermind: 2,
      problem: 4,
      issue: 6
    });
    container.register('$loggerConfig', {
      $root: {
        level: 'problem',
        format: '%3$-10s %2$s %1$10s %3$s %4$s'
      }
    });
    container.inject(function ($logger) {
      $logger.nevermind("one");
      $logger.problem("two");
      $logger.issue("three");
    }, function (err) {
      assert.equal(err, null);
      assert.equal(messages.length, 2, 'there should be two messages');
      assert(/^\$root +[0-9\-]+T[0-9:\.]+Z +PROBLEM +\$root +two$/.test(messages[0]));
      assert(/^\$root +[0-9\-]+T[0-9:\.]+Z +ISSUE +\$root +three$/.test(messages[1]));
      done();
    });
  });
  
  it('should log custom levels with a simply configured $root logger and custom format', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.register('$loggerLogLevels', {
      nevermind: 2,
      problem: 4,
      issue: 6
    });
    container.register('$loggerConfig', {
      $root: '%3$-10s %2$s %1$10s %3$s %4$s'
    });
    container.inject(function ($logger) {
      $logger.nevermind("one");
      $logger.problem("two");
      $logger.issue("three");
    }, function (err) {
      assert.equal(err, null);
      assert.equal(messages.length, 3, 'there should be three messages');
      assert(/^\$root +[0-9\-]+T[0-9:\.]+Z +NEVERMIND +\$root +one$/.test(messages[0]));
      assert(/^\$root +[0-9\-]+T[0-9:\.]+Z +PROBLEM +\$root +two$/.test(messages[1]));
      assert(/^\$root +[0-9\-]+T[0-9:\.]+Z +ISSUE +\$root +three$/.test(messages[2]));
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
  
  it('should log according to config', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    container.use('white-horse-config');
    var messages = [];
    var transport = function (message) {
      messages.push(message);
    };
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.register('a', function ($logger) {
      $logger.debug("UNO");
      $logger.info("DOS");
      $logger.warn("TRES");
    });
    container.register('b', function ($logger) {
      $logger.debug("UNO");
      $logger.info("DOS");
      $logger.warn("TRES");
    });
    container.get('a', function (err) {
      assert.equal(err, null);
      container.get('b', function (err) {
        assert.equal(err, null);
        assert.equal(messages.length, 3);
        assert(/^WARN +[0-9\-]+T[0-9:\.]+Z +\[a\] +TRES$/.test(messages[0]));
        assert(/^INFO +[0-9\-]+T[0-9:\.]+Z +\[b\] +DOS$/.test(messages[1]));
        assert(/^WARN +[0-9\-]+T[0-9:\.]+Z +\[b\] +TRES$/.test(messages[2]));
        done();
      });
    });
  });

  it('should use the default $$console', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    var mockConsole = {
      log: function (message) {
        messages.push(message);
      }
    };
    container.register('$$console', mockConsole);
    container.register('a', function ($logger) {
      $logger.debug("UNO");
      $logger.info("DOS");
      $logger.warn("TRES");
    });
    container.get('a', function (err) {
      assert.equal(err, null);
      assert.equal(messages.length, 3);
      assert(/^DEBUG +[0-9\-]+T[0-9:\.]+Z +\[a\] +UNO/.test(messages[0]));
      assert(/^INFO +[0-9\-]+T[0-9:\.]+Z +\[a\] +DOS$/.test(messages[1]));
      assert(/^WARN +[0-9\-]+T[0-9:\.]+Z +\[a\] +TRES$/.test(messages[2]));
      done();
    });
  });

  it('should log according to $loggerConfig', function (done) {
    var container = new WhiteHorse(require);
    container.use('../index.js');
    var messages = [];
    function transport(message) {
      messages.push(message);
    }
    transport.$factory = false;
    container.register('$loggerTransport', transport);
    container.register('$loggerConfig', {
      $root: 'warn'
    });
    container.register('a', function ($logger) {
      $logger.debug("one");
      $logger.info("two");
      $logger.warn("three");
    });
    container.get('a', function (err) {
      assert.equal(err, null);
      assert.equal(messages.length, 1);
      assert(/^WARN +[0-9\-]+T[0-9:\.]+Z +\[a\] +three/.test(messages[0]));
      done();
    });
  });

});
