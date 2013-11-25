var http = require('http');
var stream = require('stream');
var should = require('should');
var nock = require('nock');
var request = require('request');
var Cache = require('../lib/cache');

function FakeStorage () {
  return {
    has: function (req) { 
      this.lastKey = req.url; // req.url is the key by which responses are stored
      return !req.url.match(/uncached/);
    },
    get: function () {
      return {
        statusCode: 418,
        body: "c(')/"
      };
    },
    setStream: function (key) {
      var store = this;
      store.recentlySet = ''; 
      var w = new stream.Writable();
      w._write = function (chunk, encoding, cb) {
        store.recentlySet += chunk.toString();
        cb();
      }
      return w;
    }
  };
}

var url;
var server;

var store = new FakeStorage();

describe('Cache', function () {
  before(function (done) {
    var cache = new Cache({
      base: 'http://example.org',
      store: store,
      ignore: ['ignore_me']
    });
    server = http.createServer(cache.handleRequest);
    server.listen(0, function () {
      url = 'http://localhost:' + server.address().port;
      done();
    })
  });

  afterEach(function () {
    nock.cleanAll();
  });

  it('should proxy uncached requests', function (done) {
    var context = nock('http://example.org').get('/uncached').reply(200, 'Hi');
    request(url + '/uncached', function (error, response, body) {
      body.should.equal('Hi');
      context.isDone().should.be.true;
      done();
    });
  });

  it('should not proxy cached requests', function (done) {
    var context = nock('http://example.org').get('/cached').reply(200, 'Hi');
    request(url + '/cached', function (error, response, body) {
      body.should.equal("c(')/");
      context.isDone().should.be.false;
      done();
    });
  });

  it('should cache proxied requests', function (done) {
    var context = nock('http://example.org').get('/uncached').reply(200, 'Cache me!');
    request(url + '/uncached', function (error, response, body) {
      store.recentlySet.should.equal('Cache me!');
      done();
    });
  });

  it('should include query parameters when caching' , function (done) {
  var context = nock('http://example.org')
      .get('/foo?a=1').reply(200, 'Hi')
      .get('/foo?a=2').reply(200, 'Hi again');
    request(url + '/foo?a=1', function (error, response, body) {
      var key1 = store.lastKey;
      request(url + '/foo?a=2', function (error, response, body) {
        var key2 = store.lastKey;
        key1.should.not.equal(key2);
        done();
      });
    });
  });

  it('should ignore variation in ignored query parameters when caching', function (done) {
    var context = nock('http://example.org')
      .get('/foo?a=1&ignore_me=1').reply(200, 'Hi')
      .get('/foo?a=1&ignore_me=2').reply(200, 'Hi again');
    request(url + '/foo?a=1&ignore_me=1', function (error, response, body) {
      var key1 = store.lastKey;
      request(url + '/foo?a=1&ignore_me=2', function (error, response, body) {
        var key2 = store.lastKey;
        key1.should.equal(key2);
        done();
      });
    });
  });

  it('should strip host header when proxying request', function (done) {
    var context = nock('http://example.org').get('/uncached').reply(200, 'Hi', {'Host': 'http://localhost:8080'});
    request(url + '/uncached', function (error, response, body) {
      response.headers.should.not.have.property('host');
      done();
    });
  });

  it('should proxy method', function (done) {
    var context = nock('http://example.org').post('/uncached').reply(200, 'Hi');
    request({
      url: url + '/uncached', 
      method: 'POST'
    }, function (error, response, body) {
      context.isDone().should.be.true;
      done();
    });
  });

});

describe('Cache, non-proxying mode', function () {
  before(function (done) {
    var cache = new Cache({
      base: undefined,
      store: store
    });
    server = http.createServer(cache.handleRequest);
    server.listen(0, function () {
      url = 'http://localhost:' + server.address().port;
      done();
    })
  });

  afterEach(function () {
    nock.cleanAll();
  });

  it('should return canned response for uncached requests', function (done) {
    var context = nock('http://example.org').get('/uncached').reply(200, 'Hi');
    request(url + '/uncached', function (error, response, body) {
      response.statusCode.should.equal(404);
      body.should.equal('NO PROXY - NOT CACHED\n');
      context.isDone().should.be.false;
      done();
    });
  });

});