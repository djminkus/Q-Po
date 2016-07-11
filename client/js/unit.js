c.customAttributes.inactiveUnit = function(teamColor){
  return {
    "stroke":qpo.COLOR_DICT[teamColor],
    "stroke-width": qpo.unitStroke,
    'opacity': 1
  }
}

qpo.circleAtts = function(color){ //attributes for the neutral/stay icon
  return {
    'stroke':qpo.COLOR_DICT[color],
    'stroke-width':qpo.iconStroke,
    'fill':qpo.COLOR_DICT[color],
    'r':qpo.guiDimens.squareSize/12
  }
}
qpo.shotAtts = {
  "opacity":1,
  'stroke': qpo.COLOR_DICT["green"],
  'stroke-width':2
}
qpo.scr = 2 //shot corner radius
qpo.levelTurns = [2,3,5,8] //qpo.levelTurns[level-1] gives how many turns it takes to get to that level from previous level
qpo.levelSAs = ['.', '..-', '-', ''] //stroke-dasharrays for each level

qpo.Unit = function(color, gx, gy, num){ //DEFINE UNIT TYPE/CLASS
  // color is 'blue' or 'red' -- "Which team is the unit on?"
  // gx and gy are the initial grid values (the "spawn point, per se)
  // num is this unit's number (within its team)
  //   (For now, only blue units are numbered (6-20-15) )

  var mtr = qpo.guiDimens.squareSize; //mtr for meter, like, a unit of length
  this.mtr = mtr;

  var lw = qpo.board.lw; //left wall, for convenience
  var tw = qpo.board.tw; //top wall

  this.team = color; //"red" or "blue"
  this.x = gx; // grid position. (column number, 0 to q-1)
  this.y = gy; // grid position (row number, 0 to q-1)
  this.tx = function(){return (mtr*this.x);}.bind(this); //raphael transform, x value
  this.ty = function(){return (mtr*this.y);}.bind(this); //raphael transform, y value
  this.trans = function(){return ('t'+this.tx()+','+this.ty())};
  this.search = function(dir){
    // console.log('search begun at ind ' + this.num);
    var ind = this.num; //index (num) of found unit
    var row = this.y; //row being searched
    var col = this.x; //column being searched
    var colSep = 0; //column separation
    var rowSep = 0; //row separation
    var tries = 0;
    var looking = true;
    switch(dir){
      case 'left':
        while(looking){
          col -= 1; //move on to the next leftmost column
          if (col == -2){col=qpo.activeGame.q-1} //if off board, roll over to right end
          row = this.y; //reset row
          rowSep = 0; // and rowSep
          // console.log('looking at column ' + col);
          for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru rows
            if(Math.pow(-1,i) == -1){rowSep++;} // if i is odd, look further away, columnwise
            row = this.y + rowSep*Math.pow(-1,i); //select a row to look in
            if (row < -1 || row > qpo.activeGame.q) {row = this.y + rowSep*Math.pow(-1, i+1)} //don't allow non-rows
            for(var j=0; j<qpo.activeGame.po; j++){
              if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                  (col == qpo.blue.units[j].x == -1) )
                  && qpo.blue.units[j].spawnTimer < 1) {
                ind = qpo.blue.units[j].num;
                looking=false;
              } //found it!
            }
          }
          tries++;
          if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
        }
        break;
      case 'up':
        while(looking){ //iterate through rows
          row -= 1; //move on to the next upmost row
          if (row == -2){row=qpo.activeGame.q-1} //if off board, roll over to bottom
          col = this.x; //reset col
          colSep = 0; // and colSep
          // console.log('looking at row ' + row);
          for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru cols
            if(Math.pow(-1,i) == -1){colSep++;} // if i is odd, look further away, columnwise
            col = this.x + colSep*Math.pow(-1,i); //select a col to look in
            if (col < -1 || col > qpo.activeGame.q) {col = this.x + colSep*Math.pow(-1, i+1)} //don't allow non-cols
            for(var j=0; j<qpo.activeGame.po; j++){
              if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                  (row == qpo.blue.units[j].x == -1) )
                  && qpo.blue.units[j].spawnTimer < 1) {
                ind = qpo.blue.units[j].num;
                looking=false;
              } //found it!
            }
          }
          tries++;
          if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
        }
        break;
      case 'right':
        while(looking){
          col += 1; //move on to the next leftmost column
          if (col == qpo.activeGame.q){col = -1} //if off board, roll over to left end (spawners)
          row = this.y; //reset row
          rowSep = 0; // and rowSep
          // console.log('looking at column ' + col);
          for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru rows
            if(Math.pow(-1,i) == -1){rowSep++;} // if i is odd, look further away, columnwise
            row = this.y + rowSep*Math.pow(-1,i); //select a row to look in
            if (row < -1 || row > qpo.activeGame.q) {row = this.y + rowSep*Math.pow(-1, i+1)} //don't allow non-rows
            for(var j=0; j<qpo.activeGame.po; j++){
              if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                  (col == qpo.blue.units[j].x == -1) )
                  && qpo.blue.units[j].spawnTimer < 1) {
                ind = qpo.blue.units[j].num;
                looking=false;
              } //found it!
            }
          }
          tries++;
          if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
        }
        break;
      case 'down':
        while(looking){ //iterate through rows
          row += 1; //move on to the next downmost row
          if (row == qpo.activeGame.q){row = -1} //if off board, roll over to bottom
          col = this.x; //reset col
          colSep = 0; // and colSep
          // console.log('looking at row ' + row);
          for(var i=0; i<qpo.activeGame.q; i++){ //iterate thru cols
            if(Math.pow(-1,i) == -1){colSep++;} // if i is odd, look further away, columnwise
            col = this.x + colSep*Math.pow(-1,i); //select a col to look in
            if (col < -1 || col > qpo.activeGame.q) {col = this.x + colSep*Math.pow(-1, i+1)} //don't allow non-cols
            for(var j=0; j<qpo.activeGame.po; j++){
              if (((qpo.blue.units[j].x == col && qpo.blue.units[j].y == row) ||
                  (row == qpo.blue.units[j].x == -1) )
                  && qpo.blue.units[j].spawnTimer < 1) {
                ind = qpo.blue.units[j].num;
                looking=false;
              } //found it!
            }
          }
          tries++;
          if(tries == qpo.activeGame.q){looking=false;} //no other active unit available. Stop looking.
        }
        break;
      default:
        console.log('HELLO FROM THE OTHER SIIIIIIIIDE');
    }
    this.deactivate();
    qpo.blue.units[ind].activate();
    // console.log('search complete, found index ' + ind)
  }

  this.nx = null; //next x
  this.ny = null; //nexy y
  this.ntx = function(){return mtr*this.nx}; //next transform x
  this.nty = function(){return mtr*this.ny}; //next transform x
  this.ntrans = function(){return ('t'+this.ntx()+','+this.nty())};

  this.rect = c.rect(lw,tw,mtr,mtr).attr({
      "fill":qpo.COLOR_DICT[color],
      'fill-opacity': 0.10,
      "opacity":1,
      'stroke-opacity':1,
      'stroke':qpo.COLOR_DICT[color],
      'stroke-width': qpo.unitStroke,
      'stroke-dasharray': qpo.levelSAs[0]
    });
  this.icon = c.circle(lw + mtr/2, tw + mtr/2).attr(qpo.circleAtts(color));
  this.phys = c.set(this.rect, this.icon);
  this.snap = function(){this.phys.attr({'transform':this.trans()});} //.bind(this) if glitchy

  this.level = 1;
  this.turnsToNextLevel = qpo.levelTurns[0];
  this.setLevel = function(newLevel){
    if (newLevel < 1){this.level = 1} //don't allow level to go below 1
    else if (newLevel > 4){this.level = 4} //don't allow level to go above 4
    else{ this.level = newLevel }
    this.rect.attr({'stroke-dasharray':qpo.levelSAs[this.level-1]});
    this.turnsToNextLevel = qpo.levelTurns[this.level-1];
    switch(this.level){ //unused for now
      case 1: {
        // this.rect.attr({'stroke-dasharray':'.'});
        break;
      }
      case 2: {
        // this.rect.attr({'stroke-dasharray':'..-'});
        break;
      }
      case 3: {
        // this.rect.attr({'stroke-dasharray':'-'});
        break;
      }
      case 4: {
        // this.rect.attr({'stroke-dasharray':''})
        break;
      }
      default: {console.log('this was unexpected.')}
    }
  }
  this.levelUp = function(){ this.setLevel(this.level+1) };
  this.levelDown = function(){ this.setLevel(this.level-1) };
  this.resetLevel = function(){ this.setLevel(1) };
  this.updateLevel = function(){
    this.turnsToNextLevel--;
    if (this.turnsToNextLevel<0){this.levelUp()}
  }

  this.num = num || 0; //which unit is it? (# on team)
  this.alive = true;
  this.active = false; //is it highlighted?
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
      'stroke-width':qpo.unitStroke*mtr/50,
      'fill':qpo.COLOR_DICT[color]
    });
    this.spawnText = c.text(six, siy, 0).attr({qpoText:[10]});
    this.spawnIconSet = c.set().push(this.spawnIcon, this.spawnText).hide();
    this.rects = c.set().push(this.rect, this.spawnIcon);
    qpo.gui.push(this.spawnIconSet);
  }
  this.showSpawnIcon = function(){ //change the digit and fade in the set
    this.spawnText.attr({'text':this.spawnTimer});
    this.spawnIconSet.show();
    qpo.fadeIn(this.spawnIconSet, 2000*qpo.timeScale);
  }
  this.rects = c.set(this.rect, this.spawnIcon);
  this.nextAction = 'stay';

  this.snap();
  try{ //record the unit's initial spawn to the game record, loading blue coords in first
    switch(color){
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
  }
  catch(err){;} //in menu; no active game defined, so catch the error that generates and do nothing.

  qpo.gui.push(this.phys);

  //METHODS
  var easingType = '>';
  this.order = function(order){ // Set the unit's icon, deactivate the unit, and add order to queue.
    this.setIcon(order);
    this.deactivate();
    // qpo.blueMovesQueue[qpo.blueActiveUnit] = order;
    this.nextAction = order;
    if (!this.alive || this.willScore){ this.icon.hide();}
  }
  this.setIcon = function(order){
    this.phys.exclude(this.icon);
    this.icon.remove(); //remove the old icon from the paper
    var newIcon;
    var color = qpo.COLOR_DICT[this.team];
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
        newIcon = c.rect(lw+mtr/2-2, tw+mtr/2-7.5, 4, 15, 2).attr({
          // "fill":qpo.COLOR_DICT['green'],
          'stroke':qpo.COLOR_DICT['green'],
          'stroke-width':2
        });
        break;
      case 'bomb':
        newIcon = c.rect(lw+mtr/2 - 5, tw+mtr/2 - 5, 10*mtr/50, 10*mtr/50, 2).attr({
          // "fill":qpo.COLOR_DICT['purple'],
          'stroke':qpo.COLOR_DICT['purple'],
          'stroke-width':3,
        });
        break;
      case 'stay':
        newIcon = c.circle(lw+mtr/2, tw+mtr/2, mtr/10).attr(qpo.circleAtts(this.team));
        break;
      default:
        console.log('this was unexpected');
        console.log(order)
    }
    newIcon.attr({'transform':'t'+this.tx()+','+this.ty()});
    this.phys.push(newIcon);
    this.icon = newIcon;
  }
  this.resetIcon = function(){
    this.phys.exclude(this.icon);
    this.icon.remove();
    this.icon = c.circle(lw + mtr/2, tw + mtr/2, mtr/7).attr(qpo.circleAtts(this.team));
    this.phys.push(this.icon);
    this.snap();
    if(!this.alive){
      this.icon.hide();
      if (this.team == qpo.playerTeam){this.spawnText.attr({'text':this.spawnTimer});}
      if (this.spawnTimer == 0){ //let the player queue a move in the spawn icon
        // this.spawnText.hide();
      }
    }
  }
  this.randomIcon = function(){ //randomize the unit's icon (for title screen)
    var choice = Math.floor(7*Math.random());
    this.setIcon(qpo.moves[choice]);
  }
  this.activate = function(){
    var pinchEls = qpo.pinch(this.rect);
    this.turnOrange = setTimeout(function(){this.rects.attr({"stroke":qpo.COLOR_DICT["orange"]})}.bind(this), 200);
    setTimeout(function(){pinchEls.remove()}.bind(this), 200);
    if(!this.alive){ this.phys.hide(); };
    this.phys.toFront();
    this.active = true;
    qpo.blueActiveUnit = this.num;
  }
  this.deactivate = function(){
    clearTimeout(this.turnOrange);
    if(this.team == qpo.playerTeam){ this.rects.attr({inactiveUnit:this.team}); }
    else { this.rect.attr({inactiveUnit:this.team}); }
    this.active = false;
  }

  this.score = function(why){
    // console.log('scored via ' + why + ' on turn ' + qpo.activeGame.turnNumber);
    this.alive = false;
    this.willScore = false;
    this.deactivate();
    this.spawnTimer = qpo.spawnTimers[qpo.activeGame.po];
    if (this.team==qpo.playerTeam){this.showSpawnIcon()}
    // this.phys.stop();
    this.phys.animate({"opacity":0}, 2000*qpo.timeScale);
    // console.log('this '+this.num +' scored');
    setTimeout(function(){ //hide the visage and move it "off the board"
      this.phys.hide();
      this.x = -1;
      this.y = -1;
      this.phys.attr({'opacity':1, 'transform':this.trans()});
    }.bind(this), 2000*qpo.timeScale)
    if(qpo.mode == "game"){ //deal with scoreboard, AI, spawn, control panel, and ending game
      switch(this.team){ // update scoreboard, prep to reward AI
        case qpo.otherTeam: //enemy team ("red" until server implementation)
          qpo.scoreboard.addPoint("red");
          qpo.redRewardQueue.push(-1); //is this backwards?
          break;
        case qpo.playerTeam: //player team ("blue" until server implementation)
          qpo.scoreboard.addPoint("blue");
          qpo.redRewardQueue.push(1); //is this backwards?
          if(this.active){qpo.updateBlueAU(qpo.activeGame.po);}
          break;
      }
      if (qpo.scoreboard.blueScore >= qpo.activeGame.scoreToWin  //if score limit reached, disable respawn
        || qpo.scoreboard.redScore >= qpo.activeGame.scoreToWin){
        qpo.activeGame.respawnEnabled = false;
      }
      if (qpo.activeGame.respawnEnabled) { this.nextAction = 'recharge'; } //start counting down spawn timer
      else if (qpo.scoreboard.redScore >= qpo.activeGame.scoreToWin // otherwise, end the game, if score limit reached.
        || qpo.scoreboard.blueScore >= qpo.activeGame.scoreToWin && qpo.activeGame.isEnding == false){
        var gameResult;
        setTimeout(function(){ //set gameResult to "tie","blue",or "red" (after 20 ms to account for performance issues)
          if(qpo.scoreboard.redScore==qpo.scoreboard.blueScore){
            gameResult = "tie";
          } else if (qpo.scoreboard.blueScore > qpo.scoreboard.redScore) {
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
  this.kill = function(){
    this.alive = false;
    this.willScore = false;
    this.deactivate();
    this.spawnTimer = qpo.spawnTimers[qpo.activeGame.po];
    if(this.team==qpo.playerTeam){ this.showSpawnIcon(); }
    this.icon.attr({'opacity':0});
    this.phys.animate({ "opacity":0 }, 2000*qpo.timeScale);
    this.rect.animate({ 'height':0, 'width':0 }, 2000*qpo.timeScale)
    setTimeout(function(){ //hide the visage and move it "off the board"
      this.phys.hide();
      this.x = -1;
      this.y = -1;
      this.phys.attr({'opacity':1, 'transform':this.trans()});
    }.bind(this), 2000);
    if(qpo.mode == "game"){ //deal with scoreboard, AI, spawn, control panel, and ending game
      switch(this.team){ // update scoreboard, prep to reward AI
        case qpo.otherTeam: //enemy team ("red" until server implementation)
          qpo.scoreboard.addPoint("blue");
          qpo.redRewardQueue.push(1); //is this backwards?
          break;
        case qpo.playerTeam: //player team ("blue" until server implementation)
          qpo.scoreboard.addPoint("red");
          var number = this.num;
          qpo.redRewardQueue.push(-1); //is this backwards?
          if (this.active){qpo.updateBlueAU(qpo.activeGame.po);}
          // controlPanel.disable();
          break;
      }
      if (qpo.scoreboard.blueScore >= qpo.activeGame.scoreToWin  //if score limit reached, disable respawn
        || qpo.scoreboard.redScore >= qpo.activeGame.scoreToWin){
        qpo.activeGame.respawnEnabled = false;
      }
      if (qpo.activeGame.respawnEnabled) { this.nextAction = 'recharge' }
      else if (qpo.scoreboard.redScore >= qpo.activeGame.scoreToWin // otherwise, end the game, if score limit reached.
        || qpo.scoreboard.blueScore >= qpo.activeGame.scoreToWin && qpo.activeGame.isEnding == false){
        var gameResult;
        setTimeout(function(){ //set gameResult to "tie","blue",or "red" (after 20 ms to account for performance issues)
          if(qpo.scoreboard.redScore==qpo.scoreboard.blueScore){
            gameResult = "tie";
          } else if (qpo.scoreboard.blueScore > qpo.scoreboard.redScore) {
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
  this.recordMove = function(move){
    switch(this.team){ //record the move (in qpo.activeGame.record)
      case "blue": {
        qpo.activeGame.record.blueMoves.push(move);
        break;
      }
      case "red": {
        qpo.activeGame.record.redMoves.push(move);
        break;
      }
      default: { "this was unexpected"; }
    }
  }

  var self = this;
  this.actions = {
    'moveUp' : function(){ self.move('up') }.bind(self),
    'moveRight' : function(){ self.move('right')}.bind(self),
    'moveDown' : function(){ self.move('down') }.bind(self),
    'moveLeft' : function(){ self.move('left') }.bind(self),
    'bomb' : function(){ self.bomb() }.bind(self),
    'shoot' : function(){ self.shoot() }.bind(self),
    'stay' : function(){ self.stay() }.bind(self),
    'spawn' : function(){ self.spawn() }.bind(self),
    'recharge' : function(){ self.recharge() }.bind(self)
  }
  this.move = function(dir){
    switch(dir){
      case 'up':{
        if (this.y == 0){ //check if red, and if so, score.
          if (this.team == 'red'){
            this.y = -1 ;
            this.score();
          }
        }
        else { this.y -= 1 ;}
        break;}
      case 'right':{
        if (this.x != qpo.activeGame.q-1){ this.x += 1; }
        break;}
      case 'down':{
        if (this.y == qpo.activeGame.q-1){ //bottom wall: score blue.
          if (this.team == 'blue'){ //score
            this.y = qpo.activeGame.q;
            this.score();
          }
        }
        else { this.y += 1 ; }
        break;}
      case 'left':{
        if (this.x != 0) { this.x -= 1; }
        // this.moveLeft();
        break;}
      default:{
        console.log('idiots say what?');
      }
    }
    this.phys.animate({'transform':this.trans()}, 3000*qpo.timeScale, easingType); //move that son of a gun
    if ((dir == 'up' && this.team == 'red') || (dir=='down' && this.team =='blue')) {this.movingForward = true;}
    else {this.movingForward = false;}
    this.recordMove(dir);
  }
  this.bomb = function(){
    this.movingForward = false;
    var bomb;
    bomb = new qpo.Bomb(this);
    bomb.next();
    if(qpo.mode=="menu"){ //put the bomb's phys in the correct layer
      bomb.phys.toBack();
      try{qpo.menus.main.blackness.toBack();}
      catch(e){}
      try{qpo.menus.title.blackness.toBack();}
      catch(e){}
    }
    switch(this.team){ //record the move (in qpo.activeGame.record)
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
  this.shoot = function(){
    this.movingForward = false;
    var width = 4;
    var height = 20;
    var speed = 4; // in units per turn
    var lw = qpo.board.lw;
    var tw = qpo.board.tw;
    var shot, anim;
    switch(this.team){ //create the shot and the correct animation based on if the unit is moving forward
      case "blue":
        shot = c.rect(lw+this.x*mtr + mtr*(25-width/2)/50,
                      tw+this.y*mtr + this.rect.attr('height') + 2*mtr/50,
                      mtr*width/50, mtr*2/50, qpo.scr);
        anim = Raphael.animation({"height":height*mtr/50}, 500*qpo.timeScale,
          function(){ shot.animate({"y": shot.attr('y') + speed*mtr*qpo.activeGame.q},
            3000*qpo.activeGame.q*qpo.timeScale);
        });
        if (this.movingForward){
          anim = Raphael.animation({"height":height*mtr/50, "y": shot.attr('y') + mtr/6 + 10*mtr/50}, 500*qpo.timeScale,
            function(){ shot.animate({"y": shot.attr('y') + speed*mtr*qpo.activeGame.q},
              3000*qpo.activeGame.q*qpo.timeScale); //make the shot move at 2.5 units per turn
          });
        }
        break;
      case "red":
        shot = c.rect(lw+this.x*mtr + mtr*(25-width/2)/50,
                      tw+this.y*mtr - mtr*4/50,
                      mtr*width/50, mtr*2/50, qpo.scr);
        anim = Raphael.animation({"height":height*mtr/50, "y": shot.attr('y') - 0.5*mtr}, 500*qpo.timeScale,
          function(){
            shot.animate({"y": shot.attr('y') - speed*mtr*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
          }
        );
        if (this.movingForward){
          anim = Raphael.animation({"height":height*mtr/50, "y": shot.attr('y') - height*mtr/50 - mtr/6 - 10*mtr/50}, 500*qpo.timeScale,
            function(){
              shot.animate({"y": shot.attr('y') - speed*mtr*qpo.activeGame.q}, 3000*qpo.activeGame.q*qpo.timeScale);
            }
          );
        }
        break;
    }
    shot.attr(qpo.shotAtts);
    shot.data("team",this.team); //make it remember which team fired it
    shot.animate(anim);
    qpo.gui.push(shot);
    qpo.shots.push(shot);
    switch(this.team){ //record the move (in qpo.activeGame.record)
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
  this.stay = function(){
    this.rect.stop();
    switch(this.team){ //record the move (in qpo.activeGame.record)
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
  this.spawn = function(){ //call this at the moment you want a new unit to spawn
    this.spawnTimer = -1;
    this.resetLevel();
    var spawnLoc = qpo.findSpawn(this.team); //get the [row, column] for the spawn (loc is location)
    this.x = spawnLoc[1]; //update the grid positions, for qpo.snap
    this.y = spawnLoc[0]; //update the grid positions, for qpo.snap
    console.log(this.team + ' unit spawned at ' + this.x + ',' + this.y);
    this.snap();
    this.phys.show();
    this.phys.attr({'opacity':1});
    this.rect.attr({ 'height':this.mtr, 'width':this.mtr });
    if(this.spawnIconSet){this.spawnIconSet.hide();}
    this.alive = true;
  };
  this.recharge = function(){
    this.spawnTimer--;
    if(this.spawnTimer==0){this.nextAction='spawn'};
  }

  this.executeMove = function(){
    this.actions[this.nextAction]();
    if (this.alive){this.nextAction = 'stay';}
  }
  this.nextSpawn = -1; //turn number of this unit's next spawn

  return this;
}
