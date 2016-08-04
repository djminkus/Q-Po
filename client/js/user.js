qpo.User = function(handle, il, ir, ix){
  // handle is a string like "djminkus"
  //[il, ir, ix] = [initial level, initial rank, initial exp]
  this.handle = handle;

  this.level = il || 0;
  this.rank = ir || 0;
  this.exp = ix || 0; //experience points

  this.levelUp = function(){this.level++}
  this.rankUp = function(){this.rank++}
  this.rankDown = function(){this.rank--}
  this.addExp = function(amt){this.exp += amt}

  this.player = null;
  this.toPlayer = function(unitList){ //returns a newly created Player object
    var player = new qpo.Player(unitList, this.handle)
    this.player = player;
    return player;
  }

  return this;
}
