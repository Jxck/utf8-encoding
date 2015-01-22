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
var EOS:Token = null;

// https://encoding.spec.whatwg.org/#concept-stream
type Stream = Token[];

// https://encoding.spec.whatwg.org/#error-mode
type ErrorMode = string; // TODO: more detail

// https://encoding.spec.whatwg.org/#concept-encoding-process
function processing(token: Token, encoderDecoderInstance: Instance, input: Stream, output: Stream, mode?: ErrorMode): any {
  // step 1
  if (mode === undefined) {
    if (encoderDecoderInstance instanceof TextDecoder) {
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
    case "HTML":
    case "fatal":
      return result;
    }
  }

  // step 6
  return "continue";
}


class TextDecoderOptions {
  fatal:     boolean; // default false;
  ignoreBOM: boolean; // default false;
};

class TextDecodeOptions {
  stream:    boolean; // default false;
};

interface Instance {
handler(input: Stream, token: Token): any; //TODO
}

// [Constructor(optional DOMString label = "utf-8", optional TextDecoderOptions options),
//  Exposed=Window,Worker]
interface ITextDecoder extends Instance {
  encoding:  DOMString;
  fatal:     boolean;
  ignoreBOM: boolean;
  decode(input?: BufferSource, options?: TextDecodeOptions): USVString;
};

// [Constructor(optional DOMString utfLabel = "utf-8"),
//  Exposed=Window,Worker]
interface ITextEncoder extends Instance {
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
    if (utfLabel !== "utf-8" && utfLabel !== "utf8") {
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
  encode(inputString: USVString = ""): Uint8Array {
    // step 1
    var input: Stream = ObtainUnicode(inputString);

    // step 2
    var output: Stream = [];

    // step 3
    while(true) {
      // step 3-1
      var token: Token = input.unshift();

      // step 3-2
      var result = processing(token, this, input, output);
      console.log(result);

      break;
    }

    return null;
  }

  handler(input: Stream, token: Token) {
  }
}

function utf8encoder() {
}

// TODO
class TextDecoder {
}

var encoder = new TextEncoder();
encoder.encode("abc");
