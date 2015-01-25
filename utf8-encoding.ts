/// <reference path="types/webidl.d.ts" />
/// <reference path="types/obtain-unicode.d.ts" />

import ObtainUnicode = require("obtain-unicode");

type BufferSource = Uint8Array;

// https://encoding.spec.whatwg.org/#byte
type Byte = number;
type CodePoint = number;

// https://encoding.spec.whatwg.org/#concept-token
type Token = Byte | CodePoint;

// https://encoding.spec.whatwg.org/#end-of-stream
var EOS:Token = undefined;

// https://encoding.spec.whatwg.org/#concept-stream
type Stream = Token[];

// https://encoding.spec.whatwg.org/#error-mode
type ErrorMode = string; // TODO: more detail

// http://heycam.github.io/webidl/#dfn-get-buffer-source-copy
function copy(source: BufferSource): BufferSource {
  return new Uint8Array(source);
}

/**
 * TextEncoder
 */
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
  private encoder: Encoder;

  // https://encoding.spec.whatwg.org/#dom-textencoder-encoding
  get encoding(): DOMString {
    return this._encoding;
  }

  // https://encoding.spec.whatwg.org/#dom-textencoder
  constructor(utfLabel: DOMString = "utf-8") {
    // step 1 (not compat with spec)
    var encoding = utfLabel.toLowerCase();

    // step 2 (support only utf-8)
    if (encoding !== "utf-8" && encoding !== "utf8") {
      throw new RangeError("unsupported encoding, utf-8 only");
    }

    // step 3
    var enc = this;

    // step 4
    enc._encoding = encoding;

    // step 5 (support only utf-8)
    enc.encoder = new Utf8Encoder();

    return enc;
  }

  // https://encoding.spec.whatwg.org/#dom-textencoder-encode
  encode(inputString: USVString = ""): Uint8Array {
    // step 1
    var input: Stream = ObtainUnicode(inputString);

    // step 2
    var output: Stream = [];

    // step 3
    while(true) {
      // step 3-1
      var token: Token = input.shift(); // if undefined, means EOS

      // step 3-2
      var result = processing(token, this.encoder, input, output);

      // step 3-3
      if (result === "finished") {
        return new Uint8Array(output);
      }
    }
  }
}

// https://encoding.spec.whatwg.org/#concept-encoding-process
function processing(token: Token, encoderDecoderInstance: Coder, input: Stream, output: Stream, mode?: ErrorMode): any {
  // step 1
  if (mode === undefined) {
    if (encoderDecoderInstance instanceof Utf8Encoder) {
      mode = "replacement";
    } else {
      mode = "fatal";
    }
  }

  // step 2
  var result = encoderDecoderInstance.handler(input, token);

  // step 3
  if(result === "continue" || result === "finished") {
    return result;
  }

  // step 4
  else if(Array.isArray(result)) { // one or more tokens
    result.forEach((token: Token) => {
      output.push(token);
    });
  }

  // step 5
  else if(result) { // TODO: check result is Error
    switch(mode) {
    case "replacement":
      output.push(0xFFFD);
      break;
    case "HTML":
      throw new Error("unsupported because utf-8 only");
    case "fatal":
      return result;
    }
  }

  // step 6
  return "continue";
}

/**
 * TextDecoder
 */
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
  encoding:  DOMString; // readonly
  fatal:     boolean;   // readonly
  ignoreBOM: boolean;   // readonly
  decode(input?: BufferSource, options?: TextDecodeOptions): USVString;
};

class TextDecoder implements ITextDecoder {
  private _encoding:    DOMString;
  private _fatal:       boolean;
  private _ignoreBOM:   boolean = false;
  private decoder:      Decoder;
  private stream:       Stream;
  private ignoreBOMFlag = false;
  private bomSeenFlag   = false;
  private errorMode     = "replacement";
  private streamingFlag = false;

  get encoding(): DOMString {
    return this._encoding;
  }

  get fatal(): boolean {
    return this._fatal;
  }

  get ignoreBOM(): boolean {
    return this._ignoreBOM;
  }

