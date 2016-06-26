qpo.Team = function(color){
  this.color = color || null; // 'red' or 'blue' (related: qpo.playerColor, qpo.unit.team)
  this.units = new Array(); //list of this team's units (to replace qpo.blueUnits and qpo.redUnits)
  this.players = new Array(); //list of this team's players

  this.addPlayer = function(player){ this.players.push(player); }
  this.addUnit = function(unit){ this.units.push(unit); }

  return this;
}
