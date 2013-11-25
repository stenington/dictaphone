var http = require('http');
var fs = require('fs');
var util = require('util');
var colors = require('colors');
var format = require('util').format;
var Cache = require('./lib/cache');
var storage = require('./lib/storage');

module.exports = function Dictaphone(opts, baseUrl) {
  var self = this;

  var cache = new Cache({
    base: baseUrl,
    store: opts.cacheFile ? new storage.FileStore(opts.cacheFile) : new storage.MemoryStore(),
    ignore: opts.ignoreParams
  });

  function log (reqData, resCode, cacheData) {
    var indicator;
    if (cacheData.hit) indicator = '  ';
    else if (cacheData.proxied) indicator = '->';
    else indicator = '-X';
    var msg = format('%s %s\t%s %s %s', indicator, resCode, reqData.method, reqData.url, reqData.body);
    if (cacheData.fullUrl) msg += '\t' + cacheData.fullUrl;
    msg = cacheData.hit ? msg.white : msg.yellow;
    console.log(msg);
  }

  self.run = function () {
    var PORT = opts.port || 8080;
    var HOST = 'localhost';

    cache.on('response', function (data) {
      log(data.request, data.response.statusCode, data.cacheInfo);
    });
    var server = http.createServer(cache.handleRequest);

    server.listen(PORT, HOST);

    var proxy = HOST + ':' + PORT;
    var upstream = baseUrl || 'NONE';
    console.log(util.format('%s\tdictaphone proxying %s on %s', LOGO.blue, upstream.yellow, proxy.white));
    console.log();
  };

  return self;
}

const LOGO = '::[oo]'.inverse;
module.exports.LOGO = LOGO;

