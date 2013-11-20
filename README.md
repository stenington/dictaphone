# dictaphone 
**single-host caching proxy**

## Examples
```
$ dictaphone.js foo.org               -> cache calls in memory
$ dictaphone.js foo.org -c foo/       -> use foo/ as cache
$ dictaphone.js -c foo/               -> never hit foo.org; use only pre-cached responses, or return error
```

## Help
```
$ dictaphone.js -h
```