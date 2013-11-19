var url = require('url');

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

module.exports = function normalize (uri) {
  uri = uri.endsWith('/') ? uri.slice(0, -1) : uri;
  var u = url.parse(uri, true);
  if (u.query && u.query.auth) {
    u.query.auth = 'XXX';
    delete u.search;
  }
  return url.format(u);
};
