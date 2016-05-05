var Team = function(){
  this.color; //related: qpo.playerColor, qpo.unit.team
  this.unitsList; //
  this.score; //same as qpo.scoreBoard.redScore/blueScore
  this.lives; // same as qpo.activeGame.scoreToWin - this.score
  this.activeUnit; //to replace qpo.blueActiveUnit and qpo.redActiveUnit

  return this;
}
