var TextEncoder = TextEncoder || require('../utf8-encoding').TextEncoder;
var TextDecoder = TextDecoder || require('../utf8-encoding').TextDecoder;

// tests
function assert(actual, expected) {
  console.log('.');
  console.assert(actual === expected, '\nact: ' + actual + '\nexp: ' + expected);
}

(function test() {
  var encoder = new TextEncoder();
  var decoder = new TextDecoder();
  [
    [ "aAzZ09",    [ 97, 65, 122, 90, 48, 57 ]],
    [ "~`!@",      [ 126, 96, 33, 64 ]],
    [ "#$%^&",     [ 35, 36, 37, 94, 38 ]],
    [ "*()_+-=",   [ 42, 40, 41, 95, 43, 45, 61 ]],
    [ "{}|[]\:",   [ 123, 125, 124, 91, 93, 58 ]],
    [ ";'<>?,./'", [ 59, 39, 60, 62, 63, 44, 46, 47, 39 ]],
    [ "\"",        [ 34 ]],
    [ "あ亞",      [ 227, 129, 130, 228, 186, 158 ]],
    [ "叱𠮟",      [ 229, 143, 177, 240, 160, 174, 159 ]],
    [ "🍻",         [ 240, 159, 141, 187 ]]
  ].forEach(function(e) {
    var s = e[0];
    var actual = encoder.encode(s);
    var expected = e[1];
    assert(actual.length, expected.length);
    for (var i = 0; i < actual.length; i++) {
      assert(actual[i], expected[i]);
    }

    assert(s, decoder.decode(actual));
  });
})();
