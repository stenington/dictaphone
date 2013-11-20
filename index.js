var http = require('http');
var request = require('request');
var fs = require('fs');
var util = require('util');
var colors = require('colors');
var format = require('util').format;
var Cache = require('./cache');
var storage = require('./storage');

module.exports = function Dictaphone(opts, baseUrl) {
  var self = this;

  var cache = new Cache({
    base: baseUrl,
    store: opts.cacheFile ? new storage.FileStore(opts.cacheFile) : new storage.MemoryStore()
  });

  function log (reqData, resCode, cacheData) {
    var indicator = cacheData.hit ? '  ' : '->';
    var msg = format('%s %s\t%s %s %s', indicator, resCode, reqData.method, reqData.url, reqData.body);
    if (cacheData.fullUrl) msg += '\t' + cacheData.fullUrl;
    msg = cacheData.hit ? msg.white : msg.yellow;
    console.log(msg);
  }

  self.run = function () {
    var PORT = opts.port || 8080;
    var HOST = 'localhost';

    var server = http.createServer(function (req, res) {
      var body = '';

      req.on('data', function (chunk) {
        body += chunk;
      });

      req.on('end', function () {
        var data = {
          url: req.url,
          method: req.method,
          headers: req.headers,
          body: body 
        };
        cache.request(data, function (cacheRes, info) {
          log(data, cacheRes.statusCode, info);
          res.writeHead(cacheRes.statusCode, cacheRes.headers);
          cacheRes.pipe(res); 
        });
      });
    });

    server.listen(PORT, HOST);

    var proxy = HOST + ':' + PORT;
    console.log(util.format('dictaphone proxying %s on %s', baseUrl.yellow, proxy.white));
    console.log();
  };

  return self;
}