  // https://encoding.spec.whatwg.org/#dom-textdecoder
  constructor(label: DOMString = "utf-8", options?: TextDecoderOptions) {
    // step 1 (not compat with spec)
    var encoding = label.toLowerCase();

    // step 2 (support only utf-8)
    if (encoding !== "utf-8" && encoding !== "utf8") {
      if (encoding === "replacement") {
        throw new RangeError("encoding is 'replacement'");
      }
      throw new RangeError("unsupported encoding, utf-8 only");
    }

    // step 3
    var dec = this;

    // step 4
    dec.encoding = encoding;

    // step 5
    if (options.fatal === true) {
      dec.errorMode = "fatal";
    }

    // step 6
    if (options.ignoreBOM === true) {
      dec._ignoreBOM = true;
    }

    // step 7
    return dec;
  }

  // https://encoding.spec.whatwg.org/#dom-textdecoder-decode
  decode(input?: BufferSource, options?: TextDecodeOptions): USVString {
    // step 1
    if(this.streamingFlag === true) {
      this.decoder = new Utf8Decoder();
      this.stream = [];
      this.bomSeenFlag = false;
    }

    // step 2
    if(options.stream === true) {
      this.streamingFlag = true;
    } else {
      this.streamingFlag = false;
    }

    // step 3
    if (input !== undefined) {
      var copied = copy(input);

      for (var i = 0; i < copied.length; i++) {
        this.stream.push(copied[i]);
      }
    }

    // step 4
    var output: Stream = [];

    // step 5
    while(true) { i? i++: i=0;
      // step 5-1
      var token: Token = input[i];

      // step 5-2
      if (token === undefined && this.streamingFlag === true) {
        return this.serialize(output);
      }
      // step 5-3
      else {
        // step 5-3-1
        var result = processing(token, this.decoder, this.stream, output, this.errorMode);

        // step 5-3-2
        if (result === "finished") {
          return this.serialize(output);
        }

        // step 5-3-3
        else if (result === "error") {
          throw new TypeError("invalid input")
        }

        // step 5-3-4
        else {
          // do nothing
        }
      }
    }
  }

  // https://encoding.spec.whatwg.org/#concept-td-serialize
  serialize(stream: Stream): string {
    // step 1
    var output: string = "";

    // step 2
    while(true) {
      // step 2-1
      var token: Token = stream.shift();

      // step 2-2
      if (["utf-8", "utf8"].indexOf(this.encoding) > 0 && this._ignoreBOM === false && this.bomSeenFlag === false) {
        // step 2-2-1
        if (token === 0xFEFF) {
          this.bomSeenFlag = true;
        }
        // step 2-2-2
        else if (token !== EOS) {
          this.bomSeenFlag = true;
          output += token;
        }
        // step 2-2-3
        else {
          return output;
        }
      }

      // step 2-3
      else if (token !== EOS) {
        output += token;
      }

      // step 2-4
      else {
        return output;
      }
    }
  }
}

/**
 * UTF-8 Encoder / Decoder Instance
 */
interface Coder{
  handler(input: Stream, token: Token): any;
}

interface Encoder extends Coder {
}

interface Decoder extends Coder {
}

// https://encoding.spec.whatwg.org/#utf-8-encoder
class Utf8Encoder implements Encoder {
  handler(input: Stream, codePoint: CodePoint): any {
    // step 1
    if(codePoint === EOS) {
      return 'finished';
    }

    // step 2
    if(0 <= codePoint && codePoint <= 0x007F) {
      return [codePoint]; // as byte
    }

    // step 3
    var count: number, offset: number;
    if(0x0080 <= codePoint && codePoint <= 0x07FF) {
      count = 1;
      offset = 0xC0;
    }
    else if(0x0800 <= codePoint && codePoint <= 0xFFFF) {
      count = 2;
      offset = 0xE0;
    }
    else if(0x10000 <= codePoint && codePoint <= 0x10FFFF) {
      count = 3;
      offset = 0xF0;
    }

    // step 4
    var bytes = [(codePoint >> (6*count)) + offset];

    // step 5
    while(count > 0) {
      // step 5-1
      var temp = codePoint >> (6*(count-1));
      // step 5-2
      bytes.push(0x80 | (temp & 0x3F));
      // step 5-3
      count = count - 1;
    }

    // step 6
    return bytes;
  }
}


class Utf8Decoder implements Decoder {
  handler(input: Stream, codePoint: CodePoint): any {
    return null;
  }
}

this.TextEncoder = TextEncoder;
this.TextDecoder = TextDecoder;
