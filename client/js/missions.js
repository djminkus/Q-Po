qpo.Mission = function(args){ //incomplete and unused class
  //args: [array of 2 strings, int, function]
  this.snippets = args[0] || ['',''];
  this.number = args[1] || -1; //mission number
  this.specifics = args[2] || function(){}; //a function to be executed when mission is begun

  this.begin = function(){
    this.textEls = c.set();
    for (var i=0; i<this.snippets.length; i++){ //create text els from snippets
      this.textEls.push(c.text(300, 40+i*25, this.snippets[i]).attr({qpoText:25}).hide());
    }
    qpo.gui.push(this.textEls);
    qpo.mode = 'game';
    this.specifics.call(this);
    qpo.activeMission = this;
  }
  this.end = function(){
    qpo.endGame('blue');
  }

  return this;
}

qpo.missions[1] = new qpo.Mission([['Use w/a/s/d to move the blue unit', 'across the enemy goal line.'],
    1, function(){ //specifics for mission 1:
    // qpo.timeScale = .45;
    qpo.activeGame = new qpo.Game(5,1,'campaign',false,false);

    var q = qpo.activeGame.q
    qpo.drawGUI(5, 1, 0.0, 50)
    qpo.timer.text.remove()
    qpo.scoreboard.all.remove()

    setTimeout(function(){ // Spawn a red and blue unit
      qpo.blue.units[0] = new qpo.Unit("blue",2,1,0);
      qpo.units.push(qpo.blue.units[0]);
      qpo.blue.units[0].phys.attr({'opacity':0});
      qpo.fadeIn(qpo.blue.units[0].phys, 1000, function(){});
      qpo.red.units[0] = new qpo.Unit("red",3,3,0);
      qpo.units.push(qpo.red.units[0]);
      qpo.red.units[0].phys.attr({'opacity':0});
      qpo.fadeIn(qpo.red.units[0].phys, 1000, function(){
        qpo.fadeIn(this.textEls, 1000);
      }.bind(this), function(){
        // qpo.blink(mts[0]); qpo.blink(mts[1])
      }.bind(this));
    }.bind(this), 1500);

    var newTurn = function(){ // called every time game clock is divisible by 3
      // qpo.activeGame.turnNumber++;
      qpo.activeGame.incrementTurn();
      qpo.timer.update();
      qpo.moment = new Date();

      //// MOVE EXECUTION SECTION
      qpo.snap(); //snap all units into their correct positions prior to executing new moves
      var po = qpo.activeGame.po; //for convenience
      var ru = null; //red unit, for convenience
      var bu = null; //blue unit, for convenience
      for (var i=0; i<po; i++){ //Execute the user's move
        bu = qpo.activeGame.teams.blue.units[i];

        bu.executeMove();
        bu.resetIcon(); //reset the icons for the player's team
      }

      if (!qpo.trainingMode){ //animate the pie, but not in AI-training mode
        qpo.timer.pie.attr({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, 269]});
        qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
      }
    }

    setTimeout(function(){ //Set up the newTurn interval, the pie animation, and the collision detection
      qpo.turnStarter = setInterval(newTurn, 3000*qpo.timeScale);
      qpo.blue.units[0].activate();
      qpo.timer.pie.animate({segment: [qpo.guiCoords.turnTimer.x, qpo.guiCoords.turnTimer.y, qpo.guiCoords.turnTimer.r, -90, -90]}, 3000*qpo.timeScale);
      qpo.collisionDetector = setInterval(function(){qpo.detectCollisions(qpo.activeGame.po)}, 50);
    }, 4500);
  }])
qpo.missions[2] = new qpo.Mission([false, 2, function(){}])
qpo.missions[3] = new qpo.Mission([false, 3, function(){}])
