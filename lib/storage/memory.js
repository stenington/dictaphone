var crypto = require('crypto');
var stream = require('stream');

module.exports = function MemoryStore() {
  var self = this;

  var store = {};

  function key(req) {
    return crypto.createHash('md5').update(req.url+req.body).digest('hex');
  }

  self.has = function (req) {
    return key(req) in store;
  };
  self.get = function (req) {
    return store[key(req)]
  };
  self.set = function (req, res) {
    store[key(req)] = res;
  };
  self.setStream = function (req, data) {
    data.body = ""; 
    var writable = new stream.Writable({
      decodeStrings: false
    });
    writable._write = function (chunk, encoding, cb) {
      data.body += chunk;
      cb();
    };
    writable.on('finish', function () {
      self.set(req, data);
    });
    return writable;
  };

  return self;
};
