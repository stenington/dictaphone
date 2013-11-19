var fs = require('fs');
var path = require('path');
var stream = require('stream');
var normalize = require('../normalize');

module.exports = function FileStore(base) {
  var self = this;

  function filePath (req) {
    var url = normalize(req.url);
    return path.join(base, req.method, url);
  }

  function mkdirs (dirPath) {
    if (!dirPath) throw new Error('cannot make undefined directory');
    if (fs.existsSync(dirPath)) return;
    mkdirs(path.dirname(dirPath)); 
    fs.mkdirSync(dirPath);
  }
  
  self.has = function (req) {
    return fs.existsSync(filePath(req)); 
  };
  self.get = function (req) {
    return JSON.parse(fs.readFileSync(filePath(req)));
  };
  self.set = function (req, res) {
    var dir = path.dirname(filePath(req));
    if (!fs.existsSync(dir))
      mkdirs(dir);
    fs.writeFileSync(filePath(req), JSON.stringify(res, null, '  ')); 
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
  }
  return self;
};
