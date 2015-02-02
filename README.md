# Isomorphic Encoding Standard implementation ignore support without UTF-8

## about

implementation of Encoding Standard `TextEncoder` & `TextDecoder`.
https://encoding.spec.whatwg.org/

but this spec includes tons of legacy encoding support you may never use.
so support only [UTF-8](https://encoding.spec.whatwg.org/#utf-8) encoding/decoding
for make script small for browser friendly :)


## install

```sh
$ npm install utf8-encoding
```

## usage

works in node and browser.
Isomorphic !! no Browserify.

```js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
console.log(encoder.encode("beer!🍻"));
// Uint8Array[98, 101, 101, 114, 33, 240, 159, 141, 187]
console.log(decoder.decode(new Uint8Array([98, 101, 101, 114, 33, 240, 159, 141, 187])));
// "beer!🍻
```

## build and test

```sh
$ npm install
$ npm test
```

and also open test/index.html in your browser and see console.


## for TypeScript

use [utf8-encoding.d.ts](./utf8-encoding.d.ts)

other types which this scripts depends on are in [types](./types) directory.


## release process

- develop/maintain on master branch
- if finished, dump version to new one in package.json
- checkout release and merge master --no-ff
- build via npm test
- commit build
- add tag
- push to github
- npm publish

## License

The MIT License (MIT)
Copyright (c) 2015 Jxck
