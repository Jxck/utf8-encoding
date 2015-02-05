/// <reference path="types/webidl.d.ts" />
/// <reference path="types/obtain-unicode.d.ts" />

// polyfill for String.fromCodePoint
declare var String: {
  new (value?: any): String;
  (value?: any): string;
  prototype: String;
  fromCharCode(...codes: number[]): string;
  /**
   * Pollyfill of String.fromCodePoint
   */
  fromCodePoint(...codePoints: number[]): string;
};

/**
 * Main
 */
// for dynamic require
declare var require: any;

// import only type info
import ou = require("obtain-unicode");

var obtainUnicode: typeof ou.obtainUnicode;
if (typeof window === "undefined") { // in node.js
  obtainUnicode = require("obtain-unicode").obtainUnicode;
}

// save platform implementation if exists
var nativeTextEncoder;
if (typeof this.TextEncoder !== "undefined") {
  nativeTextEncoder = this.TextEncoder;
}

var nativeTextDecoder;
if (typeof this.TextDecoder !== "undefined") {
  nativeTextDecoder = this.TextDecoder;
}

module UTF8Encoder {
  "use strict";

  type BufferSource = Uint8Array;

  // https://encoding.spec.whatwg.org/#byte
  type Byte = number;
  type CodePoint = number;

  // https://encoding.spec.whatwg.org/#concept-token
  type Token = Byte | CodePoint;

  // https://encoding.spec.whatwg.org/#end-of-stream
  var EOS: Token = undefined;

  // https://encoding.spec.whatwg.org/#concept-stream
  type Stream = Token[];

  // https://encoding.spec.whatwg.org/#error-mode
  type ErrorMode = string; // TODO: more detail

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
  export class TextEncoder implements ITextEncoder {
    private _encoding: DOMString; // only keep encoding name
    private encoder: IEncoder;

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
      var input: Stream = obtainUnicode(inputString);

      // step 2
      var output: Stream = [];

