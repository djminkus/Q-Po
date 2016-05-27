qpo.Team = function(){
  this.color; // 'red' or 'blue' (related: qpo.playerColor, qpo.unit.team)
  this.unitsList; //list of this team's units (to replace qpo.blueUnits and qpo.redUnits)
  this.activeUnit; //to replace qpo.blueActiveUnit and qpo.redActiveUnit
  this.movesQueue; //to replace qpo.blueMovesQueue and qpo.redMovesQueue
  this.playerType; //either 'human', 'rigid', 'neural', or 'random' (related: qpo.aiTypes)

  return this;
}
