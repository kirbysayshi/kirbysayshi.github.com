var WorldHashedCollision,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

WorldHashedCollision = (function(_super) {

  __extends(WorldHashedCollision, _super);

  function WorldHashedCollision(callback) {
    this.callback = callback != null ? callback : null;
    this.grid = new HSHG();
    WorldHashedCollision.__super__.constructor.apply(this, arguments);
  }

  WorldHashedCollision.prototype.apply = function(world, dt, index) {
    var pair, pairs, _len, _results;
    this.grid.update();
    pairs = this.grid.queryForCollisionPairs();
    _results = [];
    for (index = 0, _len = pairs.length; index < _len; index++) {
      pair = pairs[index];
      _results.push(this.collide(pair[0], pair[1]));
    }
    return _results;
  };

  return WorldHashedCollision;

})(Collision);
