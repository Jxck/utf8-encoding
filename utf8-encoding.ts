/// <reference path="types/webidl.d.ts" />
type BufferSource = Uint8Array;

// https://encoding.spec.whatwg.org/#byte
type Byte = number;
type CodePoint = number;

// https://encoding.spec.whatwg.org/#concept-token
type Token = Byte | CodePoint;

// https://encoding.spec.whatwg.org/#end-of-stream
var EOS:Token = null;

// https://encoding.spec.whatwg.org/#concept-stream
type Stream = Token[];


class TextDecoderOptions {
  fatal:     boolean; // default false;
  ignoreBOM: boolean; // default false;
};

class TextDecodeOptions {
  stream:    boolean; // default false;
};

// [Constructor(optional DOMString label = "utf-8", optional TextDecoderOptions options),
//  Exposed=Window,Worker]
interface ITextDecoder {
  encoding:  DOMString;
  fatal:     boolean;
  ignoreBOM: boolean;
  decode(input?: BufferSource, options?: TextDecodeOptions): USVString;
};

// [Constructor(optional DOMString utfLabel = "utf-8"),
//  Exposed=Window,Worker]
interface ITextEncoder {
  encoding:  DOMString; // readonly
  encode(input?: USVString /*=""*/): Uint8Array; // [NewObject]
};

/**
 * this encoder supports only UTF8
 */
// https://encoding.spec.whatwg.org/#textencoder
class TextEncoder implements ITextEncoder {
  private _encoding: DOMString; // only keep encoding name
  private encoder: any;

  // https://encoding.spec.whatwg.org/#dom-textencoder-encoding
  get encoding(): DOMString {
    return this._encoding;
  }

  // https://encoding.spec.whatwg.org/#dom-textencoder
  constructor(utfLabel: DOMString = "utf-8") {
    // step 1 (not compat with spec)
    var encoding = utfLabel.toLowerCase();

    // step 2 (support only utf-8)
    if (utfLabel !== "utf-8" || utfLabel !== "utf8") {
      throw new RangeError("unsupported encoding, utf-8 only");
    }

    // step 3
    var enc = this;

    // step 4
    enc._encoding = encoding;

    // step 5
    enc.encoder = utf8encoder;

    return enc;
  }

  // https://encoding.spec.whatwg.org/#dom-textencoder-encode
  encode(input: USVString = ""): Uint8Array {
    // step 1
    // nop

    // step 2
    var output: Stream = [];

    // step 3
    for (var i=0; ; i++) {
      // http://www.hcn.zaq.ne.jp/___/WEB/Encoding-ja.html#concept-encoding-process
      var token: Token = charCodeAt(i);

    }
    return null;
  }
}

function utf8encoder() {
}
