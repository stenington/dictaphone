var stream = require('stream');
var util = require('util');

util.inherits(CacheResponse, stream.Readable);

function CacheResponse (data) {
  stream.Readable.call(this);

  this.statusCode = data.statusCode;
  this.headers = data.headers;
  this.body = data.body;
}

CacheResponse.prototype._read = function () {
  if (this.body)
    this.push(this.body);
  this.push(null);
};

module.exports = CacheResponse;
