var http = require('http');
var events = require('events');
var url = require('url');
var util = require('util');
var path = require('path');
var stream = require('stream');
var crypto = require('crypto');
var responseStream = require('response-stream');
var duplex = require('duplexer');
var _ = require('underscore');

const DEFAULT_PORTS = {
  "http:": 80,
  "https:": 443
};

const HEADER_BLACKLIST = [ "host" ];

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

util.inherits(CachedResponse, stream.Readable);

function CachedResponse (data) {
  stream.Readable.call(this);

  this.statusCode = data.statusCode;
  this.headers = data.headers;
  this.body = data.body;
}

CachedResponse.prototype._read = function () {
  if (this.body)
    this.push(this.body);
  this.push(null);
};

function rebase (url1, url2) {
  var u1 = url.parse(url1);
  var u2 = url.parse(url2);
  u1.pathname = path.join(u1.pathname, u2.pathname);
  u1.search = u2.search;
  return url.format(u1);
}

function normalize (uri, params) {
  var u = url.parse(uri, true);
  if (params && u.query) {
    params.forEach(function (param) {
      if (u.query[param] !== undefined)
        u.query[param] = '@';
    });
    delete u.search;
  }
  return url.format(u);
}

function Cache (opts) {
  var self = this;

  events.EventEmitter.call(this);

  var store = opts.store;
  var ignore = opts.ignore;
  var base = opts.base;
  var shouldProxy = !!opts.base;

  self.handleRequest = function (req, res) {
    req.pipe(self.handler(req)).pipe(res);
  };

  self.handler = function (req) {

    var writable = new stream.Writable();
    var readable = new stream.PassThrough();
    var rs = responseStream(duplex(writable, readable));

    var chunks = [];
    writable._write = function (chunk, encoding, cb) {
      chunks.push(chunk);
      cb();
    };

    function getBody () {
      return Buffer.concat(chunks);
    }

    writable.on('finish', function () {
      var body = getBody();
      var normalizedUrl = normalize(req.url, ignore);
      var data = {
        url: req.url,
        cacheableUrl: normalizedUrl,
        id: crypto.createHash('md5').update(normalizedUrl + req.body).digest('hex'),
        method: req.method,
        headers: req.headers,
        body: body
      };
      self.getResponse(data, function (response, info) {
        self.emit('response', {
          request: data,
          response: {
            statusCode: response.statusCode
          },
          cacheInfo: info
        });
        rs.writeHead(response.statusCode, response.headers);
        response.pipe(readable);
      });
    });

    rs.on('writeHead', function (args, prevent) {
      var headers = {};
      if (args.length === 3) headers = args[2];
      else if (args.length === 2 && typeof args[1] === 'object') headers = args[1];
      if (headers) {
        Object.keys(headers).forEach(function(key) {
          if (HEADER_BLACKLIST.indexOf(key) !== -1) delete headers[key];
        });
      }
    });

    return rs;
  };

  self.getResponse = function (data, cb) {
    if (store.has(data)) {
      cb(new CachedResponse(store.get(data)), { hit: true });
    }
    else if (shouldProxy) {
      proxy(data, function (upstreamUrl, upstreamRes) {
        upstreamRes.pipe(store.setStream(data, {
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

  function proxy (data, cb) {
    var upstreamUrl = rebase(base, data.url);
    var opts = url.parse(upstreamUrl);
    opts.method = data.method;

    var upstreamReq = http.request(opts, function (upstreamRes) {
      cb(upstreamUrl, upstreamRes);
    });

    Object.keys(data.headers).forEach(function(key) {
      if (HEADER_BLACKLIST.indexOf(key) !== -1) return;
      upstreamReq.setHeader(key, data.headers[key]);
    });

    upstreamReq.on('error', function (err) {
      console.log(util.format('Error making upstream request: %s\t%s'.red, err.message, upstreamUrl));
    });

    if (data.body)
      upstreamReq.write(data.body);

    upstreamReq.end();
  };

  return self;
}

util.inherits(Cache, events.EventEmitter);

module.exports = Cache;
