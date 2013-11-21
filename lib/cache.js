var http = require('http');
var url = require('url');
var util = require('util');
var path = require('path');
var Readable = require('stream').Readable;
var _ = require('underscore');

const DEFAULT_PORTS = {
  "http:": 80,
  "https:": 443
};

const HEADER_BLACKLIST = [ "host" ];

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

function rebase (url1, url2) {
  var u1 = url.parse(url1);
  var u2 = url.parse(url2);
  u1.pathname = path.join(u1.pathname, u2.pathname);
  u1.search = u2.search;
  return url.format(u1);
}

function normalize (req, params) {
  req = _.clone(req);
  req.url = _.clone(req.url);
  var u = url.parse(req.url, true);
  if (params && u.query) {
    params.forEach(function (param) {
      if (u.query[param] !== undefined)
        u.query[param] = 'XXX';
    });
    delete u.search;
    req.url = url.format(u);
  }
  return req;
}

function Cache (opts) {
  var self = this;

  var store = opts.store;
  var ignore = opts.ignore;
  var shouldProxy = !!opts.base;

  self.request = function (req, cb) {
    var normalized = normalize(req, ignore);
    if (store.has(normalized)) {
      cb(new CachedResponse(store.get(normalized)), { hit: true });
    }
    else if (shouldProxy) {
      proxy(req, function (upstreamUrl, upstreamRes) {
        upstreamRes.pipe(store.setStream(normalized, {
          statusCode: upstreamRes.statusCode,
          headers: upstreamRes.headers
        }));
        cb(upstreamRes, { hit: false, proxied: true, fullUrl: upstreamUrl });
      }); 
    }
    else {
      cb(new CachedResponse({
        statusCode: 404,
        body: "NO PROXY - NOT CACHED\n"
      }), { hit: false, proxied: false });      
    }
  };

  function proxy (req, cb) {
    var upstreamUrl = rebase(opts.base, req.url);

    var upstreamReq = http.request(upstreamUrl, function (upstreamRes) {
      cb(upstreamUrl, upstreamRes);
    });

    Object.keys(req.headers).forEach(function(key) {
      if (HEADER_BLACKLIST.indexOf(key) !== -1) return;
      upstreamReq.setHeader(key, req.headers[key]);
    });

    upstreamReq.on('error', function (err) {
      console.log(util.format('Error making upstream request: %s\t%s'.red, err.message, upstreamUrl));
    });

    if (req.body)
      upstreamReq.write(req.body);

    upstreamReq.end();
  };

  return self;
}

module.exports = Cache;