      // step 3
      while (true) {
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
  function processing(token: Token, encoderDecoderInstance: ICoder, input: Stream, output: Stream, mode?: ErrorMode): any {
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
    if (result === "continue" || result === "finished") {
      return result;
    }

    // step 4
    else if (Array.isArray(result)) { // one or more tokens
      result.forEach((token: Token) => {
        output.push(token);
      });
    }
    else if (typeof result === "number") {
      output.push(result);
    }

    // step 5
    else if (result === "error") {
      switch (mode) {
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

  export class TextDecoder implements ITextDecoder {
    private _encoding:    DOMString;
    private decoder:      IDecoder;
    private stream:       Stream;
    private ignoreBOMFlag = false;
    private bomSeenFlag   = false;
    private errorMode     = "replacement";
    private streamingFlag = false;

    // https://encoding.spec.whatwg.org/#dom-textdecoder-encoding
    get encoding(): DOMString {
      // this impl has only name
      return this._encoding;
    }

    // https://encoding.spec.whatwg.org/#dom-textdecoder-fatal
    get fatal(): boolean {
      return this.errorMode === "fatal";
    }

    // https://encoding.spec.whatwg.org/#dom-textdecoder-ignorebom
    get ignoreBOM(): boolean {
      return this.ignoreBOMFlag;
    }

    // https://encoding.spec.whatwg.org/#dom-textdecoder
    constructor(label: DOMString = "utf-8", options: TextDecoderOptions = { fatal: false, ignoreBOM: false }) {
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
      dec._encoding = encoding;

      // step 5
      if (options.fatal === true) {
        dec.errorMode = "fatal";
      }

      // step 6
      if (options.ignoreBOM === true) {
        dec.ignoreBOMFlag = true;
      }

      // step 7
      return dec;
    }

    // https://encoding.spec.whatwg.org/#dom-textdecoder-decode
    decode(input?: BufferSource, options: TextDecodeOptions = { stream: false }): USVString {
      // step 1
      if (this.streamingFlag !== true) {
        this.decoder = new Utf8Decoder();
        this.stream = [];
        this.bomSeenFlag = false;
      }

      // step 2
      if (options.stream === true) {
        this.streamingFlag = true;
      } else {
        this.streamingFlag = false;
      }

      // step 3
      if (input !== undefined) {
        // copy
        for (var i = 0; i < input.length; i++) {
          this.stream.push(input[i]);
        }
      }

      // step 4
      var output: Stream = [];

      // step 5
      for (var j=0; ; j++) {
        // step 5-1
        var token: Token = input[j];

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
            throw new TypeError("invalid input");
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
      while (true) {
        // step 2-1
        var token: Token = stream.shift();

        // step 2-2
        if (["utf-8", "utf8"].indexOf(this._encoding) !== -1
            && this.ignoreBOMFlag === false
            && this.bomSeenFlag === false) {
          // step 2-2-1
          if (token === 0xFEFF) {
            this.bomSeenFlag = true;
          }
          // step 2-2-2
          else if (token !== EOS) {
            this.bomSeenFlag = true;
            output += String.fromCodePoint(token);
          }
          // step 2-2-3
          else {
            return output;
          }
        }

        // step 2-3
        else if (token !== EOS) {
          output += String.fromCodePoint(token);
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
  interface ICoder {
    handler(input: Stream, token: Token): any;
  }

  interface IEncoder extends ICoder {
  }

  interface IDecoder extends ICoder {
  }

  // https://encoding.spec.whatwg.org/#utf-8-encoder
  class Utf8Encoder implements IEncoder {
    handler(input: Stream, codePoint: CodePoint): any {
      // step 1
      if (codePoint === EOS) {
        return "finished";
      }

      // step 2
      if (0 <= codePoint && codePoint <= 0x007F) {
        return codePoint;
      }

      // step 3
      var count: number, offset: number;
      if (0x0080 <= codePoint && codePoint <= 0x07FF) {
        count = 1;
        offset = 0xC0;
      }
      else if (0x0800 <= codePoint && codePoint <= 0xFFFF) {
        count = 2;
        offset = 0xE0;
      }
      else if (0x10000 <= codePoint && codePoint <= 0x10FFFF) {
        count = 3;
        offset = 0xF0;
      }

      // step 4
      var bytes = [(codePoint >> (6*count)) + offset];

      // step 5
      while (count > 0) {
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


  // https://encoding.spec.whatwg.org/#utf-8-decoder
  class Utf8Decoder implements IDecoder {
    private utf8CodePoint: CodePoint = 0;
    private utf8BytesSeen: number = 0;
    private utf8BytesNeeded: number = 0;
    private utf8LowerBoundary: number = 0x80;
    private utf8UpperBoundary: number = 0xBF;

    handler(input: Stream, byt: Byte): any {
      // step 1
      if (byt === EOS && this.utf8BytesNeeded !== 0) {
        this.utf8BytesNeeded = 0;
        return "error";
      }

      // step 2
      if (byt === EOS) {
        return "finished";
      }

      // step 3
      if (this.utf8BytesNeeded === 0) {
        if (0x00 <= byt && byt <= 0x7F) {
          return byt;
        }
        else if (0xC2 <= byt && byt <= 0xDF) {
          this.utf8BytesNeeded = 1;
          this.utf8CodePoint = byt - 0xC0;
        }
        else if (0xE0 <= byt && byt <= 0xEF) {
          if (byt === 0xE0) {
            this.utf8LowerBoundary = 0xA0;
          }
          if (byt === 0xED) {
            this.utf8UpperBoundary = 0x9F;
          }
          this.utf8BytesNeeded = 2;
          this.utf8CodePoint = byt - 0xE0;
        }
        else if (0xF0 <= byt && byt <= 0xF4) {
          if (byt === 0xF0) {
            this.utf8LowerBoundary = 0x90;
          }
          if (byt === 0xF4) {
            this.utf8UpperBoundary = 0x8F;
          }
          this.utf8BytesNeeded = 3;
          this.utf8CodePoint = byt - 0xF0;
        }
        else {
          return "error";
        }

        // TODO: remove this assertion
        if (!(0xC2 <= byt && byt <= 0xF4)) console.assert(false);

        this.utf8CodePoint = this.utf8CodePoint << (6*this.utf8BytesNeeded);
        return "continue";
      }

      // step 4
      if (byt < this.utf8LowerBoundary || this.utf8UpperBoundary < byt) {
        // step 4-1
        this.utf8CodePoint = 0;
        this.utf8BytesNeeded = 0;
        this.utf8BytesSeen = 0;
        this.utf8LowerBoundary = 0x80;
        this.utf8UpperBoundary = 0xBF;

        // step 4-2
        input.unshift(byt);

        // step 4-3
        return "error";
      }

      // step 5
      this.utf8LowerBoundary = 0x80;
      this.utf8UpperBoundary = 0xBF;

      // setp 6
      this.utf8BytesSeen += 1;
      this.utf8CodePoint += (byt - 0x80) << (6 * (this.utf8BytesNeeded - this.utf8BytesSeen));

      // step 7
      if (this.utf8BytesSeen !== this.utf8BytesNeeded) {
        return "continue";
      }

      // step 8
      var codePoint = this.utf8CodePoint;

      // step 9
      this.utf8CodePoint = 0;
      this.utf8BytesNeeded = 0;
      this.utf8BytesSeen = 0;

      return codePoint;
    }
  }
}

this.TextEncoder = nativeTextEncoder || UTF8Encoder.TextEncoder;
this.TextDecoder = nativeTextDecoder || UTF8Encoder.TextDecoder;
