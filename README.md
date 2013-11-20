# dictaphone 
`::[oo]`
**single-host caching proxy**

## Quick Start

```
$ git clone https://github.com/stenington/dictaphone.git
$ cd dictaphone
$ bin/dictaphone.js example.org
$ curl localhost:8080/some/path
```

In this example, `curl` will return http://example.org/some/path to you, and future requests for it
will be returned from dictaphone's cache while it remains running.

## Examples
```
$ bin/dictaphone.js foo.org               -> cache calls in memory
$ bin/dictaphone.js foo.org -c foo/       -> use foo/ as base directory for flat file cache
$ bin/dictaphone.js -c foo/               -> never hit foo.org; use only pre-cached responses, or return error
```

## Help
```
$ bin/dictaphone.js -h
```

