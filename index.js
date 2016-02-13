/* vim: set et sw=2 ts=2: */
'use strict';

//var vsprintf = require('sprintf-js').vsprintf;

var defaultLogLevels = {
  trace: 1,
  debug: 2,
  info:  3,
  warn:  4,
  error: 5,
  fatal: 6
};

function printArg(arg) {
  try {
    if (typeof arg === 'object') {
      if (typeof arg.inspect === 'function') {
        return arg.inspect();
      } else {
        return JSON.stringify(arg, null, 2);
      }
    }
  } catch (e) {}
  return arg;
}

function mkLogger(vsprintf, container, module, done) {
  
  module = module || '$root';
  
  var config = container.$logger$config;
  
  var targetLevel = container.$logger$defaultTargetLevel;
  if (container.$logger$config[module] && container.$logger$config[module].level) {
    targetLevel = container.$logger$config[module].level;
  } else if (container.$logger$config.$root && container.$logger$config.$root.level) {
    targetLevel = container.$logger$config.$root.level;
  }
  
  var target = container.$logger$logLevels[targetLevel];
  
  var format;
  if (container.$logger$config[module] && container.$logger$config[module].format) {
    format = container.$logger$config[module].format;
  } else {
    format = container.$logger$config.$root.format;
  } 
  
  var logger = {};
  Object.keys(container.$logger$logLevels).forEach(function (level) {
    logger[level] = container.$logger$logLevels[level] < target ?
      function () {} : function () {
        var args = [];
        for (var i = 0; i < arguments.length; i += 1) {
          args[i] = printArg(arguments[i]);
        }
        var message = vsprintf(format, [
          level.toUpperCase(),
          new Date().toISOString(),
          module,
          args.join(' ')
        ]);
        container.$logger$transport(message);
      };
  });
  
  done(null, logger);
}

function normalizeConfig(config, logLevels) {
  Object.keys(config).forEach(function (key) {
    var goodConfig = {};
    if (typeof config[key] === 'string') {
      if (typeof logLevels[config[key]] === 'number') {
        goodConfig.level = config[key];
      } else {
        goodConfig.format = config[key];
      }
    } else if (typeof config[key] === 'object') {
      if (typeof logLevels[config[key].level] === 'number') {
        goodConfig.level = config[key].level;
      }
      if (typeof config[key].format === 'string') {
        goodConfig.format = config[key].format;
      }
    }
    config[key] = goodConfig;
  });
}

module.exports.$modules = {
  
  $$vsprintf: function () {
    return require('sprintf-js').vsprintf;
  },
  
  $logger: function getLogger($$vsprintf, $module, $done) {
    
    var container = this;
    
    if (!container.$logger$config) {
      container.get('$loggerConfig', function (_, $loggerConfig) {
        container.get('$loggerTransport', function (_, $loggerTransport) {
          container.get('$loggerLogLevels', function (_, $loggerLogLevels) {
            container.get('$config', function (_, $config) {
              container.get('$$console', function (_, console) {
          
                container.$logger$logLevels = typeof $loggerLogLevels === 'object' ?
                  container.$logger$logLevels = $loggerLogLevels :
                  container.$logger$logLevels = defaultLogLevels;
                
                var defaultTargetLevel = Infinity;
                Object.keys(container.$logger$logLevels).forEach(function (level) {
                  defaultTargetLevel = Math.min(defaultTargetLevel, container.$logger$logLevels[level]);
                });
                container.$logger$defaultTargetLevel = defaultTargetLevel;
                
                container.$logger$config = (typeof $loggerConfig === 'object' ? $loggerConfig : (
                  ($config && typeof $config.get === 'function') ? $config.get('logging') : null
                )) || {};
                
                normalizeConfig(container.$logger$config, container.$logger$logLevels);
                
                if (!container.$logger$config.$root) {
                  container.$logger$config.$root = {};
                }
                if (!container.$logger$config.$root.format) {
                  container.$logger$config.$root.format = '%-5s %s [%s] %s';
                }
                
                container.$logger$transport = typeof $loggerTransport === 'function' ?
                  $loggerTransport : console.log;
                  
                mkLogger($$vsprintf, container, $module, $done);
              });
            });
          });
        });
      });
    } else {
      mkLogger($$vsprintf, container, $module, $done);
    }
  }
  
};
