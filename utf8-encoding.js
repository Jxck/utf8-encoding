/// <reference path="types/webidl.d.ts" />
/// <reference path="types/obtain-unicode.d.ts" />
var obtainUnicode;
if (typeof window === "undefined") {
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
var UTF8Encoder;
(function (UTF8Encoder) {
    "use strict";
    // https://encoding.spec.whatwg.org/#end-of-stream
    var EOS = undefined;
    ;
    /**
     * this encoder supports only UTF8
     */
    // https://encoding.spec.whatwg.org/#textencoder
    var TextEncoder = (function () {
        // https://encoding.spec.whatwg.org/#dom-textencoder
        function TextEncoder(utfLabel) {
            if (utfLabel === void 0) { utfLabel = "utf-8"; }
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
        Object.defineProperty(TextEncoder.prototype, "encoding", {
            // https://encoding.spec.whatwg.org/#dom-textencoder-encoding
            get: function () {
                return this._encoding;
            },
            enumerable: true,
            configurable: true
        });
        // https://encoding.spec.whatwg.org/#dom-textencoder-encode
        TextEncoder.prototype.encode = function (inputString) {
            if (inputString === void 0) { inputString = ""; }
            // step 1
            var input = obtainUnicode(inputString);
            // step 2
            var output = [];
            while (true) {
                // step 3-1
                var token = input.shift(); // if undefined, means EOS
                // step 3-2
                var result = processing(token, this.encoder, input, output);
                // step 3-3
                if (result === "finished") {
                    return new Uint8Array(output);
                }
            }
        };
        return TextEncoder;
    })();
    UTF8Encoder.TextEncoder = TextEncoder;
    // https://encoding.spec.whatwg.org/#concept-encoding-process
    function processing(token, encoderDecoderInstance, input, output, mode) {
        // step 1
        if (mode === undefined) {
            if (encoderDecoderInstance instanceof Utf8Encoder) {
                mode = "replacement";
            }
            else {
                mode = "fatal";
            }
        }
        // step 2
        var result = encoderDecoderInstance.handler(input, token);
        // step 3
        if (result === "continue" || result === "finished") {
            return result;
        }
        else if (Array.isArray(result)) {
            result.forEach(function (token) {
                output.push(token);
            });
        }
        else if (typeof result === "number") {
            output.push(result);
        }
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
    var TextDecoderOptions = (function () {
        function TextDecoderOptions() {
        }
        return TextDecoderOptions;
    })();
    ;
    var TextDecodeOptions = (function () {
        function TextDecodeOptions() {
        }
        return TextDecodeOptions;
    })();
    ;
    ;
    var TextDecoder = (function () {
        // https://encoding.spec.whatwg.org/#dom-textdecoder
        function TextDecoder(label, options) {
            if (label === void 0) { label = "utf-8"; }
            if (options === void 0) { options = { fatal: false, ignoreBOM: false }; }
            this.ignoreBOMFlag = false;
            this.bomSeenFlag = false;
            this.errorMode = "replacement";
            this.streamingFlag = false;
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
        Object.defineProperty(TextDecoder.prototype, "encoding", {
            // https://encoding.spec.whatwg.org/#dom-textdecoder-encoding
            get: function () {
                // this impl has only name
                return this._encoding;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextDecoder.prototype, "fatal", {
            // https://encoding.spec.whatwg.org/#dom-textdecoder-fatal
            get: function () {
                return this.errorMode === "fatal";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextDecoder.prototype, "ignoreBOM", {
            // https://encoding.spec.whatwg.org/#dom-textdecoder-ignorebom
            get: function () {
                return this.ignoreBOMFlag;
            },
            enumerable: true,
            configurable: true
        });
        // https://encoding.spec.whatwg.org/#dom-textdecoder-decode
        TextDecoder.prototype.decode = function (input, options) {
            if (options === void 0) { options = { stream: false }; }
            // step 1
            if (this.streamingFlag !== true) {
                this.decoder = new Utf8Decoder();
                this.stream = [];
                this.bomSeenFlag = false;
            }
            // step 2
            if (options.stream === true) {
                this.streamingFlag = true;
            }
            else {
                this.streamingFlag = false;
            }
            // step 3
            if (input !== undefined) {
                for (var i = 0; i < input.length; i++) {
                    this.stream.push(input[i]);
                }
            }
            // step 4
            var output = [];
            for (var j = 0;; j++) {
                // step 5-1
                var token = input[j];
                // step 5-2
                if (token === undefined && this.streamingFlag === true) {
                    return this.serialize(output);
                }
                else {
                    // step 5-3-1
                    var result = processing(token, this.decoder, this.stream, output, this.errorMode);
                    // step 5-3-2
                    if (result === "finished") {
                        return this.serialize(output);
                    }
                    else if (result === "error") {
                        throw new TypeError("invalid input");
                    }
                    else {
                    }
                }
            }
        };
        // https://encoding.spec.whatwg.org/#concept-td-serialize
        TextDecoder.prototype.serialize = function (stream) {
            // step 1
            var output = "";
            while (true) {
                // step 2-1
                var token = stream.shift();
                // step 2-2
                if (["utf-8", "utf8"].indexOf(this._encoding) !== -1 && this.ignoreBOMFlag === false && this.bomSeenFlag === false) {
                    // step 2-2-1
                    if (token === 0xFEFF) {
                        this.bomSeenFlag = true;
                    }
                    else if (token !== EOS) {
                        this.bomSeenFlag = true;
                        output += String.fromCodePoint(token);
                    }
                    else {
                        return output;
                    }
                }
                else if (token !== EOS) {
                    output += String.fromCodePoint(token);
                }
                else {
                    return output;
                }
            }
        };
        return TextDecoder;
    })();
    UTF8Encoder.TextDecoder = TextDecoder;
    // https://encoding.spec.whatwg.org/#utf-8-encoder
    var Utf8Encoder = (function () {
        function Utf8Encoder() {
        }
        Utf8Encoder.prototype.handler = function (input, codePoint) {
            // step 1
            if (codePoint === EOS) {
                return "finished";
            }
            // step 2
            if (0 <= codePoint && codePoint <= 0x007F) {
                return codePoint;
            }
            // step 3
            var count, offset;
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
            var bytes = [(codePoint >> (6 * count)) + offset];
            while (count > 0) {
                // step 5-1
                var temp = codePoint >> (6 * (count - 1));
                // step 5-2
                bytes.push(0x80 | (temp & 0x3F));
                // step 5-3
                count = count - 1;
            }
            // step 6
            return bytes;
        };
        return Utf8Encoder;
    })();
    // https://encoding.spec.whatwg.org/#utf-8-decoder
    var Utf8Decoder = (function () {
        function Utf8Decoder() {
            this.utf8CodePoint = 0;
            this.utf8BytesSeen = 0;
            this.utf8BytesNeeded = 0;
            this.utf8LowerBoundary = 0x80;
            this.utf8UpperBoundary = 0xBF;
        }
        Utf8Decoder.prototype.handler = function (input, byt) {
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
                if (!(0xC2 <= byt && byt <= 0xF4))
                    console.assert(false);
                this.utf8CodePoint = this.utf8CodePoint << (6 * this.utf8BytesNeeded);
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
        };
        return Utf8Decoder;
    })();
})(UTF8Encoder || (UTF8Encoder = {}));
this.TextEncoder = nativeTextEncoder || UTF8Encoder.TextEncoder;
this.TextDecoder = nativeTextDecoder || UTF8Encoder.TextDecoder;
//# sourceMappingURL=utf8-encoding.js.map