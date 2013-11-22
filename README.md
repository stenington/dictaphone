# dictaphone 
`::[oo]`
**single-host caching proxy**

## What Is It?
`dictaphone` lets you record an http conversation with a host and replay the responses, again and again. This
can help ensure consistency when testing, or put a buffer between you and a live system you may not want to abuse,
for example.

## Quick Start

``` bash
$ git clone https://github.com/stenington/dictaphone.git
$ cd dictaphone
$ bin/dictaphone.js example.org
$ curl localhost:8080/some/path
```

In this example, `curl` will return http://example.org/some/path to you, and future requests for it
will be returned from dictaphone's cache while it remains running.

## Examples

### Simple caching
``` bash
$ bin/dictaphone.js httpbin.org
$ curl localhost:8080/                 # gets httpbin.org
$ curl localhost:8080/                 # gets httpbin.org from in-memory cache
$ curl localhost:8080/html             # gets httpbin.org/html
$ curl localhost:8080/html             # gets httpbin.org/html from in-memory cache
$ ...                                  # etc.
```

In this example, `dictaphone` proxies requests to the specified host and keeps the response in memory. 
Subsequent requests for the same url will return the cached response instead of hitting the host again.

### More useful caching
``` bash
$ bin/dictaphone.js httpbin.org -c some_new_dir/       # creates ./some_new_dir/ and uses it as the base directory for a flat file cache
$ curl localhost:8080/html                             # gets httpbin.org/html and stores the response as a JSON data object in ./some_new_dir/GET/html
$ echo '{"statusCode": 404, "headers": [], "body": "Nope.\n"}' > some_new_dir/GET/not_there
$ curl localhost:8080/not_there                        # responds with your manually created 404
```

This example behaves the same as above, but writes the proxied responses to the filesystem. You can then edit the response 
by hand, if you'd like, and the next time you use `-c some_new_dir/`, any cached responses found there will be used without
ever hitting the host!

### Using ONLY cached responses
``` bash
$ bin/dictaphone.js -c some_existing_dir/       # uses only pre-cached responses found under ./some_existing_dir/
$ curl localhost:8080/cached_url                # returns the response in ./some_existing_dir/GET/cached_url 
$ curl localhost:8080/not_cached                # assuming ./some_existing_dir/GET/not_cached doesn't exist, returns a 404
```

In this example, `dictaphone` will *only* use cached responses, returning a 404 otherwise. You can use this to play back a previously
recorded set of requests, knowing that you'll never hit the actual host if that would be undesirable.

## More Help
``` bash
$ bin/dictaphone.js -h
```

## License
**dictaphone** is Copyright (c) 2013 Mike Larsson @stenington and licenced under the MIT licence. All rights not explicitly granted
in the MIT license are reserved. See the included LICENSE file for more details.
