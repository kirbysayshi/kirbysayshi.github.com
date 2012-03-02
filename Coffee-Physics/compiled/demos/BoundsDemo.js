/* BoundsDemo
*/
var BoundsDemo,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

BoundsDemo = (function(_super) {

  __extends(BoundsDemo, _super);

  function BoundsDemo() {
    BoundsDemo.__super__.constructor.apply(this, arguments);
  }

  BoundsDemo.prototype.setup = function() {
    var edge, i, max, min, p, _results;
    BoundsDemo.__super__.setup.apply(this, arguments);
    min = new Vector(0.0, 0.0);
    max = new Vector(this.width, this.height);
    edge = new EdgeWrap(min, max);
    _results = [];
    for (i = 0; i <= 200; i++) {
      p = new Particle(Random(0.5, 4.0));
      p.setRadius(p.mass * 5);
      p.moveTo(new Vector(Random(this.width), Random(this.height)));
      p.behaviours.push(new Wander(0.2, 120, Random(1.0, 2.0)));
      p.behaviours.push(edge);
      _results.push(this.physics.particles.push(p));
    }
    return _results;
  };

  return BoundsDemo;

})(Demo);
