var HSHGAttractionDemo,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

HSHGAttractionDemo = (function(_super) {

  __extends(HSHGAttractionDemo, _super);

  function HSHGAttractionDemo() {
    HSHGAttractionDemo.__super__.constructor.apply(this, arguments);
  }

  HSHGAttractionDemo.prototype.setup = function() {
    var attraction, bounds, collide, i, max, min, p, repulsion, _results;
    HSHGAttractionDemo.__super__.setup.apply(this, arguments);
    min = new Vector(0.0, 0.0);
    max = new Vector(this.width, this.height);
    bounds = new EdgeBounce(min, max);
    this.physics.integrator = new Verlet();
    attraction = new Attraction(this.mouse.pos, 1200, 1200);
    repulsion = new Attraction(this.mouse.pos, 200, -2000);
    collide = new WorldHashedCollision;
    this.physics.worldBehaviours.push(collide);
    _results = [];
    for (i = 0; i <= 400; i++) {
      p = new Particle(Random(0.1, 3.0));
      p.setRadius(p.mass * 4);
      p.moveTo(new Vector(Random(this.width), Random(this.height)));
      p.behaviours.push(attraction);
      p.behaviours.push(repulsion);
      p.behaviours.push(bounds);
      collide.grid.addObject(p);
      _results.push(this.physics.particles.push(p));
    }
    return _results;
  };

  return HSHGAttractionDemo;

})(Demo);
