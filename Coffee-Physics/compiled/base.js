/* Allows safe, dyamic creation of namespaces.
*/
var namespace;

namespace = function(id) {
  var path, root, _i, _len, _ref, _ref2, _results;
  root = self;
  _ref = id.split('.');
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    path = _ref[_i];
    _results.push(root = (_ref2 = root[path]) != null ? _ref2 : root[path] = {});
  }
  return _results;
};

/* RequestAnimationFrame shim.
*/

(function() {
  var time, vendor, vendors, _i, _len;
  time = 0;
  vendors = ['ms', 'moz', 'webkit', 'o'];
  for (_i = 0, _len = vendors.length; _i < _len; _i++) {
    vendor = vendors[_i];
    if (!(!window.requestAnimationFrame)) continue;
    window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
    window.cancelRequestAnimationFrame = window[vendor + 'CancelRequestAnimationFrame'];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var delta, now, old;
      now = new Date().getTime();
      delta = Math.max(0, 16 - (now - old));
      setTimeout((function() {
        return callback(time + delta);
      }), delta);
      return old = now + delta;
    };
  }
  if (!window.cancelAnimationFrame) {
    return window.cancelAnimationFrame = function(id) {
      return clearTimeout(id);
    };
  }
})();
