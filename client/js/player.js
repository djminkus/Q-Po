qpo.Player = function(units, handle, type, team){ // "Player" class. Can be human or AI
  // Units is a list of units that will be this player's squad. Can be passed as null.
  units ? (this.squad = new qpo.CursorList(units)) : (this.squad = null); //a CursorList of units (the units this player will control)
  //active unit is reference via this.squad.selectedItem
  this.handle = handle || null; // a string
  this.type = type || null; // human or one of three AI types (random, rigid, neural)
  this.team = team || null; // 'red' or 'blue' (at least for now)

  if(this.type == 'neural'){
    
  }

  this.addUnit = function(unit){ this.squad ? (this.squad.addItem(unit)) : (console.log('')) }

  return this;
}
