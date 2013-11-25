var util = require('util');
var url = require('url');
var qs = require('querystring');
var crypto = require('crypto');
var path = require('path');

function hashOf (str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function CacheKey (data, ignore) {
  ignore = ignore || [];

  this.original = {
    url: data.url,
    method: data.method,
    headers: data.headers,
    body: data.body
  };

  var normUrl = this.normalize(this.original.url, ignore);

  this.id = {
    short: function () { 
      return hashOf(data.method + normUrl.path + data.body);
    },
    long: function () {
      var p = normUrl.path.endsWith('/') ? normUrl.path.slice(0, -1) : normUrl.path;
      if (data.body)
        p += '__' + hashOf(data.body);
      return path.join(data.method, p);
    },
    parts: {
      pathname: normUrl.pathname,
      queryString: normUrl.query,
      body: data.body  // FIXME: ignores should apply here too
    }
  };
}

CacheKey.prototype.normalize = function (uri, params) {
  var u = url.parse(uri, true);
  if (params && u.query) {
    params.forEach(function (param) {
      if (u.query[param] !== undefined)
        u.query[param] = 'xxx';
    });
    delete u.search;
    u.query = qs.stringify(u.query);
    u.path = u.pathname + '?' + u.query;
  }
  return u;
};

module.exports = CacheKey;
