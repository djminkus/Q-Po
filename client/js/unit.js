c.customAttributes.inactiveUnit = function(teamColor){
  return {
    "stroke":qpo.COLOR_DICT[teamColor],
    "stroke-width": qpo.unitStroke,
    'opacity': 1
  }
}

//CREATE UNIT TYPE/CLASS
function startUnit(color, gx, gy, num){
  // color is 'blue' or 'red' -- "Which team is the unit on?"
  // gx and gy are the initial grid values (the "spawn point, per se)
  // num is this unit's number (within its team)
  //   (For now, only blue units are numbered (6-20-15) )

  var mtr = qpo.guiDimens.squareSize; //mtr for meter, like, a unit of length
  var lw = qpo.guiCoords.gameBoard.leftWall; //left wall
  var tw = qpo.guiCoords.gameBoard.topWall; //top wall

  this.team = color; //"red" or "blue"
  this.x = gx; // grid position. (column number, 0 to q-1)
  this.y = gy; // grid position (row number, 0 to q-1)
  this.tx = function(){ //raphael transform, x value
    return (mtr*this.x);
  }.bind(this)
  this.ty = function(){ //raphael transform, y value
    return (mtr*this.y)
  }.bind(this)
  this.rect = c.rect(lw,tw,mtr,mtr).attr({
      // "fill":qpo.COLOR_DICT['color'],
      "opacity":1,
      'stroke':qpo.COLOR_DICT[color],
      'stroke-width':qpo.unitStroke
    });
  this.icon = c.circle(lw + mtr/2, tw + mtr/2, mtr/10).attr({
    'stroke':qpo.COLOR_DICT[color],
    'stroke-width':2
  });
  this.phys = c.set(this.rect, this.icon);
  this.snap = function(){this.phys.attr({'transform':'t'+this.tx()+','+this.ty()});}

  this.num = num; //which unit is it? (# on team)
  this.alive = true;
  this.active = false; //is it highlighted?
  this.shotReady = true; //not in use
  this.bombReady = true; //not in use
  this.movingForward = false; //checked when this unit fires a shot, for animation purposes
  this.willScore = false;
  this.spawnTimer = -1; //how many turns until this unit spawns? (-1 if alive)
  if (qpo.mode !== 'menu' && color == qpo.playerTeam){ // Make the spawn icon.
    var bit = qpo.guiCoords.gameBoard.width/qpo.activeGame.po;
    var six = lw + (this.num*bit) + bit/2 ; //spawn icon x center
    var siy = tw-25; //spawn icon x center
    this.spawnIcon = c.rect(six - mtr/4, siy - mtr/4, mtr/2, mtr/2).attr({
      'opacity':1,
      'stroke':qpo.COLOR_DICT[color],
      'stroke-width':qpo.unitStroke*mtr/50
    });
    this.spawnText = c.text(six, siy, 0).attr({qpoText:[10]});
    this.spawnIconSet = c.set().push(this.spawnIcon, this.spawnText).hide();
  }
  this.doSpawnIcon = function(){
    this.spawnText.attr({'text':this.spawnTimer});
    this.spawnIconSet.show();
    qpo.fadeIn(this.spawnIconSet, 2000*qpo.timeScale);
  }

  this.snap();
  switch(color){ //record the unit's initial spawn to the game record, loading blue coords in first
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
  // unit.phys.push(unit.rect);
  qpo.gui.push(unit.phys);
}
function finishUnit(unit){
  var mtr = qpo.guiDimens.squareSize;
  var lw = qpo.guiCoords.gameBoard.leftWall;
  var tw = qpo.guiCoords.gameBoard.topWall;
  var easingType = 'linear';
  unit.order = function(order){ // Set the unit's icon, and deactivate the unit.
    unit.phys.exclude(unit.icon);
    unit.icon.remove(); //remove the old icon from the paper
    var newIcon;
    var color = qpo.COLOR_DICT[unit.team];
    // var args = [lw+mtr/2, tw+mtr/2, color, null];
    switch(order){ //add the new icon
      case 'moveUp':
        newIcon = qpo.arrow(lw+mtr/2, tw+mtr/2, color, 'up');
        // args[3] = 'up';
        break;
      case 'moveDown':
        newIcon = qpo.arrow(lw+mtr/2, tw+mtr/2, color, 'down');
        break;
      case 'moveLeft':
        newIcon = qpo.arrow(lw+mtr/2, tw+mtr/2, color, 'left');
        break;
      case 'moveRight':
        newIcon = qpo.arrow(lw+mtr/2, tw+mtr/2, color, 'right');
        break;
      case 'shoot':
        newIcon = c.rect(lw+mtr/2 -5, tw+mtr/2 -5, 10,10).attr({"fill":qpo.COLOR_DICT['green']});
        break;
      case 'bomb':
        newIcon = c.rect(lw+mtr/2 -5, tw+mtr/2 -5, 10,10).attr({"fill":qpo.COLOR_DICT['purple']});
        break;
      case 'stay':
        newIcon = c.circle(lw + mtr/2, tw + mtr/2, mtr/10).attr({
          'stroke':qpo.COLOR_DICT[color],
          'stroke-width':2,
          'fill':qpo.COLOR_DICT[color]
        });
        break;
      default:
        console.log('this was unexpected');
    }
    newIcon.attr({'transform':'t'+unit.tx()+','+unit.ty()});
    unit.phys.push(newIcon);
    unit.icon = newIcon;
    unit.deactivate();
    qpo.blueMovesQueue[qpo.blueActiveUnit] = order;
    if (!unit.alive || unit.willScore){ unit.icon.hide();}
  }.bind(unit);
  unit.resetIcon = function(){
    unit.phys.exclude(unit.icon);
    unit.icon.remove();
    unit.icon = c.circle(lw + mtr/2, tw + mtr/2, mtr/10*qpo.activeGame.scaling).attr({
      'stroke':qpo.COLOR_DICT[unit.team],
      'stroke-width':2
    });
    unit.phys.push(unit.icon);
    unit.snap();
    if(!unit.alive){
      unit.icon.hide();
      if (unit.team == qpo.playerTeam){unit.spawnText.attr({'text':unit.spawnTimer});}
      if (unit.spawnTimer == 0){ //let the player queue a move in the spawn icon
        // unit.spawnText.hide();
      }
    }
  }
  unit.activate = function(){
    unit.rect.attr({"stroke":qpo.COLOR_DICT["orange"]});
    if(!unit.alive){unit.phys.hide()};
    unit.phys.toFront();
    unit.active = true;
  }
  unit.deactivate = function(){
    unit.rect.attr({inactiveUnit:unit.team});
    unit.active = false;
  }
  unit.reloadBomb = function(){ // not in use
    unit.bombReady = true;
  }
  unit.reloadShot = function(){ // not in use
    unit.shotReady =true;
  }
  unit.score = function(){
    unit.alive = false;
    unit.willScore = false;
    unit.deactivate();
    unit.spawnTimer = qpo.spawnTimers[qpo.activeGame.po];
    if (unit.team==qpo.playerTeam){unit.doSpawnIcon()}
    unit.phys.stop();
    unit.phys.animate({"opacity":0},2000*qpo.timeScale);
    console.log('unit '+unit.num +' scored');
    setTimeout(function(){ //hide the visage and reset its position
      unit.phys.hide();
      unit.phys.attr({'opacity':1, 'transform':''});
    }, 2000*qpo.timeScale)
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
          qpo.redRewardQueue.push(1); //is this backwards?
          qpo.updateBlueAU(qpo.activeGame.po);
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
    unit.willScore = false;
    unit.deactivate();
    unit.spawnTimer = qpo.spawnTimers[qpo.activeGame.po];
    if(unit.team==qpo.playerTeam){ unit.doSpawnIcon(); }
    unit.phys.stop();
    unit.phys.animate({"opacity":0},2000*qpo.timeScale);
    setTimeout(function(){ //hide the visage and reset its position
      unit.phys.hide();
      unit.phys.attr({'opacity':1, 'transform':''});
    }, 2000);
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
          // controlPanel.changeIcon("death");
          qpo.updateBlueAU(qpo.activeGame.po);
          // controlPanel.disable();
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
    // if(typeof spawnSpot[1] != "number"){ //console.log some stuff
    //   console.log("NaN happening... chosen spawn was " + spawnLoc);
    //   console.log(typeof spawnSpot[1]);
    // }
    // if(typeof spawnSpot[0] != "number"){ //console.log some stuff
    //   console.log("NaN happening... chosen spawn was " + spawnLoc);
    //   console.log(typeof spawnSpot[1]);
    // }
    // console.log(spawnSpot, spawnLoc);
    unit.x = spawnLoc[1]; //update the grid positions, for qpo.snap
    unit.y = spawnLoc[0]; //update the grid positions, for qpo.snap
    unit.phys.attr({'transform': 't'+ unit.tx() + ',' +  unit.ty()}); //put the Raph element where it goes
    unit.phys.show();
    if(unit.spawnIconSet){unit.spawnIconSet.hide();}
    unit.alive = true;
    (unit.team == "red") ? (qpo.redDead -= 1) : (qpo.blueDead -= 1);
  };
  unit.instakill = function(){ //for in-menu units
    unit.alive = false;
    unit.rect.remove();
  }
  unit.moveLeft = function(){ //animate the unit, update unit.x, record move
    unit.movingForward = false;
    if (unit.x > 0) {
      if (unit.x == 1){ //unit will hit wall, do a half-animation
        unit.x = 0;
        var animLength = 1500*qpo.timeScale;
      }
      else { //unit is free to move two spaces
        unit.x -= 2;
        var animLength = 3000*qpo.timeScale;
      }
      var anim = Raphael.animation({'transform':('t' + unit.tx() +',' +unit.ty())}, animLength, easingType);
      unit.phys.animate(anim);
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
    if (unit.y > 0) { // move the unit
      unit.y -= 2;
      if (unit.y == -1){ // do a half-animation
        if (unit.team=='red'){unit.willScore=true;}
        else { unit.y = 0;}
      }
      var anim = Raphael.animation({'transform':('t' + unit.tx() + ','+ unit.ty())}, 3000*qpo.timeScale, easingType);
      unit.phys.animate(anim);
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
    if (unit.x < qpo.activeGame.q-1) {
      if (unit.x == qpo.activeGame.q-2 ){ //half-anim, wall hit
        unit.x = qpo.activeGame.q-1;
        var animLength = 1500*qpo.timeScale;
      }
      else { //full anim
        unit.x += 2;
        var animLength = 3000*qpo.timeScale;
      }
      var anim = Raphael.animation({'transform':('t' + unit.tx() +',' + unit.ty())}, animLength, easingType);
      unit.phys.animate(anim);
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
    if (unit.y < qpo.activeGame.q-1 ) { // if unit not on bottom wall, move it
      unit.movingForward = false;
      unit.y += 2;
      if (unit.y == qpo.activeGame.q){
        if(unit.team=='blue'){unit.willScore = true;}
        else{ unit.y--} // wall hit. Half-anim.
      }
      var anim = Raphael.animation({'transform':('t' + unit.tx() + ','+ unit.ty())}, 3000*qpo.timeScale, easingType);
      unit.phys.animate(anim);
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
    var lw = qpo.guiCoords.gameBoard.leftWall;
    var tw = qpo.guiCoords.gameBoard.topWall;
    switch(unit.team){ //create the shot and the correct animation based on if the unit is moving forward
      case "blue":
        shot = c.rect(lw+unit.x*mtr + 22*mtr/50,
                      tw+unit.y*mtr + unit.rect.attr('height') + 2*mtr/50,
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
        shot = c.rect(lw+unit.x*mtr + 22*mtr/50,
                      tw+unit.y*mtr - 4*mtr/50,
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
    shot.attr({ //color it and set its opacity
      "fill":qpo.COLOR_DICT["green"],
      "opacity":0.9
    });
    shot.data("team",unit.team); //make it remember which team fired it
    shot.animate(anim);
    qpo.gui.push(shot);
    qpo.shots.push(shot);
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
