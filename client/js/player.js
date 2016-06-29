qpo.Player = function(units, id, type, team){ // "Player" class. A player is a User within the context of a Game.
  units ? this.squad = new qpo.CursorList(units) : this.squad = null; //a CursorList of units (the units this player will control)
  this.id = id || null;
  this.type = type || null;
  this.team = team || null; //red or blue

  this.addUnit = function(unit){ this.squad ? (this.squad.addItem(unit)) : (console.log('')) }

  return this;
}
