qpo.User = function(handle, il, ir, ix, type){ //An entity within the ranking system. Has a name, a level, a rank, and an exp value.
  // handle is a string like "djminkus"
  // [il, ir, ix] = [initial level, initial rank, initial exp]
  this.handle = handle;
  this.level = il || 0;
  this.rank = ir || 0;
  this.exp = ix || 0; //experience points
  this.type = type || 'human'; //human or one of four AI types (null, random, rigid, or neural)

  this.levelUp = function(){this.level++}
  this.rankUp = function(){this.rank++}
  this.rankDown = function(){this.rank--}
  this.addExp = function(amt){this.exp += amt}

  this.player = null;
  this.toPlayer = function(args){ //returns a newly created Player object
    this.player = new qpo.Player(args.unitList, this.handle, this.type, args.team, args.number)
    return this.player
  }
  this.minUnit = null; //minimum index in
  this.maxUnit = null;

  this.activeUnit = null;
  this.updateActiveUnit = function(cond){
    // Cond is condition (either "move" or "death"), the reason this function's being called.
    // Deactivate the old active unit. Find the next living unit and activate it.
    // Update this.activeUnit.
    var oldAU, newAU;
    var po = qpo.activeGame.po;
    this.minUnit =  this.player.num   * qpo.activeGame.unitsPerPlayer
    this.maxUnit = (this.player.num+1)* qpo.activeGame.unitsPerPlayer - 1

    var findingUnit = true;
    var tries = 0;
    var ind = this.activeUnit.num + 1; //first index to look at
    while (findingUnit) { // keep looking until you find the new active unit.
      // debugger;
      if (ind > this.maxUnit) { ind = this.minUnit; }
      oldAU = this.activeUnit;
      newAU = qpo[this.player.team].units[ind]; //potential new active unit
      // debugger;
      //When you find the new one, deactivate the old unit, activate the new one, and update this.activeUnit.
      if ((newAU.alive) && (qpo.activeGame.isEnding == false)){ // This is our new active unit. Do stuff.
        // debugger;
        findingUnit = false; //unit has now been found. Exit the While loop after this iteration.
        this.activeUnit.deactivate();
        this.activeUnit = qpo[this.player.team].units[ind];
        this.activeUnit.activate();
        // debugger;
      }
      ind++;
      tries++;
      if (tries == qpo.activeGame.unitsPerPlayer) { // No other units are eligibile for activation. Stop looking.
        findingUnit = false;
        if(cond=='death'){this.activeUnit.deactivate()}
      }
    }
  }

  return this;
}
