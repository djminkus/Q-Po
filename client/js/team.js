qpo.Team = function(color){
  this.color = color || null; // 'red' or 'blue' (related: qpo.playerColor, qpo.unit.team)
  this.units = new Array(); //list of this team's units (to replace qpo.blue.units and qpo.red.units)
  this.players = new Array(); //list of this team's players
  this.points = 0;

  this.addPoint = function(){
    this.points++;
    qpo.scoreboard.update();
  }

  this.addPlayer = function(player){ this.players.push(player); }
  this.addUnit = function(unit){ this.units.push(unit); }

  return this;
}
