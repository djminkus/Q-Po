c.customAttributes.inactiveUnit = function(teamColor){
  return {
    "stroke":qpo.COLOR_DICT[teamColor],
    "stroke-width": qpo.unitStroke,
    'opacity': 1
  }
}

//CREATE UNIT TYPE/CLASS
function startUnit(color, gx, gy, num){
  var mtr = qpo.guiDimens.squareSize; //mtr for meter, like, a unit of length
  //for now, only blue units are numbered (6-20-15)
  this.team = color; //"red" or "blue"
  this.rect = c.rect(qpo.guiCoords.gameBoard.leftWall + mtr*gx,
    qpo.guiCoords.gameBoard.topWall+mtr*gy,
    mtr,mtr)
    .attr({
      // "fill":qpo.COLOR_DICT[color],
      "opacity":1,
      'stroke':qpo.COLOR_DICT[color],
      'stroke-width':qpo.unitStroke
    });
  this.phys = c.set();
  this.x = gx; //absolute grid position. (column, 0 to q-1)
  this.y = gy; //absolute grid position (row, 0 to q-1)
  this.num = num; //which unit is it? (# on team)
  this.alive = true;
  this.active = false;
  this.shotReady = true;
  this.bombReady = true;
  this.movingForward = false;
  this.spawnTimer = -1;

  switch(color){ //record the spawns, loading blue coords in first
    case "blue": {
      qpo.activeGame.record.unitSpawns[num] = [gx,gy];
      break;
    }
    case "red": {
      qpo.activeGame.record.unitSpawns[qpo.activeGame.po + num] = [gx,gy];
      break;
    }
    default: {
      console.log("this was unexpected");
      break;
    }
  }
  return this;
}
function improveUnit(unit){ //add the unit.rect to the unit.phys, and the unit.phys to the qpo.gui
  unit.phys.push(unit.rect);
  qpo.gui.push(unit.phys);
}
function finishUnit(unit){
  var mtr = qpo.guiDimens.squareSize;
  unit.activate = function(){
    unit.rect.attr({"stroke":qpo.COLOR_DICT["orange"], "stroke-width":4});
    unit.rect.toFront();
    unit.active = true;

  }
  unit.deactivate = function(){
    unit.rect.attr({inactiveUnit:unit.team});
    unit.active = false;
  }
  unit.reload = function(){
    unit.bombReady = true;
    unit.shotReady = true;
  }
  unit.reloadBomb = function(){
    unit.bombReady = true;
  }
  unit.reloadShot = function(){
    unit.shotReady =true;
  }
  unit.score = function(){
    unit.alive = false;
    unit.spawnTimer = qpo.spawnTimers[qpo.activeGame.po];
    unit.rect.stop();
    unit.rect.animate({"opacity":0},2000*qpo.timeScale,function(){
      unit.rect.hide();
      unit.rect.attr({"opacity":0.7});
    });
    if(qpo.mode == "game"){ //deal with scoreboard, AI, spawn, control panel, and ending game
      switch(unit.team){ // update scoreboard, prep to reward AI
        case qpo.otherTeam: //enemy team ("red" until server implementation)
          qpo.redDead++;
          qpo.scoreBoard.addPoint("red");
          qpo.redRewardQueue.push(-1); //is this backwards?
          break;
        case qpo.playerTeam: //player team ("blue" until server implementation)
          qpo.blueDead++;
          qpo.scoreBoard.addPoint("blue");
          var number = unit.num;
          qpo.redRewardQueue.push(1); //is this backwards?
          // controlPanel.actives[number].hide();
          // qpo.gui.push(controlPanel.actives[number]);
          // controlPanel.actives[number].show();
          controlPanel.changeIcon("death");
          qpo.updateBlueAU(qpo.activeGame.po);
          controlPanel.disable();
          break;
      }
      if (qpo.scoreBoard.blueScore >= qpo.activeGame.scoreToWin  //if score limit reached, disable respawn
        || qpo.scoreBoard.redScore >= qpo.activeGame.scoreToWin){
        qpo.activeGame.respawnEnabled = false;
      }
      if (qpo.activeGame.respawnEnabled) { //queue the spawn if respawn is on
        // Get current turn number, add 5 to it, and spawn the unit then:
        var thisTurn = qpo.activeGame.turnNumber;
        var spawnTurn = thisTurn + unit.spawnTimer + 1;
        qpo.activeGame.upcomingSpawns.push([spawnTurn,unit.num,unit.team]); //add spawn to queue (checked from newTurn())
      }
      else if (qpo.scoreBoard.redScore >= qpo.activeGame.scoreToWin // otherwise, end the game, if score limit reached.
        || qpo.scoreBoard.blueScore >= qpo.activeGame.scoreToWin && qpo.activeGame.isEnding == false){
        var gameResult;
        setTimeout(function(){ //set gameResult to "tie","blue",or "red" (after 20 ms to account for performance issues)
          if(qpo.scoreBoard.redScore==qpo.scoreBoard.blueScore){
            gameResult = "tie";
          } else if (qpo.scoreBoard.blueScore > qpo.scoreBoard.redScore) {
            gameResult = "blue";
          } else {
            gameResult = "red";
          }
        }, 2000*qpo.timeScale);
        qpo.blueActiveUnit = -1;
        qpo.redActiveUnit = -1;
        qpo.activeGame.isEnding = true;
        setTimeout(function(){endGame(gameResult);}, 2000*qpo.timeScale);
      }
    }
  }
  unit.kill = function(){
    unit.alive = false;
    unit.spawnTimer = qpo.spawnTimers[qpo.activeGame.po];
    unit.rect.stop();
    unit.rect.animate({"opacity":0},2000*qpo.timeScale,function(){
      unit.rect.hide();
      unit.rect.attr({"opacity":1});
    });
    if(qpo.mode == "game"){ //deal with scoreboard, AI, spawn, control panel, and ending game
      switch(unit.team){ // update scoreboard, prep to reward AI
        case qpo.otherTeam: //enemy team ("red" until server implementation)
          qpo.redDead++;
          qpo.scoreBoard.addPoint("blue");
          qpo.redRewardQueue.push(1); //is this backwards?
          break;
        case qpo.playerTeam: //player team ("blue" until server implementation)
          qpo.blueDead++;
          qpo.scoreBoard.addPoint("red");
          var number = unit.num;
          qpo.redRewardQueue.push(-1); //is this backwards?
          // controlPanel.actives[number].hide();
          // qpo.gui.push(controlPanel.actives[number]);
          // controlPanel.actives[number].show();
          controlPanel.changeIcon("death");
          qpo.updateBlueAU(qpo.activeGame.po);
          controlPanel.disable();
          break;
      }
      if (qpo.scoreBoard.blueScore >= qpo.activeGame.scoreToWin  //if score limit reached, disable respawn
        || qpo.scoreBoard.redScore >= qpo.activeGame.scoreToWin){
        qpo.activeGame.respawnEnabled = false;
      }
      if (qpo.activeGame.respawnEnabled) { //queue the spawn if respawn is on
        // Get current turn number, add 5 to it, and spawn the unit then:
        var thisTurn = qpo.activeGame.turnNumber;
        var spawnTurn = thisTurn + unit.spawnTimer + 1;
        qpo.activeGame.upcomingSpawns.push([spawnTurn,unit.num,unit.team]); //add spawn to queue (checked from newTurn())
      }
      else if (qpo.scoreBoard.redScore >= qpo.activeGame.scoreToWin // otherwise, end the game, if score limit reached.
        || qpo.scoreBoard.blueScore >= qpo.activeGame.scoreToWin && qpo.activeGame.isEnding == false){
        var gameResult;
        setTimeout(function(){ //set gameResult to "tie","blue",or "red" (after 20 ms to account for performance issues)
          if(qpo.scoreBoard.redScore==qpo.scoreBoard.blueScore){
            gameResult = "tie";
          } else if (qpo.scoreBoard.blueScore > qpo.scoreBoard.redScore) {
            gameResult = "blue";
          } else {
            gameResult = "red";
          }
        }, 2000*qpo.timeScale);
        qpo.blueActiveUnit = -1;
        qpo.redActiveUnit = -1;
        qpo.activeGame.isEnding = true;
        setTimeout(function(){endGame(gameResult);}, 2000*qpo.timeScale);
      }
    }
  }
  unit.spawn = function(){ //call this at the moment you want a new unit to spawn
    var spawnLoc = qpo.findSpawn(unit.team); //get the [row, column] for the spawn (loc is location)
    //put the unit at its spawn, show the unit, and set its "alive" property to "true":
    var spawnSpot = [ //raph x,y coords of spawn
      qpo.guiCoords.gameBoard.leftWall + mtr*spawnLoc[1],
      qpo.guiCoords.gameBoard.topWall + mtr*spawnLoc[0]
    ]
    // if(typeof spawnSpot[1] != "number"){ //console.log some stuff
    //   console.log("NaN happening... chosen spawn was " + spawnLoc);
    //   console.log(typeof spawnSpot[1]);
    // }
    // if(typeof spawnSpot[0] != "number"){ //console.log some stuff
    //   console.log("NaN happening... chosen spawn was " + spawnLoc);
    //   console.log(typeof spawnSpot[1]);
    // }
    // console.log(spawnSpot, spawnLoc);
    unit.rect.attr({'x': spawnSpot[0], 'y': spawnSpot[1]}); //put the Raph element where it goes
    unit.x = spawnLoc[1]; //update the grid positions, for qpo.snap
    unit.y = spawnLoc[0]; //update the grid positions, for qpo.snap
    unit.rect.show();
    unit.alive = true;
    (unit.team == "red") ? (qpo.redDead -= 1) : (qpo.blueDead -= 1);
  };
  unit.instakill = function(){ //for in-menu units
    unit.alive = false;
    unit.rect.remove();
  }
  unit.moveLeft = function(){ //animate the unit, update unit.x, record move
    unit.movingForward = false;
    if (unit.rect.attr('x') > qpo.guiCoords.gameBoard.leftWall || qpo.mode == "menu") {
      unit.rect.stop();
      /* use for slide-style of play (units don't stop unless told to)
      unit.rect.stop();
      var anim = Raphael.animation( {"x":unit.rect.attr('x') - qpo.guiDimens.columns*mtr },
        qpo.guiDimens.columns*1500*qpo.timeScale); //over the course of n turns, send the unit 2n squares to the left
      */

      //use for stop-style of play (units stop after each turn)
      var anim = Raphael.animation( {"x":unit.rect.attr('x') - 2*mtr },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2 squares to the left
      unit.rect.animate(anim);
      if (unit.x == 1){ unit.x = 0; } //update unit.x, accounting for proximity to wall
      else { unit.x -= 2; }
      unit.movingForward = false;
    }
    switch(unit.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(1);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(1);
        break;
      }
      default: { "this was unexpected"; }
    }
  }
  unit.moveUp = function(){
    unit.movingForward = false;
    if (unit.y == 0 && unit.team == "red") {unit.score()} //score for red
    if (unit.rect.attr('y') > qpo.guiCoords.gameBoard.topWall) { //move the unit if it's not on the top wall
      unit.rect.stop();

      /*
      var anim = Raphael.animation( {"y":unit.rect.attr('y') - qpo.guiDimens.rows*mtr},
        qpo.guiDimens.rows*1500*qpo.timeScale);
      */
      var anim = Raphael.animation( {"y":unit.rect.attr('y') - 2*mtr },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2n squares to the left
      unit.rect.animate(anim);
      if (unit.y == 1){ unit.y = 0; } //update unit.x, accounting for proximity to wall
      else { unit.y -= 2; }
      if (unit.team == "red"){ unit.movingForward = true; }
      else { unit.movingForward = false; }
    }
    switch(unit.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(2);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(2);
        break;
      }
      default: {
        "this was unexpected";
      }
    }
  }
  unit.moveRight = function(){
    if (unit.rect.attr('x') + unit.rect.attr('width') < qpo.guiCoords.gameBoard.rightWall || qpo.mode == "menu") {
      /* slide-style
      unit.rect.stop();
      var anim = Raphael.animation( {"x":unit.rect.attr('x') + qpo.guiDimens.columns*mtr},
        qpo.guiDimens.columns*1500*qpo.timeScale);
      */
      var anim = Raphael.animation( {"x":unit.rect.attr('x') + 2*mtr },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2n squares to the left
      unit.rect.animate(anim);
      if (unit.x == qpo.activeGame.q-2 ){ unit.x = qpo.activeGame.q-1; } //update unit.x, accounting for proximity to wall
      else { unit.x += 2; }
      unit.movingForward = false;
    }
    switch(unit.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(3);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(3);
        break;
      }
      default: {
        "this was unexpected";
      }
    }
  }
  unit.moveDown = function(){
    if (unit.y == (qpo.activeGame.q-1) && unit.team == "blue") {unit.score()} //score for blue
    if (unit.rect.attr('y') + unit.rect.attr('height') < qpo.guiCoords.gameBoard.bottomWall) { // if unit not on bottom wall...
      unit.movingForward = false;
      unit.rect.stop();
      /*
      var anim = Raphael.animation( {"y":unit.rect.attr('y') + qpo.guiDimens.rows*mtr},
        qpo.guiDimens.rows*1500*qpo.timeScale);
      */

      var anim = Raphael.animation( {"y":unit.rect.attr('y') + 2*mtr },
        3000*qpo.timeScale); //over the course of a turn, send the unit 2n squares to the left
      unit.rect.animate(anim);
      if (unit.y == qpo.activeGame.q-2 ){ unit.y = qpo.activeGame.q-1; } //update unit.x, accounting for proximity to wall
      else { unit.y += 2; }
      if (unit.team == "blue"){ unit.movingForward = true; }
      else { unit.movingForward = false; }
    }
    switch(unit.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(4);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(4);
        break;
      }
      default: {
        "this was unexpected";
      }
    }
  }
  unit.bomb = function(){
    unit.movingForward = false;
    var bomb;
    bomb = new startBomb(unit);
    improveBomb(bomb);
    finishBomb(bomb);
    bomb.next();
    unit.bombReady = false;
    setTimeout(unit.reloadBomb,3000*qpo.timeScale);
    if(qpo.mode=="menu"){ //put the bomb's phys in the correct layer
      bomb.phys.toBack();
      try{qpo.menus.main.blackness.toBack();}
      catch(e){}
      try{qpo.menus.title.blackness.toBack();}
      catch(e){}
    }
    switch(unit.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(5);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(5);
        break;
      }
      default: {
        "this was unexpected";
      }
    }
  }
  unit.shoot = function(){
    unit.movingForward = false;
    var shot, anim;
    switch(unit.team){ //create the shot and the correct animation based on if the unit is moving forward
      case "blue":
        shot = c.rect(unit.rect.attr('x') + 22*mtr/50,
                      unit.rect.attr('y') + unit.rect.attr('height') + 2*mtr/50,
                      6*mtr/50, 2*mtr/50);
        anim = Raphael.animation({"height":25*mtr/50}, 500*qpo.timeScale,
          function(){ shot.animate({"y": shot.attr('y') + 2.5*mtr*qpo.activeGame.q},
            3000*qpo.activeGame.q*qpo.timeScale);
        });
        if (unit.movingForward){
          anim = Raphael.animation({"height":25*mtr/50, "y": shot.attr('y') + mtr/6 + 10*mtr/50}, 500*qpo.timeScale,
            function(){ shot.animate({"y": shot.attr('y') + 2.5*mtr*qpo.activeGame.q},
              3000*qpo.activeGame.q*qpo.timeScale); //make the shot move at 2.5 units per turn
          });
        }
        break;
      case "red":
        shot = c.rect(unit.rect.attr('x') + 22*mtr/50,
                      unit.rect.attr('y') - 4*mtr/50,
                      6*mtr/50, 2*mtr/50);
        anim = Raphael.animation({"height":0.5*mtr, "y": shot.attr('y') - 0.5*mtr}, 500*qpo.timeScale,
          function(){
            shot.animate({"y": shot.attr('y') - 2.5*mtr*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
          }
        );
        if (unit.movingForward){
          anim = Raphael.animation({"height":0.5*mtr, "y": shot.attr('y') - 0.5*mtr - mtr/6 - 10*mtr/50}, 500*qpo.timeScale,
            function(){
              shot.animate({"y": shot.attr('y') - 2.5*mtr*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
            }
          );
        }
        break;
    }
    shot.attr({
      "fill":qpo.COLOR_DICT["green"],
      "opacity":0.9
    });
    shot.data("team",unit.team);
    shot.animate(anim);
    qpo.gui.push(shot);
    qpo.shots.push(shot);
    unit.shotReady = false;
    setTimeout(unit.reloadShot,3000*qpo.timeScale);
    switch(unit.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(6);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(6);
        break;
      }
      default: {
        "this was unexpected";
      }
    }
  }
  unit.stay = function(){
    unit.rect.stop();
    switch(unit.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(7);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(7);
        break;
      }
      default: {
        "this was unexpected";
      }
    }
  }
}

function makeUnit(color,gx,gy,num){
  var unit = new startUnit(color,gx,gy,num);
  improveUnit(unit);
  finishUnit(unit);

  return unit;
}
