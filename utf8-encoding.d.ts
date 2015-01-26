/// <reference path="types/webidl.d.ts" />
/// <reference path="types/obtain-unicode.d.ts" />

declare module UTF8Encoding {
  interface ITextEncoder {
    encoding:  DOMString; // readonly
    encode(input?: USVString /*=""*/): Uint8Array; // [NewObject]
  };

  interface ITextDecoder {
    encoding:  DOMString; // readonly
    fatal:     boolean;   // readonly
    ignoreBOM: boolean;   // readonly
    decode(input?: BufferSource, options?: TextDecodeOptions): USVString;
  };
}

declare module 'utf8-encoding' {
  export = UTF8Encoding;
}
