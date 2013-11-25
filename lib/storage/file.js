var fs = require('fs');
var path = require('path');
var stream = require('stream');
var crypto = require('crypto');

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

module.exports = function FileStore(base) {
  var self = this;

  function filePath (key) {
    var p = path.join(base, key.id.long());
    return p;
  }

  function mkdirs (dirPath) {
    if (!dirPath) throw new Error('cannot make undefined directory');
    if (fs.existsSync(dirPath)) return;
    mkdirs(path.dirname(dirPath)); 
    fs.mkdirSync(dirPath);
  }
  
  self.has = function (key) {
    return fs.existsSync(filePath(key)); 
  };
  self.get = function (key) {
    return JSON.parse(fs.readFileSync(filePath(key)));
  };
  self.set = function (key, res) {
    var dir = path.dirname(filePath(key));
    if (!fs.existsSync(dir))
      mkdirs(dir);
    fs.writeFileSync(filePath(key), JSON.stringify(res, null, '  ')); 
  };
  self.setStream = function (key, data) {
    data.body = "";
    var writable = new stream.Writable({
      decodeStrings: false
    });
    writable._write = function (chunk, encoding, cb) {
      data.body += chunk;
      cb();
    };
    writable.on('finish', function () {
      self.set(key, data);
    });
    return writable;
  }
  return self;
};
