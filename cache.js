var http = require('http');
var url = require('url');
var util = require('util');
var path = require('path');
var Readable = require('stream').Readable;

const DEFAULT_PORTS = {
  "http:": 80,
  "https:": 443
};

const HEADER_BLACKLIST = [ 'host' ];

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

function join (baseUrl, reqUrl) {
  var base = url.parse(baseUrl);
  var u = url.parse(reqUrl);
  base.pathname = path.join(base.pathname, u.pathname);
  return url.format(base);
}

function Cache (opts) {
  var self = this;

  var store = opts.store;
  var proxiedUrl = url.parse(opts.base);
  if (!proxiedUrl.port)
    proxiedUrl.port = DEFAULT_PORTS[proxiedUrl.protocol];

  self.request = function (req, cb) {
    if (store.has(req)) {
      cb(new CachedResponse(store.get(req)), { hit: true });
    }
    else {
      var upstreamUrl = join(opts.base, req.url);

      var upstreamReq = http.request(upstreamUrl, function (upstreamRes) {
        upstreamRes.pipe(store.setStream(req, {
          statusCode: upstreamRes.statusCode,
          headers: upstreamRes.headers
        }));
        cb(upstreamRes, { hit: false, fullUrl: upstreamUrl });
      });

      Object.keys(req.headers).forEach(function(key) {
        if (key in HEADER_BLACKLIST) return;
        upstreamReq.setHeader(key, req.headers[key]);
      });

      upstreamReq.on('error', function (err) {
        console.log(util.format('Error making upstream request: %s\t%s'.red, err.message, upstreamUrl));
      });

      if (req.body)
        upstreamReq.write(req.body);

      upstreamReq.end();
    }
  };

  return self;
}

module.exports = Cache;
