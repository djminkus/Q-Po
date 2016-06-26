qpo.Player = function(units, id, type, team, il, ir, ix){ // "Player" class.
  //[il, ir, ix] = [initial level, initial rank, initial exp]
  units ? this.squad = new qpo.CursorList(units) : this.squad = null; //a CursorList of units (the units this player will control)
  this.id = id || null;
  this.type = type || null;
  this.team = team || null; //red or blue

  this.level = il || 0;
  this.rank = ir || 0;
  this.exp = ix || 0; //experience points

  this.addUnit = function(unit){ this.squad ? this.squad.addItem(unit) : return false }
  this.levelUp = function(){this.level++}
  this.rankUp = function(){this.rank++}
  this.rankDown = function(){this.rank--}
  this.addExp = function(amt){this.exp += amt}

  return this;
}
