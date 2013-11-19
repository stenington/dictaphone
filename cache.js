var http = require('http');
var url = require('url');
var util = require('util');
var Readable = require('stream').Readable;

util.inherits(CachedResponse, Readable);

function CachedResponse (data) {
  Readable.call(this);

  this.statusCode = data.statusCode;
  this.headers = data.headers;
  this.body = data.body;
}

CachedResponse.prototype._read = function () {
  if (this.body)
    this.push(this.body);
  this.push(null);
};

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function Cache (opts) {
  var self = this;

  var base = url.parse(opts.base);
  base.path = base.path.endsWith('/') ? base.path.slice(0, -1) : base.path;
  var store = opts.store;

  self.request = function (req, cb) {
    if (store.has(req)) {
      cb(new CachedResponse(store.get(req)), { hit: true });
    }
    else {
      var u = url.parse(req.url);
      var opts = {
        method: req.method,
        host: base.host,
        path: base.path + u.path,
        headers: req.headers
      };
      delete opts.headers['host'];

      var upstreamReq =  http.request(opts, function (upstreamRes) {
        /*
        var body = "";
        upstreamRes.on('data', function (chunk) {
          body += chunk;
        });
        upstreamRes.on('end', function () {
          store.set(req, { 
            statusCode: upstreamRes.statusCode, 
            body: body, 
            headers: upstreamRes.headers 
          });
        });
        */
        upstreamRes.pipe(store.setStream(req, {
          statusCode: upstreamRes.statusCode,
          headers: upstreamRes.headers
        }));
        cb(upstreamRes, { hit: false, fullUrl: url.resolve('http://' + opts.host, opts.path) });
      });

      if (req.body)
        upstreamReq.write(req.body);

      upstreamReq.end();
    }
  };

  return self;
}

module.exports = Cache;
