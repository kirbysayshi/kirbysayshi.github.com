/* Particle
*/
var Particle;

Particle = (function() {

  function Particle(mass) {
    this.mass = mass != null ? mass : 1.0;
    this.setMass(this.mass);
    this.setRadius(1.0);
    this.fixed = false;
    this.behaviours = [];
    this.pos = new Vector();
    this.vel = new Vector();
    this.acc = new Vector();
    this.old = {
      pos: new Vector(),
      vel: new Vector(),
      acc: new Vector()
    };
    this.aabb = {
      min: [0, 0],
      max: [0, 0]
    };
  }

  /* Moves the particle to a given location vector.
  */

  Particle.prototype.moveTo = function(pos) {
    this.pos.copy(pos);
    return this.old.pos.copy(pos);
  };

  /* Sets the mass of the particle.
  */

  Particle.prototype.setMass = function(mass) {
    this.mass = mass != null ? mass : 1.0;
    return this.massInv = 1.0 / this.mass;
  };

  /* Sets the radius of the particle.
  */

  Particle.prototype.setRadius = function(radius) {
    this.radius = radius != null ? radius : 1.0;
    return this.radiusSq = this.radius * this.radius;
  };

  Particle.prototype.getAABB = function() {
    this.aabb.min[0] = this.pos.x - this.radius;
    this.aabb.min[1] = this.pos.y - this.radius;
    this.aabb.min[2] = this.pos.y - this.radius;
    this.aabb.max[0] = this.pos.x + this.radius;
    this.aabb.max[1] = this.pos.y + this.radius;
    this.aabb.max[2] = this.pos.y + this.radius;
    return this.aabb;
  };

  /* Applies all behaviours to derive new force.
  */

  Particle.prototype.update = function(dt, index) {
    var behaviour, _i, _len, _ref, _results;
    if (!this.fixed) {
      _ref = this.behaviours;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        behaviour = _ref[_i];
        _results.push(behaviour.apply(this, dt, index));
      }
      return _results;
    }
  };

  return Particle;

})();
