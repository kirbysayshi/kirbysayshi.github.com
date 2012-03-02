/* HSHGCollisionDemo
*/
var HSHGCollisionDemo,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

HSHGCollisionDemo = (function(_super) {

  __extends(HSHGCollisionDemo, _super);

  function HSHGCollisionDemo() {
    HSHGCollisionDemo.__super__.constructor.apply(this, arguments);
  }

  HSHGCollisionDemo.prototype.setup = function() {
    var attraction, bounds, collide, i, max, min, p, s, _results;
    HSHGCollisionDemo.__super__.setup.apply(this, arguments);
    this.physics.integrator = new Verlet();
    min = new Vector(0.0, 0.0);
    max = new Vector(this.width, this.height);
    bounds = new EdgeBounce(min, max);
    attraction = new Attraction(this.mouse.pos, 2000, 1400);
    collide = new WorldHashedCollision;
    this.physics.worldBehaviours.push(collide);
    _results = [];
    for (i = 0; i <= 350; i++) {
      p = new Particle(Random(0.5, 4.0));
      p.setRadius(p.mass * 4);
      p.moveTo(new Vector(Random(this.width), Random(this.height)));
      if (Random.bool(0.35)) {
        s = new Spring(this.mouse, p, Random(120, 180), 0.8);
        this.physics.springs.push(s);
      } else {
        p.behaviours.push(attraction);
      }
      collide.grid.addObject(p);
      p.behaviours.push(bounds);
      _results.push(this.physics.particles.push(p));
    }
    return _results;
  };

  return HSHGCollisionDemo;

})(Demo);
