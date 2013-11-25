var CacheKey = require('../lib/cache-key');
var _ = require('underscore');

describe('CacheKey', function () {
  it('should have attributes', function () {
    var data = {
      url: '/a/b/c',
      method: 'GET',
      headers: {},
      body: undefined
    };
    var key = new CacheKey(data);

    key.original.should.eql(data);

    key.id.should.be.type('object');
    key.id.short.should.be.type('function');
    key.id.long.should.be.type('function');

    key.id.parts.should.eql({
      pathname: data.url,
      queryString: '',
      body: undefined
    });
  });

  it('should provide human-readable long id', function () {
    var data = {
      url: '/a/b/c?d=1&e=2',
      method: 'POST',
      headers: {},
      body: JSON.stringify({ f: 3, g: 4 })
    };
    var key = new CacheKey(data);

    key.id.long().should.match(/^POST\/a\/b\/c\?d=1&e=2__[a-z0-9]+$/);
  });

  describe('normalization', function () {
    it('should normalize ignored query parameter values', function () {
      var data = {
        url: '/a/b/c?d=1&e=2',
        method: 'POST',
        headers: {},
        body: JSON.stringify({ f: 3, g: 4 })
      };
      var key = new CacheKey(data, ['d']);

      key.id.parts.queryString.should.equal('d=xxx&e=2');
    });
  });

  describe('id uniqueness', function () {
    it('should consider url', function () {
      var data = {
        method: 'GET',
        headers: {},
        body: undefined
      };
      var key1 = new CacheKey(_.extend({ url: '/a/b/c' }, data));
      var key2 = new CacheKey(_.extend({ url: '/a/b/d' }, data));

      key1.id.short().should.not.equal(key2.id.short());
      key1.id.long().should.not.equal(key2.id.long());
    });

    it('should consider method', function () {
      var data = {
        url: '/a',
        headers: {},
        body: undefined
      };
      var key1 = new CacheKey(_.extend({ method: 'GET' }, data));
      var key2 = new CacheKey(_.extend({ method: 'POST' }, data));

      key1.id.short().should.not.equal(key2.id.short());
      key1.id.long().should.not.equal(key2.id.long());
    });

    it('should consider presence of ignored parameter', function () {
      var data = {
        method: 'POST',
        headers: {},
        body: JSON.stringify({ f: 3, g: 4 })
      };
      var key1 = new CacheKey(_.extend({ url: '/a/b/c?d=1' }, data), ['d']);
      var key2 = new CacheKey(_.extend({ url: '/a/b/c' }, data));

      key1.id.short().should.not.equal(key2.id.short());
      key1.id.long().should.not.equal(key2.id.long());
    });

    it('should not consider value of ignored parameter', function () {
      var data = {
        method: 'POST',
        headers: {},
        body: JSON.stringify({ f: 3, g: 4 })
      };
      var key1 = new CacheKey(_.extend({ url: '/a/b/c?d=1&e=1' }, data), ['d']);
      var key2 = new CacheKey(_.extend({ url: '/a/b/c?d=2&e=1' }, data), ['d']);
      var key3 = new CacheKey(_.extend({ url: '/a/b/c?d=2&e=2' }, data), ['d']);

      key1.id.short().should.equal(key2.id.short());
      key1.id.short().should.not.equal(key3.id.short());
      key1.id.long().should.equal(key2.id.long());
      key1.id.long().should.not.equal(key3.id.long());
    });
  });
});