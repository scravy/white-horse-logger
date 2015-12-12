'use strict';

var sprintf = require('sprintf').sprintf;

var logLevel = {
  trace: 1,
  debug: 2,
  info:  3,
  warn:  4,
  error: 5,
  fatal: 6
};

function mkLogger(level, transport) {
  return function () {
    var args = [].slice.call(arguments);
    var format = '%-5s %s %-15s ' + args.shift();
    args.unshift(module);
    args.unshift(new Date().toISOString());
    args.unshift(level.toUpperCase());
    args.unshift(format);
    transport(sprintf.apply(null, args));
  };
}

function getLogger(module, config, transport) {

  var targetLevel = config[module] || logLevel.info;
  
  var logger = {};
  
  Object.keys(logLevel).forEach(function (level) {
    if (logLevel[level] >= targetLevel) {
      logger[level] = mkLogger(level, transport);
    } else {
      logger[level] = function () {};
    }
  });
  
  logger.log = logger.info;
  
  return logger;
}

module.exports.$modules = {
  
  $logger: function ($module, $done, $$console) {
    
    var container = this;
    var module = $module || '$root';
    
    container.get('$loggerTransport', function (err, result) {
      var transport = typeof result === 'function' ? result : $$console.log;
      container.injectWith(function (config) {
        return config;
      }, [ '$config' ], function (err, result) {
        var config = typeof result === 'object' ? result : {};
        $done(null, getLogger(module, config, transport));
      }, 'logging');
    });
    
  }
  
};