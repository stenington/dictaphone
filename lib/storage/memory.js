var stream = require('stream');

module.exports = function MemoryStore() {
  var self = this;

  var store = {};

  function key(keyData) {
    return keyData.id.short();
  }

  self.has = function (keyData) {
    return key(keyData) in store;
  };
  self.get = function (keyData) {
    return store[key(keyData)]
  };
  self.set = function (keyData, data) {
    store[key(keyData)] = data;
  };
  self.setStream = function (keyData, data) {
    data.body = ""; 
    var writable = new stream.Writable({
      decodeStrings: false
    });
    writable._write = function (chunk, encoding, cb) {
      data.body += chunk;
      cb();
    };
    writable.on('finish', function () {
      self.set(keyData, data);
    });
    return writable;
  };

  return self;
};
