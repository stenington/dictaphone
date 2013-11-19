var opts = require('commander');
var Dictaphone = require('./');

/*  dictaphone.js - single-host caching proxy
 *
 *  dictaphone.js foo.org               -> cache calls in memory
 *  dictaphone.js foo.org -c foo/       -> use foo/ as cache
 *  dictaphone.js foo.org -c foo/ -x    -> never hit foo.org; use only pre-cached responses, or return error
 */

opts
  .version('0.0.1')
  .usage('[options] <host>')
  .description('single-host caching proxy')
  .option('-c, --cache-file <file>', 'use filesystem cache');

opts.on('--help', function () {
  console.log('  Examples: dictaphone.js is a single-host caching proxy\n');
  console.log('    $ dictaphone.js foo.org            proxy to foo.org and cache responses in memory');
  console.log('    $ dictaphone.js -c foo foo.org     proxy to foo.org and cache responses in ./foo');
  console.log('    $ dictaphone.js -c foo             do not proxy; only return cached responses in ./foo');
  console.log('');

});

opts.parse(process.argv);

var host = opts.args[0] || '';

var d = new Dictaphone({
  cacheFile: opts.cacheFile
}, host);

d.run();


/*
     ._______,---,
     | .__,  |   |
     | |  |  |   |]
     | |()|  |_, |]
     | |  |  |o| |]
     | |()|  |o| |
     | |__|  |o| |
     |-------\-'/
     |::::::::||
     |:::;;:::||
     |::;;;;::||
     |::;;;;::||
     |:::;;:::||
     |::::::::||
     '---------'
              ||
              []
      _______//
     (_______/

*/
